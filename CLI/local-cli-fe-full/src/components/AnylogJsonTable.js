import React from 'react';
import '../styles/AnylogJsonTable.css';

const AnylogJsonTable = ({ data, className = '' }) => {
  // If no data, return empty state
  if (!data || typeof data !== 'object') {
    return <div className="anylog-table-empty">No data available</div>;
  }

  // Convert the nested object into rows and columns
  const rows = Object.entries(data).map(([serviceName, serviceData]) => ({
    service: serviceName,
    ...serviceData
  }));

  // Get all unique column names (excluding 'service')
  const allColumns = new Set();
  rows.forEach(row => {
    Object.keys(row).forEach(key => {
      if (key !== 'service') {
        allColumns.add(key);
      }
    });
  });

  const columns = Array.from(allColumns);

  // Helper function to render cell content
  const renderCellContent = (value, columnName) => {
    if (value === null || value === undefined) {
      return <span className="anylog-table-null">-</span>;
    }

    // Special styling for Status column
    if (columnName.toLowerCase() === 'status') {
      const statusValue = String(value).toLowerCase();
      let statusClass = 'status-not-declared';
      
      if (statusValue.includes('running')) {
        statusClass = 'status-running';
      } else if (statusValue.includes('stopped') || statusValue.includes('error') || statusValue.includes('failed')) {
        statusClass = 'status-error';
      } else if (statusValue.includes('not declared') || statusValue.includes('not active') || statusValue.includes('disabled')) {
        statusClass = 'status-not-declared';
      } else if (statusValue.includes('warning') || statusValue.includes('pending')) {
        statusClass = 'status-stopped';
      }
      
      return <span className={`status-badge ${statusClass}`}>{value}</span>;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return <span className="anylog-table-array">{JSON.stringify(value)}</span>;
    }

    // Handle objects
    if (typeof value === 'object') {
      return <span className="anylog-table-object">{JSON.stringify(value)}</span>;
    }

    // Handle strings and numbers
    return <span className="anylog-table-value">{String(value)}</span>;
  };

  return (
    <div className={`anylog-table-wrapper ${className}`}>
      <table className="anylog-table">
        <thead>
          <tr>
            <th className="anylog-table-header service-header">Service</th>
            {columns.map(column => (
              <th key={column} className="anylog-table-header">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="anylog-table-row">
              <td className="anylog-table-cell service-cell">
                <span className="service-name">{row.service}</span>
              </td>
              {columns.map(column => (
                <td key={column} className="anylog-table-cell">
                  {renderCellContent(row[column], column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnylogJsonTable;
