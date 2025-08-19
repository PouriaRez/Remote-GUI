import React from 'react';
import '../styles/DataTable.css'; 


const DataTable = ({ data }) => {
  // If no data or empty array, render a message
  if (!data || data.length === 0) {
    return <div>No data available.</div>;
  }

  // Get table headers from the keys of the first object
  const headers = Object.keys(data[0]);

  return (
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
              <td key={`cell-${rowIndex}-${cellIndex}`}>
                {row[header]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
