import { useEffect, useState } from 'react';
import ConnectionSelectorView from './ConnectionSelectorView';
import ConnectionView from './ConnectionView';
import cliState from './state/state';

export default function CliPage() {
  const [selectedConnection, setSelectedConnection] = useState(null);
  const { activeConnection } = cliState();

  useEffect(() => {
    console.log('Active connection: ', activeConnection);
  }, [activeConnection]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {activeConnection ? (
        <ConnectionView conn={activeConnection} />
      ) : (
        <ConnectionSelectorView />
      )}
    </div>
  );
}
