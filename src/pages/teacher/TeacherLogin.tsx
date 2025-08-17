import React, { useState } from 'react';
import './TeacherLogin.css';

interface TeacherLoginProps {
  onLogin: () => void;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    // Simulate login verification
    setTimeout(() => {
      if (email === 'teacher@slms.com' && password === 'teacher123') {
        onLogin();
      } else {
        setError('Invalid email or password. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="teacher-login">
      <div className="teacher-login-container">
        <div className="teacher-login-header">
          <div className="teacher-logo">
            <div className="logo-icon">👨‍🏫</div>
            <h1>SLMS Teacher</h1>
          </div>
          <p className="teacher-subtitle">School Learning Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className="teacher-login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="teacher-input"
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
              className="teacher-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="teacher-login-btn"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="teacher-login-btn secondary"
          >
            Clear Form
          </button>
        </form>
        
        <div className="teacher-login-footer">
          <p>Demo Credentials:</p>
          <p>Email: teacher@slms.com | Password: teacher123</p>
          <p className="admin-link">
            <a href="/admin">Admin Login</a>
          </p>
          <p className="student-link">
            <a href="/">Student Login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin; 