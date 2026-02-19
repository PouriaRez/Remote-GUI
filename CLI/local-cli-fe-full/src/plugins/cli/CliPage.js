import { useEffect, useState } from 'react';
import ConnectionSelectorView from './ConnectionSelectorView';
import ConnectionView from './ConnectionView';
import Header from './subcomponents/Header';
import { cliState } from './state/state';
import AddConnectionView from './subcomponents/AddConnectionView';
import Modal from '@mui/material/Modal';
import { Box } from '@mui/material';
import VaultView from './subcomponents/VaultViews';

const MODAL_MAPPINGS = {
  CUSTOM_CONNECTION: AddConnectionView,
  VAULT: VaultView,
};

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

  const activeConnection = cliState((state) => state.activeConnection);
  const modalView = cliState((state) => state.modalView);
  const setModalView = cliState((state) => state.setModalView);

  const ActiveModalComponent = MODAL_MAPPINGS[modalView];

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
      {modalView !== null && ActiveModalComponent !== null && (
        <div
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: '100%',
            height: '100%',
          }}
        >
          <Modal open={modalView !== null} onClose={() => setModalView(null)}>
            <Box sx={modalStyle}>
              <div
                style={{
                  display: 'flex',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: '50vw',
                  height: '100%',
                  flexDirection: 'column',
                  gap: 16,
                  // padding: 16,
                  background: '#fafafa',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                }}
              >
                {<ActiveModalComponent />}
              </div>
            </Box>
          </Modal>
        </div>
      )}
    </div>
  );
}

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '90vw',
  maxHeight: '40vw',
  bgcolor: 'background.paper',
  boxShadow: 24,
  overflow: 'hidden',
  borderRadius: 3,
  p: 0,
};
