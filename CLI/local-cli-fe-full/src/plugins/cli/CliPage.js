import { useEffect, useState } from 'react';
import ConnectionSelectorView from './ConnectionSelectorView';
import ConnectionView from './ConnectionView';
import { cliState } from './state/state';

export default function CliPage() {
  const [selectedConnection, setSelectedConnection] = useState(null);
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
      }}
    >
      <ConnectionSelectorView />
      {numberOfActiveConnections > 0 ? (
        <div style={{}}>
          <ConnectionView conn={activeConnection} />
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
