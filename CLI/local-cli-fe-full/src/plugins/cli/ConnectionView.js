import '../../styles/CLIPage.css';
import TerminalView from './TerminalView';
import StatusBar from './StatusBar';

// Plugin metadata - used by the plugin loader
export const pluginMetadata = {
  name: 'CLI',
  icon: null,
  // 📊 => Use icon?
};
const ConnectionView = ({ conn }) => {
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
