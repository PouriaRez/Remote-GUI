

import React, { useState, useRef, useEffect } from 'react';
import DataTable from '../components/DataTable';
import { monitor } from '../services/api'; // Ensure your API is set up correctly
import '../styles/Monitor.css';

const Monitor = ({ node }) => {
  console.log("Monitor node: ", node);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Rerun rate in seconds: must be 0 or a multiple of 20.
  const [rerunRate, setRerunRate] = useState(20);
  const [inputError, setInputError] = useState(null);
  
  // Ref to store the polling interval
  const intervalRef = useRef(null);

  // Function to fetch monitoring data from the API using the current node.
  const fetchMonitoringData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pass the node parameter as needed.
      const result = await monitor({ node });
      console.log("Monitoring result:", result);
      // Assume API returns result.data (an array of objects)
      setData(result.data);
    } catch (err) {
      setError("Error occurred while monitoring: " + (err.message || err));
    }
    setLoading(false);
  };

  // Start monitoring: fetch data immediately and, if rerunRate is greater than 0, set up an interval.
  const handleStartMonitoring = () => {
    fetchMonitoringData();
    // Clear any existing interval.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // If the rerunRate is greater than 0, set an interval.
    if (rerunRate > 0) {
      intervalRef.current = setInterval(() => {
        fetchMonitoringData();
      }, rerunRate * 1000);
    }
  };

  // Stop monitoring by clearing the interval.
  const handleStopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Clear the interval when the component unmounts.
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle changes to the rerun rate input.
  const handleRerunRateChange = (e) => {
    const newRate = parseInt(e.target.value, 10);
    if (isNaN(newRate)) {
      setInputError("Please enter a valid number.");
      return;
    }
    // Check if newRate is 0 or a multiple of 20.
    if (newRate % 20 !== 0) {
      setInputError("Rerun rate must be 0 or a multiple of 20.");
      return;
    }
    setInputError(null);
    setRerunRate(newRate);
    // If monitoring is running, reset the interval with the new rate.
    if (intervalRef.current) {
      handleStopMonitoring();
      // Only restart if newRate is greater than 0; if it's 0, just run once.
      if (newRate > 0) {
        handleStartMonitoring();
      }
    }
  };

  return (
    <div className="monitor-container">
      <h2>Monitor Node Section</h2>
      <div style={{ marginBottom: '10px' }}>
        <p>
          <strong>Connected Node:</strong> {node}
        </p>
        <label htmlFor="rerunRate">Rerun Rate (seconds): </label>
        <input
          id="rerunRate"
          type="number"
          min="0"
          step="20"
          value={rerunRate}
          onChange={handleRerunRateChange}
          style={{ width: '100px', marginLeft: '10px' }}
        />
        {inputError && <span style={{ color: 'red', marginLeft: '10px' }}>{inputError}</span>}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleStartMonitoring}>
          {loading ? 'Monitoring...' : 'Start Monitoring'}
        </button>
        <button onClick={handleStopMonitoring} style={{ marginLeft: '10px' }}>
          Stop Monitoring
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data && data.length > 0 && <DataTable data={data} />}
    </div>
  );
};

export default Monitor;
