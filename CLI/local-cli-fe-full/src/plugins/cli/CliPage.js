import { useEffect, useState } from 'react';
import ConnectionSelectorView from './ConnectionSelectorView';
import ConnectionView from './ConnectionView';
import { cliState } from './state/state';

export default function CliPage() {
  const [numberOfActiveConnections, SetNumberOfActiveConnections] = useState(0);

  const { activeConnection } = cliState();

  useEffect(() => {
    console.log('Active connection: ', activeConnection);

    SetNumberOfActiveConnections(Object.values(activeConnection).length);

    // console.log('AC in CLI page: ', Object.activeConnection.length);
  }, [activeConnection]);

  return (
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
      <ConnectionSelectorView />
      {numberOfActiveConnections > 0 && (
        <ConnectionView conn={activeConnection} />
      )}
    </div>
  );
}
