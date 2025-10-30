import React, { useState, useEffect } from 'react';
import { AnylogJsonTable, PluginCard, PluginButton, commonStyles } from '../components';

// Get API URL from environment or default to localhost:8000
const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

const NodecheckPage = ({ node }) => {
  const [results, setResults] = useState({
    status: null,
    processes: null,
    connections: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-run checks when node changes
  useEffect(() => {
    if (node) {
      runChecks();
    }
  }, [node]);

  const runChecks = async () => {
    if (!node) return;

    setLoading(true);
    setError(null);
    setResults({ status: null, processes: null, connections: null });

    try {
      const request = { connection: node };
      
      const [statusResult, processesResult, connectionsResult] = await Promise.all([
        fetch(`${API_URL}/nodecheck/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        }).then(res => res.json()),
        fetch(`${API_URL}/nodecheck/processes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        }).then(res => res.json()),
        fetch(`${API_URL}/nodecheck/connections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request)
        }).then(res => res.json())
      ]);

      setResults({
        status: statusResult.success ? statusResult : null,
        processes: processesResult.success ? processesResult : null,
        connections: connectionsResult.success ? connectionsResult : null
      });
    } catch (err) {
      setError(err.message || 'Failed to run checks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h1>🔍 Node Check Plugin</h1>
        {node && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <span style={{ fontWeight: 'bold' }}>Checking:</span>
            <span style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              {node}
            </span>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: '15px', fontSize: '16px' }}>Running node checks...</p>
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Status */}
        <PluginCard 
          title="📊 Status" 
          icon="📊"
          style={{ marginBottom: '20px' }}
        >
          {results.status ? (
            <div>
              {typeof results.status.data === 'object' && results.status.data !== null ? (
                <AnylogJsonTable 
                  data={results.status.data} 
                  className="nodecheck-status-table"
                />
              ) : (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {typeof results.status.data === 'string' 
                    ? results.status.data 
                    : JSON.stringify(results.status.data, null, 2)
                  }
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              color: '#6c757d', 
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '20px'
            }}>
              No status data
            </div>
          )}
        </PluginCard>

        {/* Processes */}
        <PluginCard 
          title="⚙️ Processes" 
          icon="⚙️"
          style={{ marginBottom: '20px' }}
        >
          {results.processes ? (
            <div>
              {typeof results.processes.data === 'object' && results.processes.data !== null ? (
                <AnylogJsonTable 
                  data={results.processes.data} 
                  className="nodecheck-processes-table"
                />
              ) : (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(results.processes.data, null, 2)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              color: '#6c757d', 
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '20px'
            }}>
              No processes data
            </div>
          )}
        </PluginCard>

        {/* Connections */}
        <PluginCard 
          title="🌐 Connections" 
          icon="🌐"
          style={{ marginBottom: '20px' }}
        >
          {results.connections ? (
            <div>
              {typeof results.connections.data === 'object' && results.connections.data !== null ? (
                <AnylogJsonTable 
                  data={results.connections.data} 
                  className="nodecheck-connections-table"
                />
              ) : (
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(results.connections.data, null, 2)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              color: '#6c757d', 
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '20px'
            }}>
              No connections data
            </div>
          )}
        </PluginCard>
      </div>

      {/* Plugin Info */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '8px',
        border: '1px solid #bbdefb'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🔍 Node Check Plugin Info</h4>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>
          This plugin demonstrates:
        </p>
        <ul style={{ margin: '5px 0', fontSize: '14px' }}>
          <li>Node health monitoring</li>
          <li>Process and connection checking</li>
          <li>Real-time data display</li>
          <li>Error handling and validation</li>
        </ul>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default NodecheckPage;
