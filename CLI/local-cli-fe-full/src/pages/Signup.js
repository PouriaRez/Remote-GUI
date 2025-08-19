import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup, isLoggedIn } from '../services/file_auth';
import '../styles/App.css';

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      console.log("Signing up with:", { email, firstName, lastName, password });
      const result = await signup({ email, password, firstName, lastName });
      console.log("Signup result:", result);
      if (isLoggedIn()) {
        navigate('/dashboard/client');
        // window.location.reload();
      } else {
        setError(result.message || "Signup failed.");
      }
    } catch (err) {
      setError(err.message || "Signup failed.");
    }
  };

  return (
    <div className="modern-login-page">
      <div className="modern-login-box">
        <h2 className="signup-brand">Create Account</h2>
        <p className="signup-subtitle">Sign up to get started with Anylog</p>
        <form onSubmit={handleSubmit} className="modern-login-form">
          <div className="form-group with-icon">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="form-group with-icon">
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="form-group with-icon">
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group with-icon">
            <input
              type="password"
              placeholder="Create Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group with-icon">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="login-submit">Sign up</button>
          <div className="login-links">
            <span>Already have an account? <Link to="/login">Login</Link></span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;