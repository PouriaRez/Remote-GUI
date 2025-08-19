// import React, { useState, useEffect } from 'react';
// import '../styles/DataTable.css'; 

// /**
//  * BlobsTable
//  *
//  * Props:
//  *   - data: array of objects to display
//  *   - keyField: (optional) name of the unique key in each object (default: 'id')
//  *   - onSelectionChange: (optional) fn(selectedRows) called whenever selection updates
//  */
// const BlobsTable = ({ data = [], keyField = 'id', onSelectionChange }) => {
//   const [selectedIds, setSelectedIds] = useState([]);

//   // Whenever selectedIds changes, compute the selected row objects
//   useEffect(() => {
//     if (typeof onSelectionChange === 'function') {
//       const selectedRows = data.filter(row => selectedIds.includes(row[keyField]));
//       onSelectionChange(selectedRows);
//     }
//   }, [selectedIds, data, keyField, onSelectionChange]);

//   if (data.length === 0) {
//     return <div>No data available.</div>;
//   }

//   const headers = Object.keys(data[0]);

//   // Toggle a row’s presence in selectedIds
//   const toggleRow = (id) => {
//     setSelectedIds(prev => 
//       prev.includes(id) 
//         ? prev.filter(x => x !== id) 
//         : [...prev, id]
//     );
//   };

//   return (
//     <table className="data-table">
//       <thead>
//         <tr>
//           <th>Select</th>
//           {headers.map((h, i) => (
//             <th key={`h-${i}`}>{h}</th>
//           ))}
//         </tr>
//       </thead>
//       <tbody>
//         {data.map((row, rowIndex) => {
//           // Fallback to rowIndex if keyField is missing
//           const id = row[keyField] != null ? row[keyField] : rowIndex;
//           return (
//             <tr key={id}>
//               <td>
//                 <input
//                   type="checkbox"
//                   checked={selectedIds.includes(id)}
//                   onChange={() => toggleRow(id)}
//                 />
//               </td>
//               {headers.map((h, i) => (
//                 <td key={`c-${rowIndex}-${i}`}>
//                   {String(row[h])}
//                 </td>
//               ))}
//             </tr>
//           );
//         })}
//       </tbody>
//     </table>
//   );
// };

// export default BlobsTable;


import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css'; 

/**
 * BlobsTable
 *
 * Props:
 *   - data: array of objects to display
 *   - onSelectionChange: fn(selectedRows) called whenever selection updates
 */
const BlobsTable = ({ data = [], onSelectionChange }) => {
  // 1) Keep track of which row‐indexes are selected
  const [selectedIndexes, setSelectedIndexes] = useState([]);

  // 2) Whenever selection changes, notify parent with the actual row objects
  useEffect(() => {
    if (typeof onSelectionChange === 'function') {
      const selectedRows = selectedIndexes.map(i => data[i]);
      onSelectionChange(selectedRows);
    }
  }, [selectedIndexes, data, onSelectionChange]);

  // 3) If no data, short-circuit
  if (data.length === 0) {
    return <div>No data available.</div>;
  }

  // 4) Build headers from the first object
  const headers = Object.keys(data[0]);

  // 5) Toggle a row’s index in selectedIndexes
  const toggleRow = (index) => {
    setSelectedIndexes(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Select</th>
          {headers.map((h, i) => (
            <th key={`h-${i}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <td>
              <input
                type="checkbox"
                checked={selectedIndexes.includes(rowIndex)}
                onChange={() => toggleRow(rowIndex)}
              />
            </td>
            {headers.map((h, colIndex) => (
              <td key={`c-${rowIndex}-${colIndex}`}>
                {String(row[h])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default BlobsTable;
