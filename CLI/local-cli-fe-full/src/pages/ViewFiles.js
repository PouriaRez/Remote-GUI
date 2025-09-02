// src/pages/ViewFiles.jsx
import React, {useState} from 'react';
// import { useParams }       from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import FileViewerAuto      from '../components/FileViewerAuto';
import '../styles/ViewFiles.css';  // <-- import the new stylesheet

const BACKEND_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";

const ViewFiles = () => {

  console.log("backend url is", BACKEND_URL);

  // const { fileId } = useParams();
  const [expandedFile, setExpandedFile] = useState(null);

  const location = useLocation();
  const { blobs } = location.state || { }; // Use optional chaining to avoid errors if state is undefined
  console.log('ViewFiles component rendered with files state:', blobs);

  const files = Array.isArray(blobs)
    ? blobs.map(obj => `${obj.dbms_name}.${obj.table_name}.${obj.file}`)
    : [];
  console.log('Files:', files);

  // List of your filenames in public/static/
  const dummyFiles = [
    'edgex.factory_imgs.0e5646150cddf0549be1e165bf878090.jpeg',
    '277d090b5cdbd0a539315e48708e6168.jpeg',
    'anylogLogo.png',
    // 'report.pdf',
    'flower.jpg',
    'example.wav',
    'video.mp4',
    // …add as many as you like
  ];

  const finalFiles = files || dummyFiles;

  return (
    <>
      <div className="view-files-grid">
        {finalFiles.map((name, idx) => {
          const url = `${BACKEND_URL}/static/${name}`;
          return (
            <div
              key={idx}
              className="view-files-card"
              onClick={() => setExpandedFile(name)}
            >
              <h4 className="view-files-header">{name}</h4>
              <div className="view-files-wrapper">
                <FileViewerAuto src={url} />
              </div>
            </div>
          );
        })}
      </div>

      {expandedFile && (
        <div className="modal-overlay" onClick={() => setExpandedFile(null)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setExpandedFile(null)}
            >
              ×
            </button>
            <FileViewerAuto
              src={`${BACKEND_URL}/static/${expandedFile}`}
              style={{ maxWidth: '90vw', maxHeight: '90vh' }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ViewFiles;
