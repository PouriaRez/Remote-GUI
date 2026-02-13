import DataTable from '../../components/DataTable';
import { useEffect, useState } from 'react';
import { sendCommand } from '../../services/api';
import '../../styles/CLIPage.css';
import TerminalView from './TerminalView';
import ConnectionSelectorView from './ConnectionSelectorView';
import StatusBar from './StatusBar';
// Plugin metadata - used by the plugin loader
export const pluginMetadata = {
  name: 'CLI',
  icon: null,
  // 📊 => Use icon?
};
const ConnectionView = ({ conn }) => {
  // const command = 'test network'; DONT USE THIS YET... TAKES TOO LONG CRASHES THINGS BAD THINGS HAPPEN
  // const command = 'get status';
  // const command = "test network with 23.239.12.151:32349";

  return (
    <>
      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '5px',
          flexWrap: 'wrap',
          padding: '32px',
        }}
      >
        {Object.entries(conn).map(([id, conn]) => (
          <div
            style={{
              width: '100%',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              backgroundColor: conn.starred ? '#fffbeb' : 'white',
              transition: 'background-color 0.2s',
              padding: '4px',
            }}
          >
            <StatusBar id={id} conn={conn} />
            <TerminalView
              key={id}
              id={id}
              host={conn.ip}
              user={conn.user}
              credential={conn.credential}
              action={conn.action ?? 'direct_ssh'}
              authType={conn.authType}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default ConnectionView;
