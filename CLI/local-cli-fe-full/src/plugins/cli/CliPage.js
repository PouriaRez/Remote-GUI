import { useEffect, useState } from 'react';
import ConnectionSelectorView from './ConnectionSelectorView';
import ConnectionView from './ConnectionView';
import Header from './Header';
import { cliState } from './state/state';

export default function CliPage() {
  const [numberOfActiveConnections, SetNumberOfActiveConnections] = useState(0);
  const [newConnection, setNewConnection] = useState({
    hostname: '',
    ip: '',
    user: '',
    credential: '',
    status: 'active',
    starred: false,
  });
  const [connections, setConnections] = useState([]);

  const { activeConnection } = cliState();

  useEffect(() => {
    // console.log('Active connection: ', activeConnection);

    SetNumberOfActiveConnections(Object.values(activeConnection).length);
  }, [activeConnection]);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <Header
        newConnection={newConnection}
        setNewConnection={setNewConnection}
        connections={connections}
        setConnections={setConnections}
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
        }}
      >
        <ConnectionSelectorView
          connections={connections}
          setConnections={setConnections}
        />
        {numberOfActiveConnections > 0 ? (
          <ConnectionView conn={activeConnection} />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            No open terminal
          </div>
        )}
      </div>
    </div>
  );
}
