import React, { useState } from 'react';
import './TeacherDashboard.css';
import { 
  Teacher, 
  AssignedClass, 
  StudentQuery, 
  VideoLecture, 
  LeaveRequest, 
  StudentResult,
  ClassStudent,
  Notification,
  TCApprovalRequest
} from '../../types/teacher';

interface TeacherDashboardProps {
  onLogout: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTCModal, setShowTCModal] = useState(false);
  const [selectedTCRequest, setSelectedTCRequest] = useState<TCApprovalRequest | null>(null);

  // Mock data - in real app, this would come from API
  const mockTeacher: Teacher = {
    id: '1',
    name: 'Dr. Sunita Verma',
    mobileNumber: '9876543210',
    email: 'teacher@slms.com',
    qualification: 'Ph.D. in Mathematics',
    designation: 'Senior Mathematics Teacher',
    currentSchool: 'SLMS School',
    profilePhoto: '👩‍🏫',
    personalInfo: {
      address: '123 Teacher Colony, New Delhi',
      emergencyContact: '9876543211',
      bloodGroup: 'O+',
      dateOfBirth: '1985-03-15',
      joiningDate: '2010-04-01'
    }
  };

  const mockAssignedClasses: AssignedClass[] = [
    { id: '1', className: '10th', section: 'A', subject: 'Mathematics', periodNumber: 1, startTime: '08:00', endTime: '08:45', dayOfWeek: 'Monday', totalStudents: 35 },
    { id: '2', className: '10th', section: 'B', subject: 'Mathematics', periodNumber: 2, startTime: '08:45', endTime: '09:30', dayOfWeek: 'Monday', totalStudents: 32 },
    { id: '3', className: '9th', section: 'A', subject: 'Mathematics', periodNumber: 3, startTime: '09:45', endTime: '10:30', dayOfWeek: 'Monday', totalStudents: 30 },
    { id: '4', className: '9th', section: 'B', subject: 'Mathematics', periodNumber: 4, startTime: '10:30', endTime: '11:15', dayOfWeek: 'Monday', totalStudents: 28 },
  ];

  const mockStudentQueries: StudentQuery[] = [
    { id: '1', studentName: 'Rahul Kumar', studentClass: '10th', section: 'A', subject: 'Mathematics', question: 'Can you explain the quadratic formula again?', timestamp: '2024-01-15 10:30', status: 'pending' },
    { id: '2', studentName: 'Priya Sharma', studentClass: '9th', section: 'B', subject: 'Mathematics', question: 'I need help with trigonometry problems', timestamp: '2024-01-14 16:45', status: 'replied', reply: 'Sure! Let\'s schedule a session tomorrow.', replyTimestamp: '2024-01-14 17:00' },
  ];

  const mockVideoLectures: VideoLecture[] = [
    { id: '1', title: 'Introduction to Algebra', className: '9th', section: 'A', subject: 'Mathematics', description: 'Basic concepts of algebra and variables', videoUrl: '#', thumbnailUrl: '📹', uploadDate: '2024-01-10', duration: '45:00', views: 45 },
    { id: '2', title: 'Quadratic Equations', className: '10th', section: 'A', subject: 'Mathematics', description: 'Solving quadratic equations using different methods', videoUrl: '#', thumbnailUrl: '📹', uploadDate: '2024-01-08', duration: '50:00', views: 38 },
  ];

  const mockLeaveRequests: LeaveRequest[] = [
    { id: '1', studentName: 'Amit Patel', studentClass: '10th', section: 'A', reason: 'Family function', startDate: '2024-01-20', endDate: '2024-01-22', requestDate: '2024-01-15', status: 'pending', imageUrl: '📷' },
    { id: '2', studentName: 'Neha Singh', studentClass: '9th', section: 'B', reason: 'Medical appointment', startDate: '2024-01-18', endDate: '2024-01-18', requestDate: '2024-01-14', status: 'approved', teacherRemarks: 'Approved for medical reasons' },
  ];

  const mockStudentResults: StudentResult[] = [
    { id: '1', studentName: 'Rahul Kumar', studentClass: '10th', section: 'A', subject: 'Mathematics', examType: 'Mid Term', examDate: '2024-01-10', marks: 85, totalMarks: 100, percentage: 85, grade: 'A', remarks: 'Good performance' },
    { id: '2', studentName: 'Priya Sharma', studentClass: '9th', section: 'B', subject: 'Mathematics', examType: 'Mid Term', examDate: '2024-01-10', marks: 92, totalMarks: 100, percentage: 92, grade: 'A+', remarks: 'Excellent work' },
  ];

  const mockClassStudents: ClassStudent[] = [
    { id: '1', name: 'Rahul Kumar', parentName: 'Rajesh Kumar', mobileNumber: '9876543210', currentClass: '10th', section: 'A', feeStatus: 'paid', attendance: { present: 45, absent: 5, total: 50 }, performance: { averageScore: 85, grade: 'A' } },
    { id: '2', name: 'Priya Sharma', parentName: 'Amit Sharma', mobileNumber: '9876543211', currentClass: '9th', section: 'B', feeStatus: 'pending', attendance: { present: 42, absent: 8, total: 50 }, performance: { averageScore: 78, grade: 'B+' } },
  ];

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'tc_approval',
      title: 'TC Approval Required',
      message: 'Admin has requested your approval for Rahul Kumar\'s transfer certificate',
      timestamp: '2024-01-15 14:30',
      isRead: false,
      priority: 'high',
      relatedData: {
        studentId: '1',
        studentName: 'Rahul Kumar',
        tcRequestId: 'tc001'
      }
    },
    {
      id: '2',
      type: 'admin_message',
      title: 'Monthly Report Due',
      message: 'Please submit your monthly class performance report by end of week',
      timestamp: '2024-01-15 10:15',
      isRead: false,
      priority: 'medium',
      relatedData: {
        adminId: 'admin1',
        adminName: 'Principal'
      }
    },
    {
      id: '3',
      type: 'system_update',
      title: 'System Maintenance',
      message: 'SLMS will be under maintenance on Sunday from 2-4 AM',
      timestamp: '2024-01-14 16:45',
      isRead: true,
      priority: 'low'
    },
    {
      id: '4',
      type: 'tc_approval',
      title: 'TC Approval Required',
      message: 'Admin has requested your approval for Priya Sharma\'s transfer certificate',
      timestamp: '2024-01-14 11:20',
      isRead: false,
      priority: 'high',
      relatedData: {
        studentId: '2',
        studentName: 'Priya Sharma',
        tcRequestId: 'tc002'
      }
    }
  ];

  const mockTCApprovalRequests: TCApprovalRequest[] = [
    {
      id: 'tc001',
      studentId: '1',
      studentName: 'Rahul Kumar',
      studentClass: '10th',
      section: 'A',
      reason: 'Family relocation to another city',
      requestDate: '2024-01-15',
      adminMessage: 'Please review this transfer certificate request and provide your approval or rejection with remarks.',
      adminName: 'Principal',
      status: 'pending'
    },
    {
      id: 'tc002',
      studentId: '2',
      studentName: 'Priya Sharma',
      studentClass: '9th',
      section: 'B',
      reason: 'Transfer to another school',
      requestDate: '2024-01-14',
      adminMessage: 'Student has requested transfer due to academic reasons. Please evaluate and respond.',
      adminName: 'Principal',
      status: 'pending'
    }
  ];

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'tc_approval') {
      const tcRequest = mockTCApprovalRequests.find(req => req.id === notification.relatedData?.tcRequestId);
      if (tcRequest) {
        setSelectedTCRequest(tcRequest);
        setShowTCModal(true);
      }
    }
    
    // Mark notification as read
    notification.isRead = true;
    setShowNotifications(false);
  };

  const handleTCResponse = (tcId: string, response: 'approved' | 'rejected', remarks: string) => {
    const tcRequest = mockTCApprovalRequests.find(req => req.id === tcId);
    if (tcRequest) {
      tcRequest.status = response;
      tcRequest.teacherResponse = remarks;
      tcRequest.responseDate = new Date().toISOString();
    }
    setShowTCModal(false);
    setSelectedTCRequest(null);
  };

  const unreadNotificationsCount = mockNotifications.filter(n => !n.isRead).length;

  const renderNotifications = () => (
    <div className={`notifications-panel ${showNotifications ? 'show' : ''}`}>
      <div className="notifications-header">
        <h3>Notifications ({unreadNotificationsCount} unread)</h3>
        <button 
          className="close-notifications"
          onClick={() => setShowNotifications(false)}
        >
          ×
        </button>
      </div>
      <div className="notifications-list">
        {mockNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.priority}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-icon">
              {notification.type === 'tc_approval' && '📋'}
              {notification.type === 'admin_message' && '👨‍💼'}
              {notification.type === 'system_update' && '🔧'}
              {notification.type === 'student_query' && '❓'}
            </div>
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span className="notification-time">{notification.timestamp}</span>
            </div>
            <div className="notification-priority">
              <span className={`priority-badge ${notification.priority}`}>
                {notification.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTCModal = () => (
    showTCModal && selectedTCRequest && (
      <div className="tc-modal-overlay">
        <div className="tc-modal">
          <div className="tc-modal-header">
            <h3>Transfer Certificate Approval</h3>
            <button 
              className="close-tc-modal"
              onClick={() => setShowTCModal(false)}
            >
              ×
            </button>
          </div>
          <div className="tc-modal-content">
            <div className="tc-student-info">
              <h4>Student Information</h4>
              <p><strong>Name:</strong> {selectedTCRequest.studentName}</p>
              <p><strong>Class:</strong> {selectedTCRequest.studentClass} - {selectedTCRequest.section}</p>
              <p><strong>Reason:</strong> {selectedTCRequest.reason}</p>
              <p><strong>Request Date:</strong> {selectedTCRequest.requestDate}</p>
            </div>
            
            <div className="admin-message">
              <h4>Admin Message</h4>
              <p><strong>From:</strong> {selectedTCRequest.adminName}</p>
              <p>{selectedTCRequest.adminMessage}</p>
            </div>

            {selectedTCRequest.status === 'pending' && (
              <div className="tc-response-form">
                <h4>Your Response</h4>
                <textarea 
                  placeholder="Add your remarks (optional)"
                  className="tc-remarks"
                  rows={3}
                />
                <div className="tc-actions">
                  <button 
                    className="action-btn approve"
                    onClick={() => handleTCResponse(selectedTCRequest.id, 'approved', 'Approved')}
                  >
                    Approve
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleTCResponse(selectedTCRequest.id, 'rejected', 'Rejected')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {selectedTCRequest.status !== 'pending' && (
              <div className="tc-response-status">
                <h4>Your Response</h4>
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${selectedTCRequest.status}`}>
                    {selectedTCRequest.status}
                  </span>
                </p>
                {selectedTCRequest.teacherResponse && (
                  <p><strong>Remarks:</strong> {selectedTCRequest.teacherResponse}</p>
                )}
                {selectedTCRequest.responseDate && (
                  <p><strong>Response Date:</strong> {selectedTCRequest.responseDate}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  );

  const renderHome = () => (
    <div className="home-section">
      <div className="teacher-profile">
        <div className="profile-header">
          <div className="profile-photo">{mockTeacher.profilePhoto}</div>
          <div className="profile-info">
            <h2>{mockTeacher.name}</h2>
            <p className="designation">{mockTeacher.designation}</p>
            <p className="qualification">{mockTeacher.qualification}</p>
            <p className="school">{mockTeacher.currentSchool}</p>
          </div>
        </div>
        
        <div className="personal-info-grid">
          <div className="info-item">
            <label>Address:</label>
            <span>{mockTeacher.personalInfo.address}</span>
          </div>
          <div className="info-item">
            <label>Emergency Contact:</label>
            <span>{mockTeacher.personalInfo.emergencyContact}</span>
          </div>
          <div className="info-item">
            <label>Blood Group:</label>
            <span>{mockTeacher.personalInfo.bloodGroup}</span>
          </div>
          <div className="info-item">
            <label>Date of Birth:</label>
            <span>{mockTeacher.personalInfo.dateOfBirth}</span>
          </div>
          <div className="info-item">
            <label>Joining Date:</label>
            <span>{mockTeacher.personalInfo.joiningDate}</span>
          </div>
        </div>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Total Classes</h3>
            <p className="stat-number">{mockAssignedClasses.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <p className="stat-number">{mockAssignedClasses.reduce((sum, cls) => sum + cls.totalStudents, 0)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❓</div>
          <div className="stat-content">
            <h3>Pending Queries</h3>
            <p className="stat-number">{mockStudentQueries.filter(q => q.status === 'pending').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>Leave Requests</h3>
            <p className="stat-number">{mockLeaveRequests.filter(l => l.status === 'pending').length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignedClasses = () => (
    <div className="assigned-classes-section">
      <h3>Assigned Classes</h3>
      <div className="classes-grid">
        {mockAssignedClasses.map((cls) => (
          <div key={cls.id} className="class-card">
            <div className="class-header">
              <h4>{cls.className} - Section {cls.section}</h4>
              <span className="subject-badge">{cls.subject}</span>
            </div>
            <div className="class-details">
              <p><strong>Period:</strong> {cls.periodNumber}</p>
              <p><strong>Time:</strong> {cls.startTime} - {cls.endTime}</p>
              <p><strong>Day:</strong> {cls.dayOfWeek}</p>
              <p><strong>Students:</strong> {cls.totalStudents}</p>
            </div>
            <div className="class-actions">
              <button className="action-btn">View Students</button>
              <button className="action-btn">Upload Lecture</button>
              <button className="action-btn">Take Attendance</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderQueries = () => (
    <div className="queries-section">
      <h3>Student Queries</h3>
      <div className="queries-list">
        {mockStudentQueries.map((query) => (
          <div key={query.id} className={`query-card ${query.status}`}>
            <div className="query-header">
              <h4>{query.studentName}</h4>
              <span className={`status-badge ${query.status}`}>{query.status}</span>
            </div>
            <div className="query-details">
              <p><strong>Class:</strong> {query.studentClass} - {query.section}</p>
              <p><strong>Subject:</strong> {query.subject}</p>
              <p><strong>Question:</strong> {query.question}</p>
              <p><strong>Time:</strong> {query.timestamp}</p>
            </div>
            {query.status === 'replied' && (
              <div className="query-reply">
                <p><strong>Your Reply:</strong> {query.reply}</p>
                <p><strong>Reply Time:</strong> {query.replyTimestamp}</p>
              </div>
            )}
            <div className="query-actions">
              {query.status === 'pending' && (
                <button className="action-btn reply-btn">Reply</button>
              )}
              <button className="action-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVideoLectures = () => (
    <div className="video-lectures-section">
      <h3>Video Lectures</h3>
      <div className="lectures-header">
        <button className="action-btn upload-btn">+ Upload New Lecture</button>
      </div>
      <div className="lectures-grid">
        {mockVideoLectures.map((lecture) => (
          <div key={lecture.id} className="lecture-card">
            <div className="lecture-thumbnail">{lecture.thumbnailUrl}</div>
            <div className="lecture-content">
              <h4>{lecture.title}</h4>
              <p className="lecture-class">{lecture.className} - {lecture.section}</p>
              <p className="lecture-subject">{lecture.subject}</p>
              <p className="lecture-description">{lecture.description}</p>
              <div className="lecture-meta">
                <span>📅 {lecture.uploadDate}</span>
                <span>⏱️ {lecture.duration}</span>
                <span>👁️ {lecture.views} views</span>
              </div>
            </div>
            <div className="lecture-actions">
              <button className="action-btn">Edit</button>
              <button className="action-btn">Delete</button>
              <button className="action-btn">View</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLeaveRequests = () => (
    <div className="leave-requests-section">
      <h3>Leave Requests</h3>
      <div className="leave-requests-list">
        {mockLeaveRequests.map((request) => (
          <div key={request.id} className={`leave-request-card ${request.status}`}>
            <div className="leave-header">
              <h4>{request.studentName}</h4>
              <span className={`status-badge ${request.status}`}>{request.status}</span>
            </div>
            <div className="leave-details">
              <p><strong>Class:</strong> {request.studentClass} - {request.section}</p>
              <p><strong>Reason:</strong> {request.reason}</p>
              <p><strong>From:</strong> {request.startDate}</p>
              <p><strong>To:</strong> {request.endDate}</p>
              <p><strong>Request Date:</strong> {request.requestDate}</p>
            </div>
            {request.imageUrl && (
              <div className="leave-image">
                <span>📷 Supporting Document</span>
              </div>
            )}
            {request.teacherRemarks && (
              <div className="teacher-remarks">
                <p><strong>Your Remarks:</strong> {request.teacherRemarks}</p>
              </div>
            )}
            <div className="leave-actions">
              {request.status === 'pending' && (
                <>
                  <button className="action-btn approve">Approve</button>
                  <button className="action-btn reject">Reject</button>
                </>
              )}
              <button className="action-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="results-section">
      <h3>Student Results</h3>
      <div className="results-header">
        <button className="action-btn upload-btn">+ Upload New Result</button>
      </div>
      <div className="results-list">
        {mockStudentResults.map((result) => (
          <div key={result.id} className="result-card">
            <div className="result-header">
              <h4>{result.studentName}</h4>
              <span className="grade-badge">{result.grade}</span>
            </div>
            <div className="result-details">
              <p><strong>Class:</strong> {result.studentClass} - {result.section}</p>
              <p><strong>Subject:</strong> {result.subject}</p>
              <p><strong>Exam:</strong> {result.examType}</p>
              <p><strong>Date:</strong> {result.examDate}</p>
              <p><strong>Marks:</strong> {result.marks}/{result.totalMarks}</p>
              <p><strong>Percentage:</strong> {result.percentage}%</p>
              {result.remarks && <p><strong>Remarks:</strong> {result.remarks}</p>}
            </div>
            <div className="result-actions">
              <button className="action-btn">Edit</button>
              <button className="action-btn">Delete</button>
              <button className="action-btn">Print</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStudentInfo = () => (
    <div className="student-info-section">
      <h3>Student Information</h3>
      <div className="class-selector">
        <select 
          value={selectedClass} 
          onChange={(e) => setSelectedClass(e.target.value)}
          className="class-select"
        >
          <option value="">Select Class</option>
          {Array.from(new Set(mockAssignedClasses.map(cls => `${cls.className}-${cls.section}`))).map(className => (
            <option key={className} value={className}>{className}</option>
          ))}
        </select>
      </div>
      
      {selectedClass && (
        <div className="students-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Parent Name</th>
                <th>Mobile</th>
                <th>Fee Status</th>
                <th>Attendance</th>
                <th>Performance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockClassStudents
                .filter(student => `${student.currentClass}-${student.section}` === selectedClass)
                .map((student) => (
                  <tr key={student.id}>
                    <td>{student.name}</td>
                    <td>{student.parentName}</td>
                    <td>{student.mobileNumber}</td>
                    <td>
                      <span className={`status-badge ${student.feeStatus}`}>
                        {student.feeStatus}
                      </span>
                    </td>
                    <td>
                      {student.attendance.present}/{student.attendance.total}
                      <span className="attendance-percentage">
                        ({Math.round((student.attendance.present / student.attendance.total) * 100)}%)
                      </span>
                    </td>
                    <td>
                      <span className="grade-badge">{student.performance.grade}</span>
                      <span className="score">({student.performance.averageScore}%)</span>
                    </td>
                    <td>
                      <button className="action-btn">View Details</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'classes':
        return renderAssignedClasses();
      case 'queries':
        return renderQueries();
      case 'lectures':
        return renderVideoLectures();
      case 'leave':
        return renderLeaveRequests();
      case 'results':
        return renderResults();
      case 'students':
        return renderStudentInfo();
      default:
        return renderHome();
    }
  };

  return (
    <div className="teacher-dashboard">
      <nav className="teacher-navbar">
        <div className="nav-brand">
          <div className="brand-icon">👨‍🏫</div>
          <h2>SLMS Teacher</h2>
        </div>
        <div className="nav-actions">
          <button 
            className="nav-btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
            {unreadNotificationsCount > 0 && (
              <span className="notification-badge">{unreadNotificationsCount}</span>
            )}
          </button>
          <button className="nav-btn">👤</button>
          <button className="nav-btn logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="teacher-content">
        <aside className="teacher-sidebar">
          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              🏠 Home
            </button>
            <button
              className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              📚 Assigned Classes
            </button>
            <button
              className={`nav-item ${activeTab === 'queries' ? 'active' : ''}`}
              onClick={() => setActiveTab('queries')}
            >
              ❓ Queries
            </button>
            <button
              className={`nav-item ${activeTab === 'lectures' ? 'active' : ''}`}
              onClick={() => setActiveTab('lectures')}
            >
              📹 Video Lectures
            </button>
            <button
              className={`nav-item ${activeTab === 'leave' ? 'active' : ''}`}
              onClick={() => setActiveTab('leave')}
            >
              📝 Leave Requests
            </button>
            <button
              className={`nav-item ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              📊 Results
            </button>
            <button
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              👥 Student Information
            </button>
          </nav>
        </aside>

        <main className="teacher-main">
          <div className="main-header">
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}</h1>
          </div>
          <div className="main-content">
            {renderContent()}
          </div>
        </main>
      </div>
      {renderNotifications()}
      {renderTCModal()}
    </div>
  );
};

export default TeacherDashboard; 