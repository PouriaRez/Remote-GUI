import React, { useState, useEffect } from 'react';
import { AnylogJsonTable, PluginCard, PluginButton, commonStyles } from '../components';

// Get API URL from environment or default to localhost:8000
const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

const ExamplePage = ({ node }) => {
  const [message, setMessage] = useState('');
  const [data, setData] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pluginInfo, setPluginInfo] = useState(null);
  const [status, setStatus] = useState(null);

  // Load plugin information on component mount
  useEffect(() => {
    loadPluginInfo();
    loadStatus();
  }, []);

  const loadPluginInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/example/`);
      const info = await response.json();
      setPluginInfo(info);
    } catch (error) {
      console.error('Failed to load plugin info:', error);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/example/status`);
      const statusData = await response.json();
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleProcess = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/example/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          data: data
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResult(result);
    } catch (error) {
      console.error('Error processing data:', error);
      alert('Failed to process data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addDataField = () => {
    const key = prompt('Enter data key:');
    const value = prompt('Enter data value:');
    if (key && value) {
      setData(prev => ({ ...prev, [key]: value }));
    }
  };

  const removeDataField = (key) => {
    setData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔌 Example Plugin</h1>
      
      {pluginInfo && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3>Plugin Information</h3>
          <p><strong>Name:</strong> {pluginInfo.name}</p>
          <p><strong>Version:</strong> {pluginInfo.version}</p>
          <p><strong>Description:</strong> {pluginInfo.description}</p>
          <p><strong>Available Endpoints:</strong> {pluginInfo.endpoints?.join(', ')}</p>
        </div>
      )}

      {status && (
        <div style={{ 
          background: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3>Plugin Status</h3>
          <p><strong>Status:</strong> {status.status}</p>
          <p><strong>Uptime:</strong> {status.uptime}</p>
          <p><strong>Requests Processed:</strong> {status.requests_processed}</p>
        </div>
      )}

      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        border: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <h3>Process Data</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Message:
          </label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter a message to process"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Additional Data:
          </label>
          <button 
            onClick={addDataField}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            Add Data Field
          </button>
          
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '5px',
              padding: '5px',
              background: '#f9f9f9',
              borderRadius: '4px'
            }}>
              <span style={{ marginRight: '10px' }}><strong>{key}:</strong> {value}</span>
              <button 
                onClick={() => removeDataField(key)}
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button 
          onClick={handleProcess}
          disabled={loading}
          style={{
            background: loading ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Processing...' : 'Process Data'}
        </button>
      </div>

      {result && (
        <div style={{ 
          background: '#d4edda', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #c3e6cb'
        }}>
          <h3>Processing Result</h3>
          <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
          <p><strong>Message:</strong> {result.message}</p>
          <p><strong>Timestamp:</strong> {result.timestamp}</p>
          <div>
            <strong>Processed Data:</strong>
            <pre style={{ 
              background: '#f8f9fa', 
              padding: '10px', 
              borderRadius: '4px',
              marginTop: '10px',
              overflow: 'auto'
            }}>
              {JSON.stringify(result.processed_data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamplePage;
