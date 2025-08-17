import React from 'react';
import './StudentDashboard.css';

interface StudentDashboardProps {
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <button className="menu-toggle">
              <span className="menu-icon">☰</span>
            </button>
            <h1>Student Dashboard</h1>
          </div>
          <div className="header-right">
            <div className="notification-wrapper">
              <button className="notification-button">
                <span className="notification-icon">🔔</span>
              </button>
            </div>
            <button className="profile-button">👤</button>
            <button className="logout-button" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome, Student!</h2>
          <p>This is your student dashboard. Here you can access your academic information, attendance, and more.</p>
        </div>

        <div className="dashboard-content">
          <div className="content-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn">View Attendance</button>
              <button className="action-btn">Check Timetable</button>
              <button className="action-btn">View Results</button>
              <button className="action-btn">Submit Leave Request</button>
            </div>
          </div>

          <div className="content-card">
            <h3>Recent Updates</h3>
            <p>No recent updates available.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;