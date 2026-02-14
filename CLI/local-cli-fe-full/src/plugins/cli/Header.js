const Header = ({
  newConnection,
  setNewConnection,
  connections,
  setConnections,
}) => {
  const addConnection = () => {
    console.log(
      newConnection.hostname,
      newConnection.ip,
      newConnection.user,
      newConnection.credential,
    );
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
  return (
    <>
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: '#1a365d',
              fontSize: '32px',
              fontWeight: '600',
            }}
          >
            Remote Console
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
            SSH and Manage your AnyLog Nodes
          </p>
        </div>

        {/* Add Connection Button */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#000',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background-color 0.2s',
          }}
          onClick={addConnection}
        >
          + Add Connection
        </button>
      </div>

      {/* Connection Form */}
      <div
        style={{
          padding: '8px 0px 8px 0px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '24px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
        }}
      >
        <input
          type="text"
          placeholder="Hostname"
          value={newConnection.hostname}
          onChange={(e) =>
            setNewConnection({ ...newConnection, hostname: e.target.value })
          }
          style={{
            margin: '4px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        />
        <input
          type="text"
          placeholder="IP Address"
          value={newConnection.ip}
          onChange={(e) =>
            setNewConnection({ ...newConnection, ip: e.target.value })
          }
          style={{
            margin: '4px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        />
        <input
          type="text"
          placeholder="User"
          value={newConnection.user}
          onChange={(e) =>
            setNewConnection({ ...newConnection, user: e.target.value })
          }
          style={{
            margin: '4px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={newConnection.password}
          onChange={(e) =>
            setNewConnection({ ...newConnection, credential: e.target.value })
          }
          style={{
            margin: '4px',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            fontSize: '14px',
          }}
        />
      </div>
    </>
  );
};

export default Header;
