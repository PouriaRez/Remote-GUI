// import React from 'react';

// const Header = () => {
//   return (
//     <>
//       {/* Header */}
//       <div
//         style={{
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           marginBottom: '32px',
//         }}
//       >
//         <div>
//           <h1
//             style={{
//               margin: 0,
//               color: '#1a365d',
//               fontSize: '32px',
//               fontWeight: '600',
//             }}
//           >
//             Remote Console
//           </h1>
//           <p style={{ color: '#64748b', marginTop: '8px', fontSize: '14px' }}>
//             SSH and Manage your AnyLog Nodes
//           </p>
//         </div>

//         {/* Add Connection Button */}
//         <button
//           style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: '8px',
//             backgroundColor: '#000',
//             color: 'white',
//             padding: '12px 24px',
//             border: 'none',
//             borderRadius: '8px',
//             cursor: 'pointer',
//             fontSize: '16px',
//             fontWeight: '500',
//             transition: 'background-color 0.2s',
//           }}
//           onClick={addConnection}
//         >
//           + Add Connection
//         </button>
//       </div>

//       {/* Connection Form */}
//       <div
//         style={{
//           display: 'flex',
//           flexDirection: 'column',
//           gap: '12px',
//           marginBottom: '24px',
//           backgroundColor: 'white',
//           padding: '16px',
//           borderRadius: '8px',
//           border: '1px solid #e2e8f0',
//         }}
//       >
//         <input
//           type="text"
//           placeholder="Hostname"
//           value={newConnection.hostname}
//           onChange={(e) =>
//             setNewConnection({ ...newConnection, hostname: e.target.value })
//           }
//           style={{
//             padding: '8px',
//             borderRadius: '4px',
//             border: '1px solid #cbd5e1',
//             fontSize: '14px',
//           }}
//         />
//         <input
//           type="text"
//           placeholder="IP Address"
//           value={newConnection.ip}
//           onChange={(e) =>
//             setNewConnection({ ...newConnection, ip: e.target.value })
//           }
//           style={{
//             padding: '8px',
//             borderRadius: '4px',
//             border: '1px solid #cbd5e1',
//             fontSize: '14px',
//           }}
//         />
//         <input
//           type="text"
//           placeholder="User"
//           value={newConnection.user}
//           onChange={(e) =>
//             setNewConnection({ ...newConnection, user: e.target.value })
//           }
//           style={{
//             padding: '8px',
//             borderRadius: '4px',
//             border: '1px solid #cbd5e1',
//             fontSize: '14px',
//           }}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={newConnection.password}
//           onChange={(e) =>
//             setNewConnection({ ...newConnection, password: e.target.value })
//           }
//           style={{
//             padding: '8px',
//             borderRadius: '4px',
//             border: '1px solid #cbd5e1',
//             fontSize: '14px',
//           }}
//         />
//       </div>
//     </>
//   );
// };

// export default Header;
