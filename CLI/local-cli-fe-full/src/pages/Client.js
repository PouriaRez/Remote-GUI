import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable'; // Adjust path as needed
import BlobsTable from '../components/BlobsTable'; // Adjust path as needed
import { sendCommand, viewBlobs, getBasePresetPolicy } from '../services/api'; // Adjust path as needed
import { getPresetGroups, getPresetsByGroup, addPreset, addPresetGroup } from '../services/file_auth';
import '../styles/Client.css'; // Optional: create client-specific CSS
import { useEffect } from 'react';
import { set } from 'mongoose';

const Client = ({ node }) => {
  const navigate = useNavigate();
  // Since the node is provided as a prop, we no longer need a "Connect info" field.
  const [authUser, setAuthUser] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [command, setCommand] = useState('get status');
  const [method, setMethod] = useState('GET');
  const [presetGroups, setPresetGroups] = useState([]);
  const [showPresets, setShowPresets] = useState(true);
  const [showEmptyButtons, setShowEmptyButtons] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [resultType, setResultType] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [selectedBlobs, setSelectedBlobs] = useState([]);
  
  // Bookmark functionality
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [bookmarkGroupId, setBookmarkGroupId] = useState('');
  const [bookmarkButtonName, setBookmarkButtonName] = useState('');
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [bookmarkError, setBookmarkError] = useState('');
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    console.log('Selected blobs:', selectedBlobs);
  }, [selectedBlobs]);

  // Fetch presets once on mount
  useEffect(() => {
    (async () => {
      try {
        const check1 = await getPresetGroups();
        // console.log('Preset groups check:', check1);
        // For each group in check1.data, fetch its presets
        const groupPresets = [];
        for (const group of check1.data) {
          // console.log('Processing group:', group);
          const id = group.id;
          const presets = await getPresetsByGroup({
            groupId: id
          });
          // console.log(`Presets for group ${group.group_name}:`, presets);

          const groupName = group.group_name;
          const obj = {
            id: group.id, // Use the actual group ID from API
            name: groupName,
            presets: presets.data.map(p => ({
              id: p.button,
              buttonName: p.button || p.name, // fallback to name if button_name is missing
              type: p.type.toUpperCase(),
              command: p.command
            }))
          };
          groupPresets.push(obj);
        }
        console.log('Presets by group:', groupPresets);

        setPresetGroups(groupPresets);

        
        // const groups = await getBasePresetPolicy();
        // const rawGroups = groups.data;
        // const groupsArray = Object.entries(rawGroups).map(
        //   ([groupName, presetsObj]) => ({
        //     id: groupName,
        //     name: groupName,
        //     presets: Object.entries(presetsObj).map(
        //       ([presetName, { type, command }]) => ({
        //         id: presetName,
        //         buttonName: presetName,
        //         type: type.toUpperCase(),
        //         command,
        //       })
        //     ),
        //   })
        // );
        // setPresetGroups(groupsArray);
      } catch (err) {
        console.error('Failed to load presets', err);
      }
    })();
  }, []);

  const handleApplyPreset = ({ command: cmd, type }) => {
    setCommand(cmd);
    setMethod(type.toUpperCase());
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCommand(text);
    } catch (err) {
      console.error('Failed to read from clipboard:', err);
      setError('Failed to paste from clipboard. Please check clipboard permissions.');
    }
  };

  const toggleAuth = () => {
    setShowAuth(!showAuth);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponseData(null);
    setResultType('');

    try {
      const result = await sendCommand({
        connectInfo: node,
        method,
        command,
        authUser,
        authPassword,
      });

      setResultType(result.type);

      // If the API returns an array (table data), store it directly.
      if (result.type === 'table') {
        setResponseData(result.data);
      } else if (result.type === 'blobs') {
        setResponseData(result.data);
        setSelectedBlobs([]); // clear any previous selection
      } else if (result.type === 'json') {
        setResponseData(
          `Command "${command}" was sent to ${node}.\n\n\n${JSON.stringify(
            result.data,
            null,
            2
          )}`
        );
      } else {
        // For string responses, display the data directly without JSON.stringify
        setResponseData(
          `Command "${command}" was sent to ${node}.\n\n\n${result.data}`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBlobs = async () => {
    if (selectedBlobs.length === 0) {
      return alert('Please select one or more blobs first.');
    }
    setLoading(true);
    setError(null);

    try {
      // Build a comma-separated list of IDs (adjust if your blobs use a different key)
      const blobs = { blobs: selectedBlobs };
      // console.log('Fetching blobs:', blobs);
      const result = await viewBlobs({
        connectInfo: node,
        blobs: blobs,
      });

      console.log('Result:', result);
      // // Reuse your existing state machinery to display the new result
      // setResultType(result.type);
      // setResponseData(result.type === 'table' || result.type === 'blobs'
      //   ? result.data
      //   : JSON.stringify(result.data, null, 2)
      // );
      // if (result.type === 'blobs') {
      //   setSelectedBlobs([]); // optionally clear selection if you want
      // }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      navigate('/dashboard/viewfiles', { state: { blobs: selectedBlobs } });
    }
  };

  const handleBookmarkCommand = () => {
    if (!command.trim()) {
      setError('Please enter a command to bookmark');
      return;
    }
    setBookmarkError('');
    setBookmarkButtonName(command.substring(0, 30) + (command.length > 30 ? '...' : ''));
    setShowBookmarkModal(true);
  };

  const handleSaveBookmark = async () => {
    if (!bookmarkGroupId || !bookmarkButtonName.trim()) {
      setBookmarkError('Please select a group and enter a button name');
      return;
    }

    setBookmarkLoading(true);
    setBookmarkError('');

    try {
      console.log('Saving bookmark with data:', {
        group_id: bookmarkGroupId,
        command: command.trim(),
        type: method,
        button: bookmarkButtonName.trim()
      });
      
      const result = await addPreset({
        preset: {
          group_id: bookmarkGroupId,
          command: command.trim(),
          type: method,
          button: bookmarkButtonName.trim()
        }
      });
      
      console.log('Bookmark save result:', result);

      // Close modal and show success
      setShowBookmarkModal(false);
      setBookmarkGroupId('');
      setBookmarkButtonName('');
      setError(null);
      
      // Refresh presets to show the new bookmark
      const check1 = await getPresetGroups();
      const groupPresets = [];
      for (const group of check1.data) {
        const id = group.id;
        const presets = await getPresetsByGroup({ groupId: id });
        const groupName = group.group_name;
        const obj = {
          id: group.id, // Use the actual group ID from API
          name: groupName,
          presets: presets.data.map(p => ({
            id: p.button,
            buttonName: p.button || p.name,
            type: p.type.toUpperCase(),
            command: p.command
          }))
        };
        groupPresets.push(obj);
      }
      setPresetGroups(groupPresets);
      
      alert('Command bookmarked successfully!');
    } catch (err) {
      setBookmarkError(err.message);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleCancelBookmark = () => {
    setShowBookmarkModal(false);
    setBookmarkGroupId('');
    setBookmarkButtonName('');
    setBookmarkError('');
    setShowNewGroupInput(false);
    setNewGroupName('');
  };

  const handleCreateNewGroup = async () => {
    if (!newGroupName.trim()) {
      setBookmarkError('Please enter a group name');
      return;
    }

    setBookmarkLoading(true);
    setBookmarkError('');

    try {
      const result = await addPresetGroup({ name: newGroupName.trim() });
      
      // Refresh preset groups to include the new one
      const check1 = await getPresetGroups();
      const groupPresets = [];
      for (const group of check1.data) {
        const id = group.id;
        const presets = await getPresetsByGroup({ groupId: id });
        const groupName = group.group_name;
        const obj = {
          id: group.id, // Use the actual group ID from API
          name: groupName,
          presets: presets.data.map(p => ({
            id: p.button,
            buttonName: p.button || p.name,
            type: p.type.toUpperCase(),
            command: p.command
          }))
        };
        groupPresets.push(obj);
      }
      setPresetGroups(groupPresets);
      
      // Set the new group as selected
      setBookmarkGroupId(groupPresets.find(g => g.name === newGroupName.trim())?.id || '');
      setShowNewGroupInput(false);
      setNewGroupName('');
      setBookmarkError('');
    } catch (err) {
      setBookmarkError(err.message);
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <div className="client-container">
      <h2>Client Dashboard</h2>
      
      {!node ? (
        <div className="no-node-message">
          <h3>No Node Selected</h3>
          <p>Please select a node from the dropdown in the top bar to connect to an AnyLog instance.</p>
          <p>You can add a new node by entering an IP:Port (e.g., "192.168.1.100:32349") in the input field and clicking "Use".</p>
        </div>
      ) : (
        <>
          <p>
            <strong>Connected Node:</strong> {node}
          </p>

      {/* Hiding Presets for now */}
      {/* <button
        type="button"
        className="toggle-presets-button"
        onClick={() => {
          setShowPresets((v) => !v);
          setShowEmptyButtons((v) => !v);
        }}
      >
        {showPresets ? 'Hide Presets' : 'Show Presets'}
      </button> */}

      {/* PRESETS PANEL */}
      {showPresets && presetGroups.length > 0 && (
        <div className="presets-panel">
          {presetGroups.map((group) => (
            <details key={group.id} className="preset-group">
              <summary>{group.name}</summary>
              <div className="preset-buttons">
                {group.presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="preset-button"
                    onClick={() =>
                      handleApplyPreset({ command: p.command, type: p.type })
                    }
                  >
                    {p.buttonName}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}




      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-group">
          <label>HTTP Method:</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
          </select>
        </div>

        {/* Toggle for authentication options */}
        <div className="form-group">
          <button
            type="button"
            className="toggle-auth-button"
            onClick={toggleAuth}
          >
            {showAuth ? 'Hide Authentication Options' : 'Show Authentication Options'}
          </button>
        </div>

        {/* Authentication fields (hidden unless toggled) */}
        {showAuth && (
          <>
            <div className="form-group">
              <label>Auth User:</label>
              <input
                type="text"
                value={authUser}
                onChange={(e) => setAuthUser(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Auth Password:</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Command:</label>
          <div className="command-input-container">
            <div className="command-buttons">
              <button
                type="button"
                className="paste-button"
                onClick={handlePasteFromClipboard}
                title="Paste from clipboard"
              >
                📋 Paste
              </button>
              <button 
                type="button" 
                className="bookmark-button-small"
                onClick={handleBookmarkCommand}
                disabled={loading || !command.trim()}
                title="Bookmark this command"
              >
                🔖 Bookmark
              </button>
            </div>
            <textarea
              rows={2}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="send-button">
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {resultType === 'blobs' && (
        <div className="selected-blobs">
          <h3>Selected Blobs:</h3>
          {selectedBlobs.length > 0 ? (
            <ul>
              {selectedBlobs.map((blob, i) => (
                <li key={i}>{JSON.stringify(blob)}</li>
              ))}
            </ul>
          ) : (
            <p>No blobs selected.</p>
          )}
          <button
            onClick={handleViewBlobs}
            disabled={selectedBlobs.length === 0 || loading}
            className="view-blobs-button"
          >
            {loading ? 'Loading...' : 'View Blobs'}
          </button>
        </div>
      )}

      {responseData && (
        <div className="response-box">
          {resultType === 'table' && Array.isArray(responseData) && (
            <DataTable data={responseData} />
          )}

          {resultType === 'blobs' && Array.isArray(responseData) && (
            <BlobsTable
              data={responseData}
              keyField="id" // adjust if blobs use a different unique key
              onSelectionChange={setSelectedBlobs}
            />
          )}

          {resultType !== 'table' && resultType !== 'blobs' && (
            <pre>{responseData}</pre>
          )}
        </div>
      )}
        </>
      )}

      {/* Bookmark Modal */}
      {showBookmarkModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>🔖 Bookmark Command</h3>
            <div className="modal-body">
              <div className="form-group">
                <label>Command to bookmark:</label>
                <pre className="command-preview">{command}</pre>
              </div>
              
              <div className="form-group">
                <label>Select Group:</label>
                <div className="group-select-container">
                  <select 
                    value={bookmarkGroupId} 
                    onChange={(e) => setBookmarkGroupId(e.target.value)}
                    className="group-select"
                    disabled={showNewGroupInput}
                  >
                    <option value="">Select a group...</option>
                    {presetGroups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    className="new-group-button"
                    onClick={() => setShowNewGroupInput(!showNewGroupInput)}
                    disabled={bookmarkLoading}
                  >
                    {showNewGroupInput ? 'Cancel' : '+ New Group'}
                  </button>
                </div>
                
                {showNewGroupInput && (
                  <div className="new-group-input-container">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Enter new group name..."
                      className="group-name-input"
                    />
                    <button 
                      type="button"
                      className="create-group-button"
                      onClick={handleCreateNewGroup}
                      disabled={bookmarkLoading || !newGroupName.trim()}
                    >
                      {bookmarkLoading ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Button Name:</label>
                <input
                  type="text"
                  value={bookmarkButtonName}
                  onChange={(e) => setBookmarkButtonName(e.target.value)}
                  placeholder="Enter a name for this bookmark..."
                  className="button-name-input"
                />
              </div>
              
              {bookmarkError && (
                <div className="error-message">{bookmarkError}</div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                onClick={handleSaveBookmark}
                disabled={bookmarkLoading || !bookmarkGroupId || !bookmarkButtonName.trim()}
                className="save-bookmark-button"
              >
                {bookmarkLoading ? 'Saving...' : '💾 Save Bookmark'}
              </button>
              <button 
                onClick={handleCancelBookmark}
                disabled={bookmarkLoading}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Client;