import { useEffect, useState } from 'react';
import { getKibanaUrl } from './kibana_api';

// Plugin metadata - used by the plugin loader
export const pluginMetadata = {
  name: 'Kibana',
  icon: null,
  // 📊 => Use icon?
};

const KibanaPage = () => {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState(null);

  const handleInfoDisplay = async () => {
    setLoading(true);
    setUrl(null);

    try {
      const data = await getKibanaUrl();
      setUrl(data.url);
    } catch (error) {
      console.error('Kibana error:', error);
      setUrl({ error: error.message || 'Failed to display information' });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    handleInfoDisplay();
  }, []);

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          gap: 15,
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <p
            style={{
              color: '#333',
              fontSize: '24px',
              fontWeight: '600',
              borderBottom: '2px solid #007bff',
              paddingBottom: '10px',
              display: 'inline-block',
            }}
          >
            Kibana Dashboard
          </p>
        </div>
        {loading && <div>Loading...</div>}
        {url && (
          <iframe
            style={{ border: 'none', borderRadius: '10px' }}
            src={url}
            title="Kibana Dashboard"
            width="100%"
            height="100%"
          />
        )}
      </div>
    </>
  );
};

export default KibanaPage;
