import React, { useState } from 'react';
import './AdminDashboard.css';
import StudentDetailView from './StudentDetailView';
import { 
  Student, 
  TeachingStaff, 
  NonTeachingStaff, 
  TransferCertificate, 
  Event, 
  Message,
  ClassData,
  FeeCatalog
} from '../../types/admin';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);

  // Mock data - in real app, this would come from API
  const mockStudents: Student[] = [
    { 
      id: '1', 
      name: 'Rahul Kumar', 
      section: 'A', 
      classRollNumber: 1, 
      feeStatus: 'paid', 
      feeCatalogStatus: 'up_to_date', 
      currentClass: '10th', 
      parentName: 'Rajesh Kumar', 
      mobileNumber: '9876543210',
      dateOfBirth: '2008-05-15',
      gender: 'male',
      address: '123 Main Street, New Delhi, India',
      emergencyContact: '9876543211',
      bloodGroup: 'B+',
      admissionDate: '2020-04-01',
      previousSchool: 'Delhi Public School'
    },
    { 
      id: '2', 
      name: 'Priya Sharma', 
      section: 'B', 
      classRollNumber: 5, 
      feeStatus: 'pending', 
      feeCatalogStatus: 'pending', 
      currentClass: '9th', 
      parentName: 'Amit Sharma', 
      mobileNumber: '9876543211',
      dateOfBirth: '2009-08-22',
      gender: 'female',
      address: '456 Park Avenue, Mumbai, India',
      emergencyContact: '9876543212',
      bloodGroup: 'O+',
      admissionDate: '2021-04-01',
      previousSchool: 'Mumbai International School'
    },
    { 
      id: '3', 
      name: 'Amit Patel', 
      section: 'A', 
      classRollNumber: 12, 
      feeStatus: 'overdue', 
      feeCatalogStatus: 'overdue', 
      currentClass: '11th', 
      parentName: 'Ramesh Patel', 
      mobileNumber: '9876543212',
      dateOfBirth: '2007-12-10',
      gender: 'male',
      address: '789 Lake Road, Bangalore, India',
      emergencyContact: '9876543213',
      bloodGroup: 'A+',
      admissionDate: '2019-04-01',
      previousSchool: 'Bangalore Central School'
    },
  ];

  // Mock fee catalog data
  const mockFeeCatalogs: FeeCatalog[] = [
    {
      studentId: '1',
      monthlyFees: [
        { month: 'January', year: 2024, amount: 5000, dueDate: '2024-01-15', status: 'paid', paymentDate: '2024-01-10', receiptNumber: 'R001' },
        { month: 'February', year: 2024, amount: 5000, dueDate: '2024-02-15', status: 'paid', paymentDate: '2024-02-12', receiptNumber: 'R002' },
        { month: 'March', year: 2024, amount: 5000, dueDate: '2024-03-15', status: 'paid', paymentDate: '2024-03-14', receiptNumber: 'R003' },
        { month: 'April', year: 2024, amount: 5000, dueDate: '2024-04-15', status: 'paid', paymentDate: '2024-04-13', receiptNumber: 'R004' },
        { month: 'May', year: 2024, amount: 5000, dueDate: '2024-05-15', status: 'paid', paymentDate: '2024-05-11', receiptNumber: 'R005' },
        { month: 'June', year: 2024, amount: 5000, dueDate: '2024-06-15', status: 'paid', paymentDate: '2024-06-10', receiptNumber: 'R006' },
        { month: 'July', year: 2024, amount: 5000, dueDate: '2024-07-15', status: 'paid', paymentDate: '2024-07-12', receiptNumber: 'R007' },
        { month: 'August', year: 2024, amount: 5000, dueDate: '2024-08-15', status: 'paid', paymentDate: '2024-08-14', receiptNumber: 'R008' },
        { month: 'September', year: 2024, amount: 5000, dueDate: '2024-09-15', status: 'paid', paymentDate: '2024-09-13', receiptNumber: 'R009' },
        { month: 'October', year: 2024, amount: 5000, dueDate: '2024-10-15', status: 'paid', paymentDate: '2024-10-11', receiptNumber: 'R010' },
        { month: 'November', year: 2024, amount: 5000, dueDate: '2024-11-15', status: 'paid', paymentDate: '2024-11-12', receiptNumber: 'R011' },
        { month: 'December', year: 2024, amount: 5000, dueDate: '2024-12-15', status: 'pending' }
      ],
      totalAmount: 60000,
      totalPaid: 55000,
      totalPending: 5000,
      totalOverdue: 0
    },
    {
      studentId: '2',
      monthlyFees: [
        { month: 'January', year: 2024, amount: 4500, dueDate: '2024-01-15', status: 'paid', paymentDate: '2024-01-10', receiptNumber: 'R012' },
        { month: 'February', year: 2024, amount: 4500, dueDate: '2024-02-15', status: 'paid', paymentDate: '2024-02-12', receiptNumber: 'R013' },
        { month: 'March', year: 2024, amount: 4500, dueDate: '2024-03-15', status: 'paid', paymentDate: '2024-03-14', receiptNumber: 'R014' },
        { month: 'April', year: 2024, amount: 4500, dueDate: '2024-04-15', status: 'paid', paymentDate: '2024-04-13', receiptNumber: 'R015' },
        { month: 'May', year: 2024, amount: 4500, dueDate: '2024-05-15', status: 'pending' },
        { month: 'June', year: 2024, amount: 4500, dueDate: '2024-06-15', status: 'pending' },
        { month: 'July', year: 2024, amount: 4500, dueDate: '2024-07-15', status: 'pending' },
        { month: 'August', year: 2024, amount: 4500, dueDate: '2024-08-15', status: 'pending' },
        { month: 'September', year: 2024, amount: 4500, dueDate: '2024-09-15', status: 'pending' },
        { month: 'October', year: 2024, amount: 4500, dueDate: '2024-10-15', status: 'pending' },
        { month: 'November', year: 2024, amount: 4500, dueDate: '2024-11-15', status: 'pending' },
        { month: 'December', year: 2024, amount: 4500, dueDate: '2024-12-15', status: 'pending' }
      ],
      totalAmount: 54000,
      totalPaid: 18000,
      totalPending: 36000,
      totalOverdue: 0
    },
    {
      studentId: '3',
      monthlyFees: [
        { month: 'January', year: 2024, amount: 5500, dueDate: '2024-01-15', status: 'overdue' },
        { month: 'February', year: 2024, amount: 5500, dueDate: '2024-02-15', status: 'overdue' },
        { month: 'March', year: 2024, amount: 5500, dueDate: '2024-03-15', status: 'overdue' },
        { month: 'April', year: 2024, amount: 5500, dueDate: '2024-04-15', status: 'overdue' },
        { month: 'May', year: 2024, amount: 5500, dueDate: '2024-05-15', status: 'overdue' },
        { month: 'June', year: 2024, amount: 5500, dueDate: '2024-06-15', status: 'overdue' },
        { month: 'July', year: 2024, amount: 5500, dueDate: '2024-07-15', status: 'pending' },
        { month: 'August', year: 2024, amount: 5500, dueDate: '2024-08-15', status: 'pending' },
        { month: 'September', year: 2024, amount: 5500, dueDate: '2024-09-15', status: 'pending' },
        { month: 'October', year: 2024, amount: 5500, dueDate: '2024-10-15', status: 'pending' },
        { month: 'November', year: 2024, amount: 5500, dueDate: '2024-11-15', status: 'pending' },
        { month: 'December', year: 2024, amount: 5500, dueDate: '2024-12-15', status: 'pending' }
      ],
      totalAmount: 66000,
      totalPaid: 0,
      totalPending: 33000,
      totalOverdue: 33000
    }
  ];

  const mockTeachingStaff: TeachingStaff[] = [
    { id: '1', name: 'Dr. Sunita Verma', designation: 'Principal', salaryGrade: 'A1', contactNumber: '9876543201', email: 'principal@slms.com', qualification: 'Ph.D. Education', assignedClasses: ['All Classes'] },
    { id: '2', name: 'Prof. Rajesh Singh', designation: 'Senior Teacher', salaryGrade: 'B1', contactNumber: '9876543202', email: 'rajesh@slms.com', qualification: 'M.Ed', assignedClasses: ['9th', '10th'] },
  ];

  const mockNonTeachingStaff: NonTeachingStaff[] = [
    { id: '1', name: 'Mohan Lal', designation: 'Accountant', contactNumber: '9876543301', email: 'accountant@slms.com' },
    { id: '2', name: 'Sita Devi', designation: 'Receptionist', contactNumber: '9876543302', email: 'reception@slms.com' },
  ];

  const mockTransferCertificates: TransferCertificate[] = [
    { id: '1', studentName: 'Rahul Kumar', studentClass: '10th A', requestDate: '2024-01-15', status: 'pending', reason: 'Family relocation' },
    { id: '2', studentName: 'Priya Sharma', studentClass: '9th B', requestDate: '2024-01-10', status: 'approved', reason: 'Transfer to another city' },
  ];

  const mockEvents: Event[] = [
    { id: '1', title: 'Annual Sports Day', date: '2024-02-15', type: 'sports', description: 'Annual sports competition for all classes' },
    { id: '2', title: 'Cultural Festival', date: '2024-03-20', type: 'cultural', description: 'Music, dance, and drama performances' },
  ];

  const mockMessages: Message[] = [
    { id: '1', from: 'Teacher', subject: 'Leave Request Approval', content: 'New leave request from student Rahul Kumar', timestamp: '2024-01-15 10:30', isRead: false },
    { id: '2', from: 'Accountant', subject: 'Fee Collection Report', content: 'Monthly fee collection report is ready', timestamp: '2024-01-14 16:45', isRead: true },
  ];

  const mockClassData: ClassData[] = [
    { className: '10th', section: 'A', students: mockStudents.filter(s => s.currentClass === '10th'), totalStudents: 35, feeCollectionRate: 85 },
    { className: '9th', section: 'B', students: mockStudents.filter(s => s.currentClass === '9th'), totalStudents: 32, feeCollectionRate: 78 },
  ];

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const handleCloseStudentDetail = () => {
    setShowStudentDetail(false);
    setSelectedStudent(null);
  };

  const getFeeCatalog = (studentId: string): FeeCatalog | undefined => {
    return mockFeeCatalogs.find(catalog => catalog.studentId === studentId);
  };

  const handleSendToTeacher = (tc: TransferCertificate) => {
    // In a real app, this would send a notification/message to the teacher
    // For now, we'll just show an alert
    alert(`TC request for ${tc.studentName} has been sent to the respective teacher for approval.`);
    
    // You could also update the TC status to 'sent_to_teacher' here
    console.log(`Sending TC request ${tc.id} to teacher for approval`);
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <p className="stat-number">1,247</p>
            <p className="stat-change positive">+12% from last month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🏫</div>
          <div className="stat-content">
            <h3>Teaching Staff</h3>
            <p className="stat-number">45</p>
            <p className="stat-change positive">+3 new this year</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Fee Collection</h3>
            <p className="stat-number">82%</p>
            <p className="stat-change positive">+5% from last month</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Pending Requests</h3>
            <p className="stat-number">23</p>
            <p className="stat-change negative">+8 from yesterday</p>
          </div>
        </div>
      </div>

      <div className="recent-activities">
        <h3>Recent Activities</h3>
        <div className="activity-list">
          {mockMessages.slice(0, 5).map((message) => (
            <div key={message.id} className={`activity-item ${!message.isRead ? 'unread' : ''}`}>
              <div className="activity-icon">📧</div>
              <div className="activity-content">
                <p className="activity-title">{message.subject}</p>
                <p className="activity-time">{message.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStudents = () => (
    <div className="students-section">
      <div className="section-header">
        <h3>Class-wise Student Data</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="class-tabs">
        {mockClassData.map((classData) => (
          <div key={classData.className} className="class-tab">
            <h4>{classData.className} - Section {classData.section}</h4>
            <div className="class-stats">
              <span>Total: {classData.totalStudents}</span>
              <span>Fee Collection: {classData.feeCollectionRate}%</span>
            </div>
            <div className="students-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Section</th>
                    <th>Fee Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classData.students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.classRollNumber}</td>
                      <td>{student.section}</td>
                      <td>
                        <span className={`status-badge ${student.feeStatus}`}>
                          {student.feeStatus}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-btn"
                          onClick={() => handleViewStudent(student)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="staff-section">
      <div className="staff-tabs">
        <div className="staff-tab">
          <h3>Teaching Staff</h3>
          <div className="staff-grid">
            {mockTeachingStaff.map((staff) => (
              <div key={staff.id} className="staff-card">
                <div className="staff-avatar">👨‍🏫</div>
                <div className="staff-info">
                  <h4>{staff.name}</h4>
                  <p className="staff-designation">{staff.designation}</p>
                  <p className="staff-qualification">{staff.qualification}</p>
                  <p className="staff-contact">{staff.contactNumber}</p>
                  <p className="staff-email">{staff.email}</p>
                  <div className="staff-classes">
                    <strong>Assigned Classes:</strong> {staff.assignedClasses.join(', ')}
                  </div>
                </div>
                <div className="staff-actions">
                  <button className="action-btn">Edit</button>
                  <button className="action-btn">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="staff-tab">
          <h3>Non-Teaching Staff</h3>
          <div className="staff-grid">
            {mockNonTeachingStaff.map((staff) => (
              <div key={staff.id} className="staff-card">
                <div className="staff-avatar">👷</div>
                <div className="staff-info">
                  <h4>{staff.name}</h4>
                  <p className="staff-designation">{staff.designation}</p>
                  <p className="staff-contact">{staff.contactNumber}</p>
                  <p className="staff-email">{staff.email}</p>
                </div>
                <div className="staff-actions">
                  <button className="action-btn">Edit</button>
                  <button className="action-btn">View Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransferCertificates = () => (
    <div className="transfer-certificates-section">
      <h3>Transfer Certificate Requests</h3>
      <div className="tc-requests">
        {mockTransferCertificates.map((tc) => (
          <div key={tc.id} className="tc-request-card">
            <div className="tc-header">
              <h4>{tc.studentName}</h4>
              <span className={`status-badge ${tc.status}`}>{tc.status}</span>
            </div>
            <div className="tc-details">
              <p><strong>Class:</strong> {tc.studentClass}</p>
              <p><strong>Request Date:</strong> {tc.requestDate}</p>
              <p><strong>Reason:</strong> {tc.reason}</p>
            </div>
            <div className="tc-actions">
              {tc.status === 'pending' && (
                <>
                  <button className="action-btn approve">Approve</button>
                  <button className="action-btn reject">Reject</button>
                  <button 
                    className="action-btn send-to-teacher"
                    onClick={() => handleSendToTeacher(tc)}
                  >
                    Send to Teacher for Approval
                  </button>
                </>
              )}
              <button className="action-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="events-section">
      <h3>Upcoming Events</h3>
      <div className="events-grid">
        {mockEvents.map((event) => (
          <div key={event.id} className="event-card">
            <div className={`event-type ${event.type}`}>{event.type}</div>
            <h4>{event.title}</h4>
            <p className="event-date">{event.date}</p>
            <p className="event-description">{event.description}</p>
            <div className="event-actions">
              <button className="action-btn">Edit</button>
              <button className="action-btn">Delete</button>
            </div>
          </div>
        ))}
        <div className="add-event-card">
          <div className="add-event-icon">+</div>
          <p>Add New Event</p>
        </div>
      </div>
    </div>
  );

  const renderInbox = () => (
    <div className="inbox-section">
      <h3>Inbox</h3>
      <div className="messages-list">
        {mockMessages.map((message) => (
          <div key={message.id} className={`message-item ${!message.isRead ? 'unread' : ''}`}>
            <div className="message-sender">{message.from}</div>
            <div className="message-content">
              <h4>{message.subject}</h4>
              <p>{message.content}</p>
              <span className="message-time">{message.timestamp}</span>
            </div>
            <div className="message-actions">
              <button className="action-btn">Reply</button>
              <button className="action-btn">Mark Read</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'students':
        return renderStudents();
      case 'staff':
        return renderStaff();
      case 'transfer-certificates':
        return renderTransferCertificates();
      case 'events':
        return renderEvents();
      case 'inbox':
        return renderInbox();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="admin-dashboard">
      <nav className="admin-navbar">
        <div className="nav-brand">
          <div className="brand-icon">🏫</div>
          <h2>SLMS Admin</h2>
        </div>
        <div className="nav-actions">
          <button className="nav-btn">🔔</button>
          <button className="nav-btn">👤</button>
          <button className="nav-btn logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="admin-content">
        <aside className="admin-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              👥 Students
            </button>
            <button
              className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              👨‍🏫 Staff
            </button>
            <button
              className={`nav-item ${activeTab === 'transfer-certificates' ? 'active' : ''}`}
              onClick={() => setActiveTab('transfer-certificates')}
            >
              📋 Transfer Certificates
            </button>
            <button
              className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
              onClick={() => setActiveTab('events')}
            >
              🎉 Events
            </button>
            <button
              className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbox')}
            >
              📧 Inbox
            </button>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="main-header">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}</h1>
          </div>
          <div className="main-content">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Student Detail Modal */}
      {showStudentDetail && selectedStudent && (
        <StudentDetailView
          student={selectedStudent}
          feeCatalog={getFeeCatalog(selectedStudent.id) || {
            studentId: selectedStudent.id,
            monthlyFees: [],
            totalAmount: 0,
            totalPaid: 0,
            totalPending: 0,
            totalOverdue: 0
          }}
          onClose={handleCloseStudentDetail}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 