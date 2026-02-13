import { useEffect, useState } from 'react';
import { FaComputer, FaStar, FaRegStar, FaDocker } from 'react-icons/fa6';
import { fetchAllNodes, normalizeNodes } from './utils/fetchNodes';
import { cliState } from './state/state';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { CiTrash } from 'react-icons/ci';
import {
  clearStoredCredentials,
  retrieveStoredCredential,
  storeCredentials,
} from './utils/cred';
import { TbBrandPowershell } from 'react-icons/tb';

const ConnectionSelectorView = () => {
  const [connections, setConnections] = useState([]);
  const { setActiveConnection, activeConnection } = cliState();

  const [newConnection, setNewConnection] = useState({
    hostname: '',
    ip: '',
    user: '',
    credential: '',
    status: 'active',
    starred: false,
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [authMethod, setAuthMethod] = useState('password'); // "password" or "keyfile"
  const [authPassword, setAuthPassword] = useState('');
  const [keyFile, setKeyFile] = useState(null);
  const [connectionsTab, setConnectionsTab] = useState('all');
  const [activeTerminals, setActiveTerminals] = useState(null);

  const addConnection = () => {
    if (
      !newConnection.hostname ||
      !newConnection.ip ||
      !newConnection.user ||
      !newConnection.credential
    ) {
      alert('Please fill in all fields');
      return;
    }

    setConnections([
      { ...newConnection, id: Date.now().toString() },
      ...connections,
    ]);

    setNewConnection({
      hostname: '',
      ip: '',
      user: '',
      credential: '',
      status: 'active',
      starred: false,
    });
  };

  const removeConnection = (id) => {
    setConnections(connections.filter((conn) => conn.id !== id));
  };

  const toggleStar = (id) => {
    setConnections(
      connections.map((conn) =>
        conn.id === id ? { ...conn, starred: !conn.starred } : conn,
      ),
    );
  };

  const handleConnectClick = (conn, conn_action) => {
    setSelectedConnection(conn);
    setSelectedAction(conn_action);
    setAuthPassword('');
    setKeyFile(null);
    setAuthMethod('password');
    setAuthPassword(retrieveStoredCredential(conn.hostname, 'password'));

    const storedKey = retrieveStoredCredential(conn.hostname, 'keyfile');
    console.log(
      storedKey
        ? `Retrieved locally stored key for ${conn.hostname}`
        : `No locally stored key for ${conn.hostname}`,
    );
    setKeyFile(storedKey ?? null);
    // setKeyFileData(storedKey?.contents ?? null);

    setShowAuthModal(true);
  };

  const handleAuthSubmit = () => {
    console.log(`Submitting with action: ${selectedAction}`);
    if (authMethod === 'password' && !authPassword) {
      alert('Please enter a password');
      return;
    }
    if (authMethod === 'keyfile' && !keyFile) {
      alert('Please upload a key file');
      return;
    }

    if (authMethod === 'keyfile') {
      storeCredentials(selectedConnection.hostname, {
        keyfile: {
          name: keyFile.name,
          contents: keyFile.contents,
        },
      });
    } else if (authMethod === 'password') {
      storeCredentials(selectedConnection.hostname, {
        password: authPassword,
      });
    }

    var uuid = ``;

    if (selectedAction === 'docker_attach') {
      uuid = `${selectedConnection.ip}-${selectedAction}`;
    } else {
      uuid = `${selectedConnection.ip}-${Date.now()}`;
    }

    console.log('given UUID: ', uuid);
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

    if (file) {
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
        console.log(`Stored keyfile`);
      } catch (err) {
        console.error('Failed to read file', err);
      }
    }
  };

  useEffect(() => {
    const fetchNodes = async () => {
      try {
        console.log(`Fetching nodes`);
        const rawNodes = await fetchAllNodes();
        const nodeData = normalizeNodes(rawNodes);
        console.log(nodeData);
        setConnections(
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
  }, []);

  const sortedConnections = [...connections].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return a.hostname.localeCompare(b.hostname);
  });

  // Returns an enabled/disabled (docker_attach) button depending if it is in use already.
  const attachCheck = cliState((state) => state.activeConnection);
  const renderDockerAttach = (conn) => {
    const id = `${conn.ip}-docker_attach`;
    const isAttached = attachCheck[id]?.action === 'docker_attach';
    return (
      <>
        {!isAttached ? (
          <button
            style={{
              ...actionStyles.actionButton,
              backgroundColor: '#2563eb',
            }}
            onMouseEnter={(e) =>
              Object.assign(
                e.currentTarget.style,
                actionStyles.hoverDockerStyle,
              )
            }
            onMouseLeave={(e) =>
              Object.assign(e.currentTarget.style, {
                backgroundColor: '#2563eb',
                transform: 'none',
              })
            }
            onMouseDown={(e) =>
              Object.assign(e.currentTarget.style, actionStyles.activeStyle)
            }
            onMouseUp={(e) =>
              Object.assign(e.currentTarget.style, {
                transform: 'none',
              })
            }
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
          }}
        >
          <p style={{ fontSize: '16px' }}>No active terminals yet</p>
        </div>
      );

    const getConnID = (id, action) => {
      const uniqueID = id?.split('-')[1];

      if (!uniqueID) return;

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
        key={conn.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: conn.starred ? '#fffbeb' : 'white',
          transition: 'background-color 0.2s',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          {/* Star Button */}
          {/* <button
                      onClick={() => toggleStar(conn.id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "20px",
                        color: conn.starred ? "#f59e0b" : "#cbd5e1",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        transition: "color 0.2s",
                      }}
                    >
                      {conn.starred ? <FaStar /> : <FaRegStar />}
                    </button> */}

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
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                margin: '2px 0',
              }}
            >
              IP: {conn.ip}
            </p>
            <p
              style={{
                color: '#64748b',
                fontSize: '14px',
                margin: '2px 0',
              }}
            >
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

            {getConnID(conn.id)}
          </div>
          {connectionsTab === 'all' && (
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
                onMouseEnter={(e) =>
                  Object.assign(
                    e.currentTarget.style,
                    actionStyles.hoverShellStyle,
                  )
                }
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, {
                    backgroundColor: '#E5E4E2',
                    transform: 'none',
                  })
                }
                onMouseDown={(e) =>
                  Object.assign(e.currentTarget.style, actionStyles.activeStyle)
                }
                onMouseUp={(e) =>
                  Object.assign(e.currentTarget.style, {
                    transform: 'none',
                  })
                }
                onClick={() => handleConnectClick(conn, 'direct_ssh')}
              >
                <TbBrandPowershell size={24} />
                Shell
              </button>

              {renderDockerAttach(conn)}

              <button
                style={{
                  ...actionStyles.actionButton,
                  backgroundColor: '#2563eb',
                }}
                onMouseEnter={(e) =>
                  Object.assign(
                    e.currentTarget.style,
                    actionStyles.hoverDockerStyle,
                  )
                }
                onMouseLeave={(e) =>
                  Object.assign(e.currentTarget.style, {
                    backgroundColor: '#2563eb',
                    transform: 'none',
                  })
                }
                onMouseDown={(e) =>
                  Object.assign(e.currentTarget.style, actionStyles.activeStyle)
                }
                onMouseUp={(e) =>
                  Object.assign(e.currentTarget.style, {
                    transform: 'none',
                  })
                }
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
        {/* Connections List */}
        <div
          style={{
            width: '20vw',
          }}
        >
          {connections.length === 0 ? (
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
                    backgroundColor: '#ebeef1',
                    color: 'black',
                  }}
                  onMouseEnter={(e) =>
                    Object.assign(
                      e.currentTarget.style,
                      actionStyles.hoverShellStyle,
                    )
                  }
                  onMouseLeave={(e) =>
                    Object.assign(e.currentTarget.style, {
                      backgroundColor: '#ebeef1',
                      transform: 'none',
                    })
                  }
                  onMouseDown={(e) =>
                    Object.assign(
                      e.currentTarget.style,
                      actionStyles.activeStyle,
                    )
                  }
                  onMouseUp={(e) =>
                    Object.assign(e.currentTarget.style, {
                      transform: 'none',
                    })
                  }
                  onClick={() => {
                    setConnectionsTab('all');
                  }}
                >
                  All Connections
                </button>
                <button
                  style={{
                    padding: '16px',
                    border: '1px solid #b0c3db',
                    borderRadius: '8px',
                    backgroundColor: '#ebeef1',
                    color: 'black',
                  }}
                  onMouseEnter={(e) =>
                    Object.assign(
                      e.currentTarget.style,
                      actionStyles.hoverShellStyle,
                    )
                  }
                  onMouseLeave={(e) =>
                    Object.assign(e.currentTarget.style, {
                      backgroundColor: '#ebeef1',
                      transform: 'none',
                    })
                  }
                  onMouseDown={(e) =>
                    Object.assign(
                      e.currentTarget.style,
                      actionStyles.activeStyle,
                    )
                  }
                  onMouseUp={(e) =>
                    Object.assign(e.currentTarget.style, {
                      transform: 'none',
                    })
                  }
                  onClick={() => {
                    setConnectionsTab('active');
                  }}
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
                  ? displayChosenList(sortedConnections)
                  : displayChosenList(activeTerminals)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication for psk and keyfile */}
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

            {/* Auth Method Tabs */}
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

            {/* Password Input */}
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
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAuthSubmit();
                    }}
                  />
                  <CiTrash
                    title={`Forget password for ${selectedConnection?.hostname}`}
                    style={{ cursor: 'pointer' }}
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

            {/* Key File Uploader */}
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
                    border: '2px dashed #cbd5e1',
                    borderRadius: '6px',
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
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
                      color: '#2563eb',
                      fontSize: '14px',
                      fontWeight: '500',
                    }}
                  >
                    {keyFile ? keyFile.name : 'Click to upload key file'}
                  </label>
                  <p
                    style={{
                      color: '#64748b',
                      fontSize: '12px',
                      marginTop: '8px',
                    }}
                  >
                    Upload access key file
                  </p>
                </div>
              </div>
            )}

            {/* Confirmation Buttons */}
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
