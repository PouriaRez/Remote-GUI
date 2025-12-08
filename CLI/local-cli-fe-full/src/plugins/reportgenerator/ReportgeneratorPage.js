import React, { useState, useEffect } from 'react';
import { getDatabases } from '../../services/api';
import { listMonitorIds } from './reportgenerator_api';
import '../../styles/ReportgeneratorPage.css';

const ReportgeneratorPage = ({ node }) => {
  const [databases, setDatabases] = useState([]);
  const [selectedDbms, setSelectedDbms] = useState('');
  const [monitorIds, setMonitorIds] = useState([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState('');
  
  // Report parameters
  const [incrementUnit, setIncrementUnit] = useState('hour');
  const [incrementValue, setIncrementValue] = useState(1);
  const [timeColumn, setTimeColumn] = useState('timestamp');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingMonitorIds, setLoadingMonitorIds] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Fetch databases on component mount
  useEffect(() => {
    if (node) {
      fetchDatabases();
    }
  }, [node]);

  // Fetch monitor IDs when DBMS is selected
  useEffect(() => {
    if (selectedDbms && node) {
      fetchMonitorIds();
    } else {
      setMonitorIds([]);
      setSelectedMonitorId('');
    }
  }, [selectedDbms, node]);

  // Helper function to convert Date to date format (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to convert date format to backend format (YYYY-MM-DD 00:00:00)
  const convertToBackendFormat = (dateString) => {
    if (!dateString) return '';
    // date format: YYYY-MM-DD
    // backend format: YYYY-MM-DD 00:00:00
    return `${dateString} 00:00:00`;
  };

  // Set default date values
  useEffect(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!startTime) {
      setStartTime(formatDateForInput(yesterday));
    }
    if (!endTime) {
      setEndTime(formatDateForInput(now));
    }
  }, []);

  const fetchDatabases = async () => {
    if (!node) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getDatabases({ connectInfo: node });
      if (data && data.data) {
        // Parse the response - extract database names from objects
        const dbList = data.data.map(item => {
          // Handle both object format {database_name, name} and string format
          if (typeof item === 'string') {
            return item;
          } else if (item && (item.database_name || item.name)) {
            return item.database_name || item.name;
          }
          return item;
        }).filter(Boolean); // Remove any null/undefined values
        setDatabases(dbList);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch databases');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonitorIds = async () => {
    if (!node || !selectedDbms) return;
    
    setLoadingMonitorIds(true);
    setError(null);
    try {
      const result = await listMonitorIds({
        connection: node,
        dbms: selectedDbms
      });
      if (result.success && result.monitor_ids) {
        // Parse the response - extract monitor IDs from objects or use strings directly
        const monitorList = result.monitor_ids.map(item => {
          // Handle both object format and string format
          if (typeof item === 'string') {
            return item;
          } else if (item && (item.monitor_id || item.name || item.id)) {
            return item.monitor_id || item.name || item.id;
          }
          return String(item); // Convert to string as fallback
        }).filter(Boolean); // Remove any null/undefined values
        setMonitorIds(monitorList);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch monitor IDs');
      setMonitorIds([]);
    } finally {
      setLoadingMonitorIds(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!node || !selectedDbms || !selectedMonitorId) {
      setError('Please select DBMS and Monitor ID');
      return;
    }

    if (!startTime || !endTime) {
      setError('Please provide both start and end times');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert datetime-local format to backend format
      const backendStartTime = convertToBackendFormat(startTime);
      const backendEndTime = convertToBackendFormat(endTime);

      const request = {
        connection: node,
        dbms: selectedDbms,
        increment_unit: incrementUnit,
        increment_value: incrementValue,
        time_column: timeColumn,
        start_time: backendStartTime,
        end_time: backendEndTime,
        monitor_id: selectedMonitorId
      };

      const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";
      const url = `${API_URL}/reportgenerator/generate-report`;
      
      // Make request to get PDF file
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `power_monitoring_report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setSuccess('Report generated and downloaded successfully!');
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const canGenerateReport = node && selectedDbms && selectedMonitorId && startTime && endTime;

  return (
    <div className="reportgenerator-page">
      <div className="reportgenerator-header">
        <h2>Power Monitoring Report Generator</h2>
        {node && (
          <div className="selected-node-info">
            <span className="node-label">Node:</span>
            <span className="node-value">{node}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <strong>Success:</strong> {success}
        </div>
      )}

      <div className="reportgenerator-form">
        {/* Database Selection */}
        <div className="form-section">
          <h3>Step 1: Select Database</h3>
          <div className="form-group">
            <label htmlFor="dbms-select">DBMS *</label>
            <select
              id="dbms-select"
              className="form-control"
              value={selectedDbms}
              onChange={(e) => setSelectedDbms(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Select Database --</option>
              {databases.map((db, idx) => (
                <option key={idx} value={db}>
                  {db}
                </option>
              ))}
            </select>
            {loading && <div className="loading-indicator">Loading databases...</div>}
          </div>
        </div>

        {/* Monitor ID Selection */}
        {selectedDbms && (
          <div className="form-section">
            <h3>Step 2: Select Monitor ID</h3>
            <div className="form-group">
              <label htmlFor="monitor-select">Monitor ID *</label>
              <select
                id="monitor-select"
                className="form-control"
                value={selectedMonitorId}
                onChange={(e) => setSelectedMonitorId(e.target.value)}
                disabled={loadingMonitorIds}
              >
                <option value="">-- Select Monitor ID --</option>
                {monitorIds.map((id, idx) => (
                  <option key={idx} value={id}>
                    {id}
                  </option>
                ))}
              </select>
              {loadingMonitorIds && <div className="loading-indicator">Loading monitor IDs...</div>}
            </div>
          </div>
        )}

        {/* Report Parameters */}
        {selectedDbms && selectedMonitorId && (
          <div className="form-section">
            <h3>Step 3: Configure Report Parameters</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="increment-unit">Increment Unit</label>
                <select
                  id="increment-unit"
                  className="form-control"
                  value={incrementUnit}
                  onChange={(e) => setIncrementUnit(e.target.value)}
                >
                  <option value="minute">Minute</option>
                  <option value="hour">Hour</option>
                  <option value="day">Day</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="increment-value">Increment Value</label>
                <input
                  id="increment-value"
                  type="number"
                  className="form-control"
                  value={incrementValue}
                  onChange={(e) => setIncrementValue(parseInt(e.target.value) || 1)}
                  min="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="time-column">Time Column</label>
              <input
                id="time-column"
                type="text"
                className="form-control"
                value={timeColumn}
                onChange={(e) => setTimeColumn(e.target.value)}
                placeholder="timestamp"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start-time">Start Date *</label>
                <input
                  id="start-time"
                  type="date"
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <small className="form-help">Time will be set to 00:00:00</small>
              </div>

              <div className="form-group">
                <label htmlFor="end-time">End Date *</label>
                <input
                  id="end-time"
                  type="date"
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
                <small className="form-help">Time will be set to 00:00:00</small>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {canGenerateReport && (
          <div className="form-section">
            <button
              className="generate-button"
              onClick={handleGenerateReport}
              disabled={loading}
            >
              {loading ? 'Generating Report...' : 'Generate Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportgeneratorPage;

