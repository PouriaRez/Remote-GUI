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
          maxWidth: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        {console.log(
          Object.entries(conn).map(([id, conn]) => {
            console.log('ID: ', id);
            console.log('Conn: ', conn);
          }),
        )}
        {console.log('Connection in connectionView: ', conn)}
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {Object.entries(conn).map(([id, conn]) => (
            <div
              style={{ height: '50%', width: '50%', border: '1px solid red' }}
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
          {/* <TerminalView
            id = {id}
            host={conn.ip}
            user={conn.user}
            credential={conn.credential}
            action={conn.action ?? 'direct_ssh'}
            authType={conn.authType}
          /> */}
        </div>
      </div>
    </>
  );
};

export default ConnectionView;
/*

structured_data =
{
'type': 'table', 
'data': [{'Address': '23.239.12.151:32349', 'Node Type': 'node', 'Node Name': 'node', 'Status': ''}]
} 
*/
