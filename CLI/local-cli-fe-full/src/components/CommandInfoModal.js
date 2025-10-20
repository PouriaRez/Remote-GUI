import React from 'react';
import '../styles/CommandInfoModal.css';

const CommandInfoModal = ({ isOpen, onClose, node, command, method }) => {
  if (!isOpen) return null;

  // Generate the cURL command
  const generateCurlCommand = () => {
    const url = `http://${node}`;
    const headers = {
      'User-Agent': 'AnyLog/1.23',
      'command': command
    };

    let curlCommand = `curl --location --request ${method} ${url}`;
    
    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      curlCommand += ` --header "${key}: ${value}"`;
    });

    return curlCommand;
  };

  // Generate the QR code URL
  const generateQrUrl = () => {
    // Format: http://node/?User-Agent=AnyLog/1.23?into=html.text?command=command
    return `http://${node}/?User-Agent=AnyLog/1.23?into=html.text?command=${command}`;
  };

  // Generate QR code using a service (we'll use qr-server.com)
  const generateQrCodeUrl = () => {
    const qrUrl = generateQrUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
  };

  const curlCommand = generateCurlCommand();
  const qrUrl = generateQrUrl();
  const qrCodeUrl = generateQrCodeUrl();

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(`${label} copied to clipboard!`);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert(`${label} copied to clipboard!`);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Command Information</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="info-section">
            <h3>AnyLog Command</h3>
            <div className="command-display">
              <code>{command}</code>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(command, 'AnyLog Command')}
                title="Copy command"
              >
                📋
              </button>
            </div>
          </div>

          <div className="info-section">
            <h3>cURL Command</h3>
            <div className="command-display">
              <code>{curlCommand}</code>
              <button 
                className="copy-button"
                onClick={() => copyToClipboard(curlCommand, 'cURL Command')}
                title="Copy cURL command"
              >
                📋
              </button>
            </div>
          </div>

          <div className="info-section">
            <h3>QR Code</h3>
            <div className="qr-section">
              <div className="qr-code">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code for command" 
                  className="qr-image"
                />
              </div>
              <div className="qr-url">
                <div className="url-display">
                  <code>{qrUrl}</code>
                  <button 
                    className="copy-button"
                    onClick={() => copyToClipboard(qrUrl, 'QR URL')}
                    title="Copy URL"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>Connection Details</h3>
            <div className="connection-info">
              <div className="info-row">
                <strong>Node:</strong> <code>{node}</code>
              </div>
              <div className="info-row">
                <strong>Method:</strong> <code>{method}</code>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="close-modal-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommandInfoModal;
