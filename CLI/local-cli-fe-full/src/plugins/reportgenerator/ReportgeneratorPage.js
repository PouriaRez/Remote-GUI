import React, { useState, useEffect } from 'react';
import '../../styles/ReportgeneratorPage.css';

// Plugin metadata - used by the plugin loader
export const pluginMetadata = {
  name: 'Report Generator',
  icon: null // Optional: add an icon emoji here if desired
};

const ReportgeneratorPage = ({ node }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedReportConfig, setSelectedReportConfig] = useState(null); // Store full config for selected report
  const [monitorIds, setMonitorIds] = useState([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState('');
  
  // Report parameters
  const [incrementUnit, setIncrementUnit] = useState('hour');
  const [incrementValue, setIncrementValue] = useState(1);
  const [timeColumn, setTimeColumn] = useState('timestamp');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [pageOrientation, setPageOrientation] = useState('portrait');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingMonitorIds, setLoadingMonitorIds] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfFilename, setPdfFilename] = useState(null);

  // Fetch available reports on component mount
  useEffect(() => {
    if (node) {
      fetchReports();
    }
  }, [node]);

  // Fetch monitor IDs when report is selected (only if monitor_id not in config)
  useEffect(() => {
    if (selectedReport && node) {
      // Find the selected report config
      const report = reports.find(r => r.name === selectedReport);
      if (report) {
        setSelectedReportConfig(report);
        // Only fetch monitor IDs if monitor_id is not configured in the report
        if (!report.monitor_id) {
          fetchMonitorIds();
        } else {
          // Monitor ID is configured, clear monitor IDs and use the one from config
          setMonitorIds([]);
          setSelectedMonitorId(report.monitor_id);
        }
      }
    } else {
      setSelectedReportConfig(null);
      setMonitorIds([]);
      setSelectedMonitorId('');
    }
  }, [selectedReport, node, reports]);

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

  // Cleanup blob URL when component unmounts or PDF changes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDownload = () => {
    if (pdfUrl && pdfFilename) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = pdfFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/reportgenerator/list-reports/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchMonitorIds = async () => {
    if (!selectedReport || !node) return;
    
    try {
      setLoadingMonitorIds(true);
      const API_URL = window._env_?.REACT_APP_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/reportgenerator/monitor-ids-by-report/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection: node,
          report_config_name: selectedReport,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch monitor IDs');
      }

      const data = await response.json();
      // Parse response to extract monitor IDs
      const ids = data.monitor_ids?.map(id => {
        if (typeof id === 'string') return id;
        if (id.monitor_id) return id.monitor_id;
        return id;
      }) || [];
      setMonitorIds(ids);
    } catch (err) {
      setError(err.message);
      setMonitorIds([]);
    } finally {
      setLoadingMonitorIds(false);
    }
  };

  const handleGenerateReport = async () => {
    // Check if monitor_id is required (not in config)
    const monitorIdRequired = !selectedReportConfig || !selectedReportConfig.monitor_id;
    const effectiveMonitorId = selectedReportConfig?.monitor_id || selectedMonitorId;
    
    if (!node || !selectedReport || (monitorIdRequired && !effectiveMonitorId)) {
      setError('Please select Report' + (monitorIdRequired ? ' and Monitor ID' : ''));
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
        report_config_name: selectedReport,
        increment_unit: incrementUnit,
        increment_value: incrementValue,
        time_column: timeColumn,
        start_time: backendStartTime,
        end_time: backendEndTime,
        monitor_id: effectiveMonitorId, // Use from config if available, otherwise from selection
        page_orientation: pageOrientation
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
      
      // Create a blob URL for viewing in browser
      const blobUrl = window.URL.createObjectURL(blob);
      const filename = `power_monitoring_report_${new Date().getTime()}.pdf`;
      
      // Store the PDF URL and filename for display
      setPdfUrl(blobUrl);
      setPdfFilename(filename);
      setSuccess('Report generated successfully! View it below or download using the button.');
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Check if monitor_id is required (not in config)
  const monitorIdFromConfig = selectedReportConfig?.monitor_id;
  const hasMonitorId = monitorIdFromConfig || selectedMonitorId;
  const canGenerateReport = node && selectedReport && hasMonitorId && startTime && endTime;

  return (
    <div className="reportgenerator-page">
      <div className="reportgenerator-header">
        <h2>Report Generator</h2>
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
        {/* Report Selection */}
        <div className="form-section">
          <h3>Step 1: Select Report</h3>
          <div className="form-group">
            <label htmlFor="report-select">Report Type *</label>
            <select
              id="report-select"
              className="form-control"
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              disabled={loadingReports}
            >
              <option value="">-- Select Report --</option>
              {reports.map((report, idx) => (
                <option key={idx} value={report.name}>
                  {report.display_name || report.title || report.name}
                </option>
              ))}
            </select>
            {loadingReports && <div className="loading-indicator">Loading reports...</div>}
          </div>
        </div>

        {/* Monitor ID Selection - Only show if not configured in report */}
        {selectedReport && !selectedReportConfig?.monitor_id && (
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
        
        {/* Show configured monitor ID if present */}
        {selectedReport && selectedReportConfig?.monitor_id && (
          <div className="form-section">
            <h3>Step 2: Monitor ID</h3>
            <div className="form-group">
              <label>Monitor ID (from config)</label>
              <div className="config-monitor-id-display">
                {selectedReportConfig.monitor_id}
              </div>
              <small className="form-text text-muted">
                This monitor ID is configured in the report and will be used automatically.
              </small>
            </div>
          </div>
        )}

        {/* Report Parameters */}
        {selectedReport && hasMonitorId && (
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

            <div className="form-group">
              <label htmlFor="page-orientation">Page Orientation</label>
              <select
                id="page-orientation"
                className="form-control"
                value={pageOrientation}
                onChange={(e) => setPageOrientation(e.target.value)}
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
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

      {/* PDF Viewer Section */}
      {pdfUrl && (
        <div className="pdf-viewer-section">
          <div className="pdf-viewer-header">
            <h3>Generated Report</h3>
            <button
              className="download-button"
              onClick={handleDownload}
            >
              📥 Download PDF
            </button>
          </div>
          <div className="pdf-viewer-container">
            <iframe
              src={pdfUrl}
              title="Generated Report"
              className="pdf-iframe"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportgeneratorPage;

