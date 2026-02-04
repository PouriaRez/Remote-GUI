import DataTable from '../../components/DataTable';
import { useEffect, useState } from 'react';
import { sendCommand } from '../../services/api';
import '../../styles/CLIPage.css';
// Plugin metadata - used by the plugin loader
export const pluginMetadata = {
  name: 'CLI',
  icon: null,
  // 📊 => Use icon?
};
const CliPage = () => {
  // const command = 'test network'; DONT USE THIS YET... TAKES TOO LONG CRASHES THINGS BAD THINGS HAPPEN
  // const command = 'get status';
  const command = 'test network';

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(false);
  const [resultType, setResultType] = useState(false);

  const handleSubmit = async (e) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Executing command:', command);

      // Info below currently hardcoded.
      // Need to change connectInfo to be pulled similar to Client page [ Curr node passed as Prop ]
      // 50.116.9.238:32349
      // 23.239.12.151:32349
      const result = await sendCommand({
        // connectInfo: node,
        connectInfo: '23.239.12.151:32349',
        method: 'GET',
        command,
      });

      console.log('Command execution result:', result);
      setResultType(result.type);
      setResponseData(result.data);
    } catch (err) {
      console.log('=== FRONTEND ERROR ===');
      console.log('Error object:', err);
      console.log('Error message:', err.message);
      console.log('Error stack:', err.stack);
      console.log('Error name:', err.name);
      console.log('=== END FRONTEND ERROR ===');

      let errorMessage = err.message || 'Unknown error occurred';

      // Add additional error details if available
      if (err.stack) {
        errorMessage += `\n\nStack trace:\n${err.stack}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    handleSubmit();
  }, []);

  return (
    <>
      {loading && <div>Loading...</div>}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
      {resultType === 'table' && Array.isArray(responseData) && (
        <>
          <DataTable data={responseData} />
        </>
      )}
    </>
  );
};

export default CliPage;
/*

structured_data =
{
'type': 'table', 
'data': [{'Address': '23.239.12.151:32349', 'Node Type': 'node', 'Node Name': 'node', 'Status': ''}]
} 
*/
