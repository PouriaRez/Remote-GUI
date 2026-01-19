import React, { useState, useEffect } from 'react';
import './UNSPage.css';

const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

const UNSPage = ({ node }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPath, setCurrentPath] = useState([]); // Array of {id, name, data}
  const [layers, setLayers] = useState([]); // Array of arrays, each array is a layer of items
  const [expandedItems, setExpandedItems] = useState(new Set()); // Track which items are expanded
  const [itemsWithChildren, setItemsWithChildren] = useState(new Set()); // Cache which items have children
  const [itemsWithoutChildren, setItemsWithoutChildren] = useState(new Set()); // Cache which items don't have children
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // Selected item for side panel
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false); // Side panel visibility

  // Load root items on mount
  useEffect(() => {
    if (node) {
      loadRootItems();
    }
  }, [node]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  const loadRootItems = async () => {
    if (!node) {
      setError('No node selected. Please select a node first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/uns/get-root`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conn: node }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Log the structure for debugging
        console.log('UNS: Root items received:', result.data);
        if (result.data.length > 0) {
          console.log('UNS: First item structure:', result.data[0]);
        }
        
        // Initialize with root layer
        setLayers([result.data]);
        setCurrentPath([]);
        setExpandedItems(new Set());
      } else {
        setError('Failed to load root items');
      }
    } catch (err) {
      console.error('Error loading root items:', err);
      setError(err.message || 'Failed to load root items');
    } finally {
      setLoading(false);
    }
  };

  const getItemId = (item) => {
    if (!item || typeof item !== 'object') {
      return null;
    }
    
    // Handle structure: {key: {data}} - find the nested object first
    const keys = Object.keys(item);
    if (keys.length === 1 && typeof item[keys[0]] === 'object' && !Array.isArray(item[keys[0]])) {
      // This is the {key: {data}} structure
      const nested = item[keys[0]];
      if (nested.id) return nested.id;
    }
    
    // Also check for legacy structures
    if (item.namespace && item.namespace.id) return item.namespace.id;
    if (item.device && item.device.id) return item.device.id;
    if (item.sensor && item.sensor.id) return item.sensor.id;
    if (item.id) return item.id;
    
    return null;
  };

  const getItemName = (item) => {
    if (!item || typeof item !== 'object') {
      return String(item || 'Unknown');
    }
    
    // Handle structure: {key: {data}} - this is the main structure
    const keys = Object.keys(item);
    if (keys.length === 1 && typeof item[keys[0]] === 'object' && !Array.isArray(item[keys[0]])) {
      // This is the {key: {data}} structure - extract from nested object
      const nested = item[keys[0]];
      // First try 'name' field (preferred)
      if (nested.name) return nested.name;
      // Then try 'id' field
      if (nested.id) return nested.id;
    }
    
    // Legacy structures (namespace, device, sensor)
    if (item.namespace) {
      if (item.namespace.name) return item.namespace.name;
      if (item.namespace.id) return item.namespace.id;
    }
    if (item.device) {
      if (item.device.name) return item.device.name;
      if (item.device.id) return item.device.id;
    }
    if (item.sensor) {
      if (item.sensor.name) return item.sensor.name;
      if (item.sensor.id) return item.sensor.id;
    }
    
    // Check top-level fields
    if (item.name) return item.name;
    if (item.id) return item.id;
    
    // Check all keys for nested objects that might have name/id
    for (const key of keys) {
      if (item[key] && typeof item[key] === 'object' && !Array.isArray(item[key])) {
        const nested = item[key];
        if (nested.name) return nested.name;
        if (nested.id) return nested.id;
      }
    }
    
    // Last resort: use the first meaningful string value
    for (const key of keys) {
      if (typeof item[key] === 'string' && item[key].trim() && key !== 'date' && key !== 'ledger') {
        return item[key];
      }
    }
    
    // If we have a single key, use that as the name
    if (keys.length === 1) {
      return keys[0];
    }
    
    // Final fallback - use a truncated JSON representation
    const jsonStr = JSON.stringify(item);
    if (jsonStr.length > 0) {
      return jsonStr.substring(0, 30) + (jsonStr.length > 30 ? '...' : '');
    }
    
    return 'Unknown';
  };

  const getItemType = (item) => {
    if (!item || typeof item !== 'object') {
      return 'unknown';
    }
    
    // Handle structure: {key: {data}} - use the key as the type
    const keys = Object.keys(item);
    if (keys.length === 1 && typeof item[keys[0]] === 'object' && !Array.isArray(item[keys[0]])) {
      return keys[0]; // Return the key (config, master, license, cluster, operator, table, etc.)
    }
    
    // Legacy structures
    if (item.namespace) return 'namespace';
    if (item.device) return 'device';
    if (item.sensor) return 'sensor';
    
    return 'unknown';
  };

  const getItemData = (item) => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    
    // Handle structure: {key: {data}} - return the nested data object
    const keys = Object.keys(item);
    if (keys.length === 1 && typeof item[keys[0]] === 'object' && !Array.isArray(item[keys[0]])) {
      return item[keys[0]]; // Return the nested data object
    }
    
    // Legacy structures
    if (item.namespace) return item.namespace;
    if (item.device) return item.device;
    if (item.sensor) return item.sensor;
    
    return item;
  };

  const hasChildren = async (itemId) => {
    // Check if item has children by trying to fetch them
    try {
      const response = await fetch(`${API_URL}/uns/get-children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conn: node, item_id: itemId }),
      });

      if (!response.ok) return false;

      const result = await response.json();
      return result.success && result.data && result.data.length > 0;
    } catch {
      return false;
    }
  };

  const expandItem = async (item, layerIndex) => {
    const itemId = getItemId(item);
    if (!itemId) {
      console.log('UNS: Cannot expand item - no ID found:', item);
      return;
    }

    const expandedKey = `${layerIndex}-${itemId}`;
    
    // If already expanded, collapse it
    if (expandedItems.has(expandedKey)) {
      const newExpanded = new Set(expandedItems);
      newExpanded.delete(expandedKey);
      setExpandedItems(newExpanded);
      
      // Remove layers after this one
      const newLayers = layers.slice(0, layerIndex + 1);
      setLayers(newLayers);
      setCurrentPath(currentPath.slice(0, layerIndex));
      // Scroll to top when collapsing
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);

    // Log the command being sent
    const command = `blockchain get * where [id] = "${itemId}" bring.children`;
    console.log('UNS: Clicking on item:', {
      itemId: itemId,
      itemName: getItemName(item),
      itemType: getItemType(item),
      command: command,
      connection: node
    });

    try {
      const response = await fetch(`${API_URL}/uns/get-children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conn: node, item_id: itemId }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const result = await response.json();
      
      console.log('UNS: Response received:', {
        success: result.success,
        dataLength: result.data ? result.data.length : 0,
        hasChildren: result.data && result.data.length > 0
      });
      
      if (result.success && result.data !== undefined) {
        const children = result.data;
        
        // Cache whether this item has children
        const itemKey = `${layerIndex}-${itemId}`;
        if (children && children.length > 0) {
          console.log(`UNS: Item ${itemId} has ${children.length} children`);
          const newHasChildren = new Set(itemsWithChildren);
          newHasChildren.add(itemKey);
          setItemsWithChildren(newHasChildren);
          
          // Mark as expanded
          const newExpanded = new Set(expandedItems);
          newExpanded.add(expandedKey);
          setExpandedItems(newExpanded);

          // Add new layer
          const newLayers = [...layers.slice(0, layerIndex + 1), children];
          setLayers(newLayers);

          // Update path
          const newPath = [...currentPath.slice(0, layerIndex), {
            id: itemId,
            name: getItemName(item),
            data: getItemData(item)
          }];
          setCurrentPath(newPath);
          
          // Scroll to top when expanding to new layer
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // No children - mark as leaf node
          console.log(`UNS: Item ${itemId} has no children (empty array or undefined)`);
          const newNoChildren = new Set(itemsWithoutChildren);
          newNoChildren.add(itemKey);
          setItemsWithoutChildren(newNoChildren);
        }
      } else {
        setError('Failed to load children');
      }
    } catch (err) {
      console.error('Error expanding item:', err);
      setError(err.message || 'Failed to expand item');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLayer = (targetLayerIndex) => {
    // Navigate back to a specific layer
    const newLayers = layers.slice(0, targetLayerIndex + 1);
    setLayers(newLayers);
    setCurrentPath(currentPath.slice(0, targetLayerIndex));
    
    // Update expanded items to match - only items in the path up to targetLayerIndex
    const newExpanded = new Set();
    const newHasChildren = new Set();
    
    // Mark items in the path as expanded and having children
    for (let i = 0; i < targetLayerIndex; i++) {
      if (i < currentPath.length) {
        const pathItem = currentPath[i];
        const key = `${i}-${pathItem.id}`;
        newExpanded.add(key);
        newHasChildren.add(key);
      }
    }
    
    setExpandedItems(newExpanded);
    // Merge with existing itemsWithChildren to preserve cache
    const mergedHasChildren = new Set([...itemsWithChildren, ...newHasChildren]);
    setItemsWithChildren(mergedHasChildren);
    // Keep itemsWithoutChildren as is - we don't need to clear it
    
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemHover = (e, item) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // Set a timeout to show tooltip after 1 second
    const timeout = setTimeout(() => {
      setHoveredItem(item);
      setHoverPosition({ x: e.clientX, y: e.clientY });
    }, 1000);
    
    setHoverTimeout(timeout);
  };

  const handleItemLeave = () => {
    // Clear the timeout if user leaves before 1 second
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setHoveredItem(null);
  };

  const renderItem = (item, layerIndex, itemIndex) => {
    const itemId = getItemId(item);
    const itemName = getItemName(item);
    const itemType = getItemType(item);
    const itemData = getItemData(item);
    const expandedKey = `${layerIndex}-${itemId}`;
    const itemKey = `${layerIndex}-${itemId}`;
    const isExpanded = expandedItems.has(expandedKey);
    
    // Check if this item has children
    // If we've already checked and it has no children, it's a leaf
    const hasNoChildren = itemsWithoutChildren.has(itemKey);
    // If we've already checked and it has children, or if it's expanded (meaning we loaded children), it has children
    const hasChildren = itemsWithChildren.has(itemKey) || isExpanded;
    // If we haven't checked yet, assume it might have children (we'll find out when expanding)
    const mightHaveChildren = !hasNoChildren;
    
    // Determine icon based on whether item has children (not based on type)
    let icon = '📄'; // Default file icon
    if (mightHaveChildren) {
      icon = isExpanded ? '📂' : '📁'; // Folder icons
    } else if (hasNoChildren) {
      // Item confirmed to have no children - use file icon
      icon = '📄';
    }

    const handleItemClick = (e) => {
      // Left click: only expand/collapse if item has children
      if (mightHaveChildren) {
        expandItem(item, layerIndex);
      }
    };

    const handleItemRightClick = (e) => {
      // Right click: toggle side panel with item details
      e.preventDefault(); // Prevent default browser context menu
      
      const isCurrentlySelected = selectedItem && getItemId(selectedItem) === itemId;
      
      // If clicking on the already selected item and panel is open, close it
      if (isCurrentlySelected && isSidePanelOpen) {
        setIsSidePanelOpen(false);
        setSelectedItem(null);
      } else {
        // Otherwise, open/update the side panel with this item
        setSelectedItem(item);
        setIsSidePanelOpen(true);
      }
    };

    const isSelected = selectedItem && getItemId(selectedItem) === itemId;

    return (
      <div
        key={`${layerIndex}-${itemIndex}-${itemId}`}
        className={`uns-item ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}
        onMouseEnter={(e) => handleItemHover(e, item)}
        onMouseLeave={handleItemLeave}
        onClick={handleItemClick}
        onContextMenu={handleItemRightClick}
        style={{ cursor: mightHaveChildren ? 'pointer' : 'default' }}
      >
        <div className="uns-item-icon">
          {icon}
        </div>
        <div className="uns-item-name">{itemName}</div>
        {mightHaveChildren && (
          <div className="uns-item-expand">
            {isExpanded ? '▼' : '▶'}
          </div>
        )}
      </div>
    );
  };

  const navigateToRoot = () => {
    // Reset to root
    if (layers.length > 0) {
      setLayers([layers[0]]);
      setCurrentPath([]);
      setExpandedItems(new Set());
      // Clear children cache when going to root (optional - you might want to keep it)
      // setItemsWithChildren(new Set());
      // setItemsWithoutChildren(new Set());
    }
    // Scroll to top when going to root
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderBreadcrumb = () => {
    if (currentPath.length === 0) return null;

    return (
      <div className="uns-breadcrumb">
        <button 
          className="uns-breadcrumb-item" 
          onClick={navigateToRoot}
        >
          🏠 Root
        </button>
        {currentPath.map((pathItem, index) => {
          // The breadcrumb index corresponds to layer index + 1
          // path[0] shows layer 1, path[1] shows layer 2, etc.
          const targetLayerIndex = index + 1;
          const isCurrentLayer = targetLayerIndex === layers.length - 1;
          
          return (
            <React.Fragment key={index}>
              <span className="uns-breadcrumb-separator">/</span>
              <button
                className={`uns-breadcrumb-item ${isCurrentLayer ? 'uns-breadcrumb-current' : ''}`}
                onClick={() => {
                  // If clicking on the current layer, do nothing (or could scroll to top)
                  if (!isCurrentLayer) {
                    navigateToLayer(targetLayerIndex);
                  } else {
                    // Already on this layer, just scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{ 
                  cursor: isCurrentLayer ? 'default' : 'pointer',
                  fontWeight: isCurrentLayer ? 'bold' : 'normal'
                }}
              >
                {pathItem.name}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="uns-container">
      <div className="uns-header">
        <h1>Unified Namespace (UNS)</h1>
        <button 
          onClick={loadRootItems} 
          disabled={loading || !node}
          className="uns-refresh-btn"
        >
          🔄 Refresh
        </button>
      </div>

      {!node && (
        <div className="uns-error">
          ⚠️ No node selected. Please select a node first.
        </div>
      )}

      {error && (
        <div className="uns-error">
          ❌ Error: {error}
        </div>
      )}

      <div className={`uns-main-content ${isSidePanelOpen ? 'uns-panel-open' : ''}`}>
        <div className="uns-main-content-wrapper">
          {renderBreadcrumb()}

          <div className="uns-layers">
        {layers.length > 0 && (() => {
          // Only show the current layer (the last one)
          const currentLayerIndex = layers.length - 1;
          const currentLayer = layers[currentLayerIndex];
          const layerName = currentLayerIndex === 0 
            ? 'Root' 
            : (currentPath[currentLayerIndex - 1]?.name || `Layer ${currentLayerIndex}`);
          
          return (
            <div key={currentLayerIndex} className="uns-layer">
              <div className="uns-layer-header">
                {layerName}
              </div>
              <div className="uns-layer-content">
                {loading ? (
                  <div className="uns-loading">Loading...</div>
                ) : currentLayer.length === 0 ? (
                  <div className="uns-empty">No items found</div>
                ) : (
                  currentLayer.map((item, itemIndex) => renderItem(item, currentLayerIndex, itemIndex))
                )}
              </div>
            </div>
          );
        })()}
          </div>
        </div>

        {/* Side Panel for detailed view - always rendered but hidden when closed */}
        <div className={`uns-side-panel ${isSidePanelOpen ? 'open' : ''}`}>
          <div className="uns-side-panel-header">
            <h3>Item Details</h3>
            <button 
              className="uns-side-panel-close"
              onClick={() => {
                setIsSidePanelOpen(false);
                setSelectedItem(null);
              }}
            >
              ×
            </button>
          </div>
          <div className="uns-side-panel-content">
            {selectedItem && (
              <>
                <div className="uns-side-panel-info">
                  <div className="uns-side-panel-info-row">
                    <strong>Name:</strong> {getItemName(selectedItem)}
                  </div>
                  <div className="uns-side-panel-info-row">
                    <strong>Type:</strong> {getItemType(selectedItem)}
                  </div>
                  <div className="uns-side-panel-info-row">
                    <strong>ID:</strong> {getItemId(selectedItem)}
                  </div>
                </div>
                <div className="uns-side-panel-json">
                  <strong>JSON Data:</strong>
                  <pre>{JSON.stringify(getItemData(selectedItem), null, 2)}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {hoveredItem && (
        <div
          className="uns-tooltip"
          style={{
            left: `${hoverPosition.x + 10}px`,
            top: `${hoverPosition.y + 10}px`
          }}
        >
          <div className="uns-tooltip-header">
            <strong>{getItemName(hoveredItem)}</strong>
            <span className="uns-tooltip-type">({getItemType(hoveredItem)})</span>
          </div>
          <div className="uns-tooltip-content">
            <pre>{JSON.stringify(getItemData(hoveredItem), null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

// Plugin metadata
export const pluginMetadata = {
  name: 'Unified Namespace',
  icon: null
};

export default UNSPage;

