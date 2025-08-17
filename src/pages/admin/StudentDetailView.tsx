import React, { useState } from 'react';
import { Student, FeeCatalog } from '../../types/admin';
import './StudentDetailView.css';

interface StudentDetailViewProps {
  student: Student;
  feeCatalog: FeeCatalog;
  onClose: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, feeCatalog, onClose }) => {
  const [activeTab, setActiveTab] = useState('personal');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();

  const renderPersonalInfo = () => (
    <div className="personal-info">
      <div className="info-grid">
        <div className="info-item">
          <label>Full Name:</label>
          <span>{student.name}</span>
        </div>
        <div className="info-item">
          <label>Class:</label>
          <span>{student.currentClass} - Section {student.section}</span>
        </div>
        <div className="info-item">
          <label>Roll Number:</label>
          <span>{student.classRollNumber}</span>
        </div>
        <div className="info-item">
          <label>Date of Birth:</label>
          <span>{student.dateOfBirth}</span>
        </div>
        <div className="info-item">
          <label>Gender:</label>
          <span>{student.gender}</span>
        </div>
        <div className="info-item">
          <label>Blood Group:</label>
          <span>{student.bloodGroup}</span>
        </div>
        <div className="info-item">
          <label>Admission Date:</label>
          <span>{student.admissionDate}</span>
        </div>
        <div className="info-item">
          <label>Previous School:</label>
          <span>{student.previousSchool || 'N/A'}</span>
        </div>
      </div>

      <div className="contact-info">
        <h4>Contact Information</h4>
        <div className="info-grid">
          <div className="info-item">
            <label>Parent Name:</label>
            <span>{student.parentName}</span>
          </div>
          <div className="info-item">
            <label>Mobile Number:</label>
            <span>{student.mobileNumber}</span>
          </div>
          <div className="info-item">
            <label>Emergency Contact:</label>
            <span>{student.emergencyContact}</span>
          </div>
          <div className="info-item full-width">
            <label>Address:</label>
            <span>{student.address}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeeCatalog = () => (
    <div className="fee-catalog">
      <div className="fee-summary">
        <div className="fee-summary-card">
          <h4>Total Fee Amount</h4>
          <span className="amount">₹{feeCatalog.totalAmount.toLocaleString()}</span>
        </div>
        <div className="fee-summary-card paid">
          <h4>Total Paid</h4>
          <span className="amount">₹{feeCatalog.totalPaid.toLocaleString()}</span>
        </div>
        <div className="fee-summary-card pending">
          <h4>Total Pending</h4>
          <span className="amount">₹{feeCatalog.totalPending.toLocaleString()}</span>
        </div>
        <div className="fee-summary-card overdue">
          <h4>Total Overdue</h4>
          <span className="amount">₹{feeCatalog.totalOverdue.toLocaleString()}</span>
        </div>
      </div>

      <div className="fee-calendar">
        <h4>Monthly Fee Calendar - {currentYear}</h4>
        <div className="calendar-grid">
          {months.map((month) => {
            const monthFee = feeCatalog.monthlyFees.find(
              fee => fee.month === month && fee.year === currentYear
            );
            
            let status = 'pending';
            if (monthFee) {
              status = monthFee.status;
            }

            return (
              <div key={month} className={`calendar-month ${status}`}>
                <div className="month-name">{month}</div>
                <div className="month-status">
                  {status === 'paid' && <span className="status-paid">✓</span>}
                  {status === 'overdue' && <span className="status-overdue">⚠</span>}
                  {status === 'pending' && <span className="status-pending">○</span>}
                </div>
                {monthFee && (
                  <div className="month-amount">₹{monthFee.amount}</div>
                )}
                {!monthFee && (
                  <div className="month-amount">₹0</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fee-details">
        <h4>Detailed Fee Records</h4>
        <div className="fee-table">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Receipt No.</th>
              </tr>
            </thead>
            <tbody>
              {feeCatalog.monthlyFees.map((fee, index) => (
                <tr key={index} className={`fee-row ${fee.status}`}>
                  <td>{fee.month} {fee.year}</td>
                  <td>₹{fee.amount}</td>
                  <td>{fee.dueDate}</td>
                  <td>
                    <span className={`status-badge ${fee.status}`}>
                      {fee.status}
                    </span>
                  </td>
                  <td>{fee.paymentDate || '-'}</td>
                  <td>{fee.receiptNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAcademicInfo = () => (
    <div className="academic-info">
      <h4>Academic Information</h4>
      <div className="info-grid">
        <div className="info-item">
          <label>Current Class:</label>
          <span>{student.currentClass}</span>
        </div>
        <div className="info-item">
          <label>Section:</label>
          <span>{student.section}</span>
        </div>
        <div className="info-item">
          <label>Roll Number:</label>
          <span>{student.classRollNumber}</span>
        </div>
        <div className="info-item">
          <label>Admission Date:</label>
          <span>{student.admissionDate}</span>
        </div>
      </div>
      
      <div className="academic-actions">
        <button className="action-btn">View Results</button>
        <button className="action-btn">Update Academic Record</button>
        <button className="action-btn">Generate Report Card</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'fees':
        return renderFeeCatalog();
      case 'academic':
        return renderAcademicInfo();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="student-detail-overlay">
      <div className="student-detail-modal">
        <div className="modal-header">
          <h2>Student Details - {student.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            Fee Catalog
          </button>
          <button
            className={`tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            Academic Info
          </button>
        </div>

        <div className="modal-content">
          {renderContent()}
        </div>

        <div className="modal-footer">
          <div className="footer-buttons">
            <button 
              type="button"
              className="action-btn secondary" 
              onClick={onClose}
            >
              Close
            </button>
            <button 
              type="button"
              className="action-btn"
            >
              Edit Student
            </button>
            <button 
              type="button"
              className="action-btn"
            >
              Print Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailView; 