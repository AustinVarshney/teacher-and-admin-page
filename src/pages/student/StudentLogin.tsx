import React, { useState } from 'react';
import './StudentLogin.css';

interface StudentLoginProps {
  onLogin: () => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLogin }) => {
  const [panNumber, setPanNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (panNumber === 'PAN123456' && password === 'student123') {
        onLogin();
      } else {
        setError('Invalid PAN number or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="student-login">
      <div className="student-login-container">
        <div className="student-login-header">
          <div className="student-logo">
            <div className="logo-icon">🏫</div>
            <h1>SLMS Student</h1>
          </div>
          <p className="student-subtitle">School Learning Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="student-login-form">
          <div className="form-group">
            <label htmlFor="panNumber">PAN Number</label>
            <input
              type="text"
              id="panNumber"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              placeholder="Enter your PAN number"
              required
              className="student-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="student-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className="student-login-btn"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="student-login-footer">
          <p>Demo Credentials:</p>
          <p>PAN: PAN123456 | Password: student123</p>
          <p className="admin-link">
            <a href="/admin">Admin Login</a>
          </p>
          <p className="teacher-link">
            <a href="/teacher">Teacher Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin; 