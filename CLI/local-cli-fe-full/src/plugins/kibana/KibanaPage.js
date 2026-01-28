import { useState } from 'react';
import { kibanaInfo } from './kibana_api';

// Plugin metadata - used by the plugin loader
export const pluginMetadata = {
  name: 'Kibana',
  icon: null,
};

const KibanaPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInfoDisplay = async () => {
    setLoading(true);
    setResult(null);

    try {
      const data = await kibanaInfo();
      console.log(data);
      setResult(data);
    } catch (error) {
      console.error('Kibana error:', error);
      setResult({ error: error.message || 'Failed to display information' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        KibanaPage
        <button onClick={handleInfoDisplay}>Button</button>
        {loading && <div>Loading...</div>}
        {result && <div>{result.name}</div>}
      </div>
    </>
  );
};

export default KibanaPage;
