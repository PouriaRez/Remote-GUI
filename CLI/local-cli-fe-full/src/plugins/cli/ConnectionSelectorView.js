import { useEffect, useState } from 'react';
import { FaComputer, FaDocker } from 'react-icons/fa6';
import { fetchAllNodes, normalizeNodes } from './utils/fetchNodes';
import { cliState } from './state/state';
import { CiTrash, CiStar } from 'react-icons/ci';
import { FaStar } from 'react-icons/fa';
import { TbBrandPowershell } from 'react-icons/tb';
import { Vault } from './storage/vault';
import {
  retrieveStoredCredential,
  storeCredentialInSession,
  saveCredentialToVault,
  clearStoredCredentials,
} from './storage/stateStorage';

const ConnectionSelectorView = () => {
  const { connectionsList, setConnectionsList, removeConnection } = cliState();
  const { setActiveConnection, activeConnection, credLocked } = cliState();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [authMethod, setAuthMethod] = useState('password');
  const [authPassword, setAuthPassword] = useState('');
  const [keyFile, setKeyFile] = useState(null);
  const [connectionsTab, setConnectionsTab] = useState('all');
  const [activeTerminals, setActiveTerminals] = useState(null);
  const [saveToVault, setSaveToVault] = useState(false);
  const [starredConns, setStarredConns] = useState(() => {
    const stored = localStorage.getItem('starredConnections');
    return stored ? JSON.parse(stored) : [];
  });
  const [sortedConns, setSortedConns] = useState(null);

  const handleRemoveConnection = (id) => {
    removeConnection(id);
  };

  const handleConnectClick = (conn, conn_action) => {
    setSelectedConnection(conn);
    setSelectedAction(conn_action);
    setAuthPassword('');
    setKeyFile(null);
    setAuthMethod('password');
    setSaveToVault(false);

    const storedPassword = retrieveStoredCredential(conn.hostname, 'password');
    const storedKey = retrieveStoredCredential(conn.hostname, 'keyfile');

    if (storedPassword) {
      setAuthPassword(storedPassword);
      setAuthMethod('password');
    }

    if (storedKey) {
      setKeyFile(storedKey);
      console.log(`Autofilling key:`, storedKey);
      setAuthMethod('keyfile');
    }

    setShowAuthModal(true);
  };

  const handleAuthSubmit = async () => {
    if (authMethod === 'password' && !authPassword) {
      alert('Please enter a password');
      return;
    }
    if (authMethod === 'keyfile' && !keyFile) {
      alert('Please upload a key file');
      return;
    }

    if (saveToVault) {
      console.log('Attempting to save to vault:', {
        hostname: selectedConnection.hostname,
        type: authMethod,
      });

      try {
        if (authMethod === 'keyfile') {
          await saveCredentialToVault(
            selectedConnection.hostname,
            'keyfile',
            keyFile,
          );
        } else if (authMethod === 'password') {
          await saveCredentialToVault(
            selectedConnection.hostname,
            'password',
            authPassword,
          );
        }
        console.log('✅ Credential saved to vault successfully');
      } catch (err) {
        console.error('❌ Failed to save to vault:', err);
        const errorMsg = err.message || 'Failed to save credential to vault';
        alert(`${errorMsg}\n\nProceeding with session-only storage.`);
      }
    }

    if (authMethod === 'keyfile') {
      storeCredentialInSession(selectedConnection.hostname, 'keyfile', keyFile);
    } else if (authMethod === 'password') {
      storeCredentialInSession(
        selectedConnection.hostname,
        'password',
        authPassword,
      );
    }

    const uuid =
      selectedAction === 'docker_attach'
        ? `${selectedConnection.ip}-${selectedAction}`
        : `${selectedConnection.ip}-${Date.now()}`;

    setActiveConnection(uuid, {
      ...selectedConnection,
      user: 'root',
      credential: authMethod === 'keyfile' ? keyFile.contents : authPassword,
      action: selectedAction ?? 'direct_ssh',
      authType: authMethod,
      isConnected: false,
    });
    setShowAuthModal(false);
  };

  useEffect(() => {
    setActiveTerminals(activeConnection);
  }, [activeConnection]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      const text = await file.text();
      if (
        !text.includes('BEGIN OPENSSH PRIVATE KEY') &&
        !text.includes('BEGIN RSA PRIVATE KEY')
      ) {
        alert('Not a valid SSH private key');
        return;
      }

      setKeyFile({ name: file.name, contents: text });
    } catch (err) {
      console.error('Failed to read file', err);
    }
  };

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const rawNodes = await fetchAllNodes();
        const nodeData = normalizeNodes(rawNodes);
        setConnectionsList(
          Object.values(nodeData)
            .flat()
            .map((node) => ({ ...node, starred: false }))
            .sort((n1, n2) => n1.hostname.localeCompare(n2.hostname)),
        );
      } catch (e) {
        console.error(`Failed fetching nodes: `, e);
      }
    };
    fetchNodes();
  }, [setConnectionsList]);

  const getSortedConnections = (connections) => {
    const sorted = [...connections].sort((a, b) => {
      return a.hostname.localeCompare(b.hostname);
    });

    const nonStarredConns = sorted.filter(
      (conn) => !starredConns.some((sc) => sc.ip === conn.ip),
    );

    return [...starredConns, ...nonStarredConns];
  };

  // Save starred connections to local storage
  useEffect(() => {
    localStorage.setItem('starredConnections', JSON.stringify(starredConns));
  }, [starredConns]);

  // Update sorted connections list that is displayed once starred/un-starred
  useEffect(() => {
    const sorted = getSortedConnections(connectionsList);
    setSortedConns(sorted);
  }, [connectionsList, starredConns]);

  const handleConnStarring = (conn) => {
    setStarredConns((prev) =>
      prev.some((c) => c.ip === conn.ip)
        ? prev.filter((c) => c.ip !== conn.ip)
        : [conn, ...prev],
    );
  };

  const isStarred = (connIP) => {
    const found = starredConns.filter((conn) => conn.ip === connIP);
    return found.length > 0 ? false : true;
  };

  const activeConnectionState = cliState((state) => state.activeConnection);

  const renderDockerAttachBtn = (conn) => {
    const id = `${conn.ip}-docker_attach`;
    const isAttached = activeConnectionState[id]?.action === 'docker_attach';
    return (
      <>
        {!isAttached ? (
          <button
            style={{
              ...actionStyles.actionButton,
              backgroundColor: '#2563eb',
            }}
            onClick={() => handleConnectClick(conn, 'docker_attach')}
          >
            <FaDocker size={24} />
            Attach
          </button>
        ) : (
          <button
            style={{
              ...actionStyles.actionButton,
              backgroundColor: 'green',
              cursor: 'not-allowed',
            }}
          >
            <FaDocker size={24} />
            Attach
          </button>
        )}
      </>
    );
  };

  // Add starred node to local storage
  // If local storage has stars, fetch and sort at top of list for 'all connections' view

  const displayChosenList = (selectedList) => {
    const normalizedList = Array.isArray(selectedList)
      ? selectedList
      : Object.entries(selectedList).map(([key, value]) => ({
          id: key,
          ...value,
        }));

    if (normalizedList.length < 1)
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px',
          }}
        >
          <p style={{ fontSize: '16px', color: '#64748b' }}>
            No active terminals
          </p>
        </div>
      );

    const getConnID = (id) => {
      const uniqueID = id?.split('-')[1];
      if (!uniqueID) return null;

      return (
        <h3
          style={{
            color: '#64748b',
            fontSize: '14px',
            margin: '2px 0',
            fontWeight: '700',
          }}
        >
          {`T-ID: ${uniqueID}`}
        </h3>
      );
    };

    return normalizedList.map((conn) => (
      <div
        key={conn?.id ?? `${conn.ip}-${conn.hostname}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: 'white',
          transition: 'background-color 0.2s',
        }}
      >
        {connectionsTab === 'all' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: 5,
              cursor: 'pointer',
            }}
            onClick={() => handleConnStarring(conn)}
          >
            {isStarred(conn.ip) ? (
              <CiStar size={24} />
            ) : (
              <FaStar size={24} style={{ color: 'blue' }} />
            )}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                color: '#1a365d',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              {conn.hostname}
            </h3>

            <p style={{ color: '#64748b', fontSize: '14px', margin: '2px 0' }}>
              IP: {conn.ip}
            </p>

            <p style={{ color: '#64748b', fontSize: '14px', margin: '2px 0' }}>
              User: {conn.user}
            </p>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                margin: '2px 0',
              }}
            >
              Password: ******
            </p>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                margin: '2px 0',
              }}
            >
              {getConnID(conn.id)}
            </p>
          </div>

          {connectionsTab === 'all' && (
            // ADD star icon here...
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '16px',
              }}
            >
              <button
                style={{
                  ...actionStyles.actionButton,
                  backgroundColor: '#E5E4E2',
                  color: 'black',
                  width: '100%',
                }}
                onClick={() => handleConnectClick(conn, 'direct_ssh')}
              >
                <TbBrandPowershell size={24} />
                Shell
              </button>

              {renderDockerAttachBtn(conn)}

              <button
                style={{
                  ...actionStyles.actionButton,
                  backgroundColor: '#2563eb',
                }}
                onClick={() => handleConnectClick(conn, 'docker_exec')}
              >
                <FaDocker size={24} />
                Exec
              </button>
            </div>
          )}
        </div>
      </div>
    ));
  };

  return (
    <div
      style={{
        width: '50%',
        padding: '32px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div>
        <div style={{ width: '20vw' }}>
          {connectionsList.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '64px 0',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#dbeafe',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  fontSize: '32px',
                }}
              >
                <FaComputer />
              </div>
              <p style={{ fontSize: '16px' }}>No added connections yet</p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                }}
              >
                <button
                  style={{
                    padding: '16px',
                    border: '1px solid #b0c3db',
                    borderRadius: '8px',
                    backgroundColor:
                      connectionsTab === 'all' ? '#cbd5e1' : '#ebeef1',
                    color: 'black',
                    fontWeight: connectionsTab === 'all' ? '600' : '400',
                  }}
                  onClick={() => setConnectionsTab('all')}
                >
                  All Connections
                </button>
                <button
                  style={{
                    padding: '16px',
                    border: '1px solid #b0c3db',
                    borderRadius: '8px',
                    backgroundColor:
                      connectionsTab === 'active' ? '#cbd5e1' : '#ebeef1',
                    color: 'black',
                    fontWeight: connectionsTab === 'active' ? '600' : '400',
                  }}
                  onClick={() => setConnectionsTab('active')}
                >
                  Active Terminals
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '70vh',
                  overflowY: 'auto',
                }}
              >
                {connectionsTab === 'all'
                  ? displayChosenList(sortedConns)
                  : displayChosenList(activeTerminals)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: '0 0 8px 0',
                color: '#1a365d',
                fontSize: '24px',
                fontWeight: '600',
              }}
            >
              Connect to {selectedConnection?.hostname}
            </h2>
            <p
              style={{
                color: '#64748b',
                marginBottom: '24px',
                fontSize: '14px',
              }}
            >
              Choose authentication method
            </p>

            {/* Auth Methods */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                borderBottom: '1px solid #e2e8f0',
              }}
            >
              <button
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: authMethod === 'password' ? '#2563eb' : '#64748b',
                  borderBottom:
                    authMethod === 'password' ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onClick={() => setAuthMethod('password')}
              >
                Password
              </button>
              <button
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: authMethod === 'keyfile' ? '#2563eb' : '#64748b',
                  borderBottom:
                    authMethod === 'keyfile' ? '2px solid #2563eb' : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onClick={() => setAuthMethod('keyfile')}
              >
                SSH Key
              </button>
            </div>

            {authMethod === 'password' && (
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#1a365d',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Password
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAuthSubmit();
                    }}
                  />
                  <CiTrash
                    title={`Clear password for ${selectedConnection?.hostname}`}
                    style={{ cursor: 'pointer', flexShrink: 0 }}
                    size={28}
                    onClick={() => {
                      clearStoredCredentials(
                        selectedConnection?.hostname,
                        'password',
                      );
                      setAuthPassword('');
                    }}
                  />
                </div>
              </div>
            )}

            {authMethod === 'keyfile' && (
              <div style={{ marginBottom: '24px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#1a365d',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  SSH Private Key
                </label>
                <div
                  style={{
                    border: '2px dashed',
                    borderColor: keyFile ? '#86efac' : '#cbd5e1',
                    borderRadius: '6px',
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: keyFile ? '#f0fdf4' : '#f8fafc',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileUpload(e.dataTransfer.files[0]);
                  }}
                >
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="keyfile-upload"
                  />
                  <label
                    htmlFor="keyfile-upload"
                    style={{
                      cursor: 'pointer',
                      color: keyFile ? '#16a34a' : '#2563eb',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    {keyFile
                      ? `FILE: ${keyFile.name}`
                      : 'Click to upload key file'}
                  </label>
                  <p
                    style={{
                      color: '#64748b',
                      fontSize: '12px',
                      marginTop: '8px',
                    }}
                  >
                    {keyFile
                      ? 'Key loaded from vault (click to change)'
                      : 'Upload access key file'}
                  </p>
                </div>
                {keyFile && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px',
                    }}
                  >
                    <button
                      onClick={() => {
                        clearStoredCredentials(
                          selectedConnection?.hostname,
                          'keyfile',
                        );
                        setKeyFile(null);
                      }}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #fecaca',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      Clear Key
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: credLocked ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  color: credLocked ? '#94a3b8' : '#1a365d',
                  opacity: credLocked ? 0.6 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={saveToVault}
                  onChange={(e) => setSaveToVault(e.target.checked)}
                  disabled={credLocked}
                  style={{ cursor: credLocked ? 'not-allowed' : 'pointer' }}
                />
                Save credential to encrypted vault
                {credLocked && (
                  <span style={{ color: '#ef4444', fontSize: '12px' }}>
                    (🔒 Vault Locked)
                  </span>
                )}
              </label>
              <p
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  marginLeft: '24px',
                  marginTop: '4px',
                }}
              >
                {credLocked
                  ? 'Unlock the vault to import and store credentials automatically'
                  : 'If unchecked, credential will only be stored for this session'}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#64748b',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onClick={() => setShowAuthModal(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onClick={handleAuthSubmit}
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const actionStyles = {
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    lineHeight: 1,
    transition: 'background-color 0.15s ease, transform 0.05s ease',
  },
  hoverShellStyle: { backgroundColor: '#C7C5C1' },
  hoverDockerStyle: { backgroundColor: '#1d4ed8' },
  activeStyle: { transform: 'translateY(1px)' },
};

export default ConnectionSelectorView;
