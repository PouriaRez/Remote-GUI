# External Plugin Components Guide

This guide explains how to use the components library available to external plugins.

## Importing Components

In your plugin's frontend files, you can import components like this:

```javascript
import React, { useState, useEffect } from 'react';
import { AnylogJsonTable, PluginCard, PluginButton, commonStyles } from '../components';
```

## Available Components

### AnylogJsonTable
A powerful table component for displaying JSON data with built-in filtering and formatting.

```javascript
<AnylogJsonTable 
  data={jsonData} 
  className="my-table"
/>
```

**Props:**
- `data` (object): JSON data to display in table format
- `className` (string): Additional CSS classes

**Features:**
- Automatic column detection
- Internal column filtering
- Status badge styling
- Responsive design
- JSON object/array handling

### PluginCard
A styled card component perfect for plugin content sections.

```javascript
<PluginCard 
  title="My Section" 
  icon="🔧"
  actions={<button>Action</button>}
  style={{ marginBottom: '20px' }}
>
  <p>Card content goes here</p>
</PluginCard>
```

**Props:**
- `title` (string): Card title
- `icon` (string): Icon to display next to title
- `actions` (React element): Action buttons for the card header
- `style` (object): Additional CSS styles

### PluginSection
A collapsible section component.

```javascript
<PluginSection 
  title="Collapsible Section" 
  collapsible={true}
>
  <p>This content can be collapsed</p>
</PluginSection>
```

**Props:**
- `title` (string): Section title
- `collapsible` (boolean): Whether the section can be collapsed
- `style` (object): Additional CSS styles

### PluginButton
A styled button component with multiple variants.

```javascript
<PluginButton 
  variant="primary" 
  size="md"
  onClick={handleClick}
>
  Click Me
</PluginButton>
```

**Props:**
- `variant` (string): Button style variant (`primary`, `secondary`, `success`, `danger`, `warning`, `info`, `outline`)
- `size` (string): Button size (`sm`, `md`, `lg`)
- `onClick` (function): Click handler
- `style` (object): Additional CSS styles

## Common Styles

The `commonStyles` object provides a consistent design system:

```javascript
import { commonStyles } from '../components';

// Colors
const primaryColor = commonStyles.colors.primary; // '#007bff'

// Spacing
const margin = commonStyles.spacing.md; // '16px'

// Typography
const fontSize = commonStyles.typography.fontSize.lg; // '18px'

// Shadows
const shadow = commonStyles.shadows.md;
```

## Example Plugin Structure

Here's how you might structure a plugin using these components:

```javascript
import React, { useState, useEffect } from 'react';
import { PluginCard, PluginButton, PluginSection, commonStyles } from '../components';

const MyPlugin = ({ node }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Plugin</h1>
      
      <PluginCard title="Data Section" icon="📊">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <AnylogJsonTable data={data} className="my-data-table" />
            <PluginButton 
              variant="primary" 
              onClick={() => setLoading(true)}
            >
              Refresh Data
            </PluginButton>
          </div>
        )}
      </PluginCard>

      <PluginSection title="Settings" collapsible={true}>
        <p>Plugin settings go here</p>
      </PluginSection>
    </div>
  );
};

export default MyPlugin;
```

## React Hooks

The components library also re-exports common React hooks:

```javascript
import { useState, useEffect, useCallback, useMemo, useContext } from '../components';
```

## Best Practices

1. **Use PluginCard for content sections** - Provides consistent styling and structure
2. **Use PluginButton for actions** - Ensures consistent button styling across plugins
3. **Use commonStyles for spacing and colors** - Maintains design consistency
4. **Use PluginSection for collapsible content** - Improves user experience for complex plugins
5. **Keep imports clean** - Only import what you need

## Styling Guidelines

- Use `commonStyles.colors` for consistent color scheme
- Use `commonStyles.spacing` for consistent spacing
- Use `commonStyles.typography` for consistent text styling
- Use `commonStyles.shadows` for consistent elevation
- Use `commonStyles.borderRadius` for consistent rounded corners

This ensures all plugins have a cohesive look and feel while maintaining the flexibility to customize as needed.
