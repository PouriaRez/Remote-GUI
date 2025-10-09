import React, { useState } from 'react';
import '../styles/MonitorTable.css'; 

const MonitorTable = ({ data }) => {
  const [thresholds, setThresholds] = useState([]);
  const [newThreshold, setNewThreshold] = useState({
    column: '',
    operator: 'greater',
    value: ''
  });

  // If no data or empty array, render a message
  if (!data || data.length === 0) {
    return <div>No data available.</div>;
  }

  // Get table headers from the keys of the first object
  const headers = Object.keys(data[0]);

  // Function to check if a cell value exceeds threshold
  const checkThreshold = (value, threshold) => {
    const numValue = parseFloat(value);
    const numThreshold = parseFloat(threshold.value);
    
    if (isNaN(numValue) || isNaN(numThreshold)) return false;
    
    switch (threshold.operator) {
      case 'greater':
        return numValue > numThreshold;
      case 'less':
        return numValue < numThreshold;
      case 'greaterEqual':
        return numValue >= numThreshold;
      case 'lessEqual':
        return numValue <= numThreshold;
      case 'equal':
        return numValue === numThreshold;
      default:
        return false;
    }
  };

  // Function to add a new threshold
  const addThreshold = () => {
    if (newThreshold.column && newThreshold.value) {
      setThresholds([...thresholds, { ...newThreshold, id: Date.now() }]);
      setNewThreshold({ column: '', operator: 'greater', value: '' });
    }
  };

  // Function to remove a threshold
  const removeThreshold = (id) => {
    setThresholds(thresholds.filter(t => t.id !== id));
  };

  // Function to get cell styling based on thresholds
  const getCellStyle = (value, header) => {
    const exceededThresholds = thresholds.filter(t => 
      t.column === header && checkThreshold(value, t)
    );
    
    if (exceededThresholds.length > 0) {
      return { backgroundColor: '#ffebee', color: '#c62828', fontWeight: 'bold' };
    }
    return {};
  };

  return (
    <div className="monitor-table-container">
      {/* Threshold Form */}
      <div className="threshold-form">
        <h3>Add Threshold Monitor</h3>
        <div className="form-row">
          <select
            value={newThreshold.column}
            onChange={(e) => setNewThreshold({...newThreshold, column: e.target.value})}
            placeholder="Select Column"
          >
            <option value="">Select Column</option>
            {headers.map((header, idx) => (
              <option key={`option-${idx}`} value={header}>{header}</option>
            ))}
          </select>
          
          <select
            value={newThreshold.operator}
            onChange={(e) => setNewThreshold({...newThreshold, operator: e.target.value})}
          >
            <option value="greater">&gt;</option>
            <option value="less">&lt;</option>
            <option value="greaterEqual">&gt;=</option>
            <option value="lessEqual">&lt;=</option>
            <option value="equal">=</option>
          </select>
          
          <input
            type="number"
            value={newThreshold.value}
            onChange={(e) => setNewThreshold({...newThreshold, value: e.target.value})}
            placeholder="Threshold Value"
          />
          
          <button onClick={addThreshold} className="add-threshold-btn">
            Add Threshold
          </button>
        </div>
      </div>

      {/* Active Thresholds */}
      {thresholds.length > 0 && (
        <div className="active-thresholds">
          <h4>Active Thresholds:</h4>
          <div className="threshold-list">
            {thresholds.map((threshold) => (
              <div key={threshold.id} className="threshold-item">
                <span>{threshold.column} {threshold.operator} {threshold.value}</span>
                <button 
                  onClick={() => removeThreshold(threshold.id)}
                  className="remove-threshold-btn"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((header, idx) => (
              <th key={`header-${idx}`}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {headers.map((header, cellIndex) => (
                <td 
                  key={`cell-${rowIndex}-${cellIndex}`}
                  style={getCellStyle(row[header], header)}
                >
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonitorTable;
