import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './styles/App.css'; // Import your global styles here
import { isLoggedIn } from './services/auth';




// npm i -D react-router-dom ------> NEED TO INSTALL REACT-ROUTER-DOM TO WORK PROPERLY
function App() {
  // localStorage.clear();
  // const isAuthenticated = isLoggedIn();
  // console.log("isAuthenticated in APP.js:", isAuthenticated);

  

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard/*"
          element={isLoggedIn() ? <Dashboard /> : <Navigate to="/dashboard" />}
        />
        {/* Default Route */}
        <Route path="*" element={<Navigate to={isLoggedIn() ? "/dashboard/client" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
