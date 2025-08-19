import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable'; // Adjust path as needed
import BlobsTable from '../components/BlobsTable'; // Adjust path as needed
import { sendCommand, viewBlobs, getBasePresetPolicy } from '../services/api'; // Adjust path as needed
import { getPresetGroups, getPresetsByGroup } from '../services/file_auth';
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
            id: groupName,
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

      <button
        type="button"
        className="toggle-presets-button"
        onClick={() => {
          setShowPresets((v) => !v);
          setShowEmptyButtons((v) => !v);
        }}
      >
        {showPresets ? 'Hide Presets' : 'Show Presets'}
      </button>

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
            <button
              type="button"
              className="paste-button"
              onClick={handlePasteFromClipboard}
              title="Paste from clipboard"
            >
              📋 Paste
            </button>
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
    </div>
  );
};

export default Client;