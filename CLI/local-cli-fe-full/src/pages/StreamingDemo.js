// src/pages/StreamingDemo.js
import React, { useState } from 'react';
import StreamingPlayer from '../components/StreamingPlayer';
import StreamingGrid from '../components/StreamingGrid';
import '../styles/StreamingDemo.css';

const StreamingDemo = () => {
  const [demoVideos, setDemoVideos] = useState([
    {
      file: 'Sample Video 1',
      streaming_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    },
    {
      file: 'Sample Video 2', 
      streaming_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
    },
    {
      file: 'Sample Video 3',
      streaming_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    }
  ]);

  const [customVideos, setCustomVideos] = useState([]);
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'single' or 'grid'

  const addCustomVideo = () => {
    if (customUrl.trim()) {
      const newVideo = {
        file: customName.trim() || `Custom Video ${customVideos.length + 1}`,
        streaming_url: customUrl.trim()
      };
      setCustomVideos([...customVideos, newVideo]);
      setCustomUrl('');
      setCustomName('');
    }
  };

  const removeCustomVideo = (index) => {
    setCustomVideos(customVideos.filter((_, i) => i !== index));
  };

  const allVideos = [...demoVideos, ...customVideos];

  return (
    <div className="streaming-demo-container">
      <div className="demo-header">
        <h1>🎬 Streaming Player Demo</h1>
        <p>Test the embedded streaming player with multiple videos that auto-iterate</p>
      </div>

      <div className="demo-controls">
        <div className="custom-video-section">
          <h3>Add Custom Videos</h3>
          <div className="custom-video-form">
            <input
              type="text"
              placeholder="Video URL (mp4, webm, etc.)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="url-input"
            />
            <input
              type="text"
              placeholder="Video Name (optional)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="name-input"
            />
            <button onClick={addCustomVideo} className="add-button">
              Add Video
            </button>
          </div>

          {customVideos.length > 0 && (
            <div className="custom-videos-list">
              <h4>Custom Videos ({customVideos.length})</h4>
              {customVideos.map((video, index) => (
                <div key={index} className="custom-video-item">
                  <span className="video-name">{video.file}</span>
                  <span className="video-url">{video.streaming_url}</span>
                  <button 
                    onClick={() => removeCustomVideo(index)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="streaming-player-section">
        <div className="player-header">
          <h3>Streaming Player</h3>
          <div className="view-mode-toggle">
            <button 
              className={`mode-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              📺 Grid View
            </button>
            <button 
              className={`mode-button ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => setViewMode('single')}
            >
              🎬 Single Player
            </button>
          </div>
        </div>
        
        {viewMode === 'grid' ? (
          <p>Multiple videos displayed side-by-side. Click to play/pause individual videos.</p>
        ) : (
          <p>Videos will auto-advance every 10 seconds. Use controls to navigate manually.</p>
        )}
        
        {allVideos.length > 0 ? (
          viewMode === 'grid' ? (
            <StreamingGrid 
              videos={allVideos}
              autoPlay={true}
              showControls={true}
            />
          ) : (
            <StreamingPlayer 
              videos={allVideos}
              autoPlay={true}
              loop={true}
              interval={10000} // 10 seconds
            />
          )
        ) : (
          <div className="no-videos-message">
            <p>No videos available. Add some custom videos above or use the demo videos.</p>
          </div>
        )}
      </div>

      <div className="demo-info">
        <h3>Features Demonstrated:</h3>
        <ul>
          <li>✅ Auto-iteration through multiple videos</li>
          <li>✅ Manual navigation controls (play/pause, next/previous)</li>
          <li>✅ Volume and playback speed controls</li>
          <li>✅ Progress bar with click-to-seek</li>
          <li>✅ Playlist display with current video indicator</li>
          <li>✅ Responsive design for mobile and desktop</li>
          <li>✅ Auto-hiding controls with mouse interaction</li>
        </ul>
      </div>
    </div>
  );
};

export default StreamingDemo;
