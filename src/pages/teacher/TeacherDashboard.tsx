import React, { useState, useEffect } from 'react';
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
import TeacherService from '../../services/teacherService';
import LeaveService from '../../services/leaveService';
import MarkAttendance from './MarkAttendance';

interface TeacherDashboardProps {
  onLogout: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTCModal, setShowTCModal] = useState(false);
  const [selectedTCRequest, setSelectedTCRequest] = useState<TCApprovalRequest | null>(null);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<AssignedClass | null>(null);
  
  // State for data from database
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [studentCounts, setStudentCounts] = useState<{[classId: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for features not yet connected (will be connected in next iteration)
  const mockStudentQueries: StudentQuery[] = [
    { id: '1', studentName: 'Rahul Kumar', studentClass: '10th', section: 'A', subject: 'Mathematics', question: 'Can you explain the quadratic formula again?', timestamp: '2024-01-15 10:30', status: 'pending' },
    { id: '2', studentName: 'Priya Sharma', studentClass: '9th', section: 'B', subject: 'Mathematics', question: 'I need help with trigonometry problems', timestamp: '2024-01-14 16:45', status: 'replied', reply: 'Sure! Let\'s schedule a session tomorrow.', replyTimestamp: '2024-01-14 17:00' },
  ];

  const mockVideoLectures: VideoLecture[] = [
    { id: '1', title: 'Introduction to Algebra', className: '9th', section: 'A', subject: 'Mathematics', description: 'Basic concepts of algebra and variables', videoUrl: '#', thumbnailUrl: '📹', uploadDate: '2024-01-10', duration: '45:00', views: 45 },
    { id: '2', title: 'Quadratic Equations', className: '10th', section: 'A', subject: 'Mathematics', description: 'Solving quadratic equations using different methods', videoUrl: '#', thumbnailUrl: '📹', uploadDate: '2024-01-08', duration: '50:00', views: 38 },
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

  // Fetch data from database on component mount
  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch teacher profile
      const teacherData = await TeacherService.getCurrentTeacher();
      
      // Transform backend data to match frontend Teacher interface
      const transformedTeacher: Teacher = {
        id: teacherData.id?.toString() || '',
        name: teacherData.name || '',
        mobileNumber: teacherData.contactNumber || teacherData.mobileNumber || 'N/A',
        email: teacherData.email || '',
        qualification: teacherData.qualification || 'N/A',
        designation: teacherData.designation || 'Teacher',
        currentSchool: teacherData.currentSchool || 'SLMS School',
        profilePhoto: '👨‍🏫',
        personalInfo: {
          address: teacherData.address || 'N/A',
          emergencyContact: teacherData.emergencyContact || teacherData.contactNumber || 'N/A',
          bloodGroup: teacherData.bloodGroup || 'N/A',
          dateOfBirth: teacherData.dateOfBirth || 'N/A',
          joiningDate: teacherData.joiningDate || 'N/A'
        }
      };
      setTeacher(transformedTeacher);

      // Fetch assigned classes from timetable
      try {
        const timetableData = await TeacherService.getTeacherTimeTable();
        console.log('Raw timetable data from backend:', timetableData);
        
        const transformedClasses: AssignedClass[] = timetableData.map((item: any) => {
          console.log('Mapping timetable item:', {
            timetableId: item.id,
            classId: item.classId,
            className: item.className,
            section: item.section
          });
          
          return {
            id: item.id?.toString() || '',
            classId: item.classId?.toString() || '', // Store actual class ID
            className: item.className || item.class?.name || '',
            section: item.section || item.class?.section || '',
            subject: item.subjectName || item.subject?.name || '',
            periodNumber: item.period || 0,
            startTime: item.startTime || '',
            endTime: item.endTime || '',
            dayOfWeek: item.dayOfWeek || '',
            totalStudents: item.totalStudents || 0
          };
        });
        
        console.log('Transformed classes:', transformedClasses);
        setAssignedClasses(transformedClasses);

        // Fetch student counts for all classes
        const counts: {[classId: string]: number} = {};
        for (const cls of transformedClasses) {
          if (cls.classId) {
            try {
              const students = await TeacherService.getStudentsByClass(parseInt(cls.classId));
              counts[cls.classId] = students.length;
              console.log(`Class ${cls.className}-${cls.section} (ID: ${cls.classId}) has ${students.length} students`);
            } catch (err) {
              console.warn(`Failed to fetch students for class ${cls.classId}:`, err);
              counts[cls.classId] = 0;
            }
          }
        }
        setStudentCounts(counts);
        console.log('All student counts:', counts);

        // Fetch students for the first class (if any)
        if (transformedClasses.length > 0 && transformedClasses[0].classId) {
          console.log('Fetching students for classId:', transformedClasses[0].classId);
          await fetchStudentsForClass(transformedClasses[0].classId);
        }
      } catch (timetableError: any) {
        console.warn('No timetable assigned to teacher yet:', timetableError.message);
        setAssignedClasses([]); // Set empty array if no timetable exists
      }

      // Fetch leave requests
      await fetchLeaveRequests();

    } catch (err: any) {
      console.error('Error fetching teacher data:', err);
      setError(err.message || 'Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const leaveData = await LeaveService.getLeaveRequestsForTeacher();
      const transformedLeaves: LeaveRequest[] = leaveData.map((item: any) => ({
        id: item.id?.toString() || '',
        studentName: item.studentName || '',
        studentClass: item.studentClass || item.class?.name || '',
        section: item.section || item.class?.section || '',
        reason: item.reason || '',
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        requestDate: item.requestDate || '',
        status: item.status || 'pending',
        imageUrl: item.imageUrl || undefined,
        teacherRemarks: item.teacherRemarks || undefined
      }));
      setLeaveRequests(transformedLeaves);
    } catch (err: any) {
      // Silently handle - leave requests endpoint may not be implemented yet
      console.warn('Leave requests endpoint not available:', err.message);
      setLeaveRequests([]);
    }
  };

  const fetchStudentsForClass = async (classId: string) => {
    if (!classId) {
      console.error('Cannot fetch students: classId is empty or undefined');
      setClassStudents([]);
      return;
    }
    
    try {
      console.log('Fetching students for class ID:', classId);
      const studentsData = await TeacherService.getStudentsByClass(parseInt(classId));
      console.log('Students data received from backend:', studentsData);
      console.log('First student raw data:', studentsData[0]);
      
      const transformedStudents: ClassStudent[] = studentsData.map((student: any) => {
        console.log('Mapping student:', {
          panNumber: student.panNumber,
          name: student.name,
          parentName: student.parentName,
          mobileNumber: student.mobileNumber,
          currentClass: student.currentClass,
          section: student.section,
          feeStatus: student.feeStatus,
          classRollNumber: student.classRollNumber
        });
        
        return {
          id: student.panNumber || student.id?.toString() || '',
          name: student.name || 'N/A',
          parentName: student.parentName || student.guardianName || 'N/A',
          mobileNumber: student.mobileNumber || student.contactNumber || 'N/A',
          currentClass: student.currentClass || student.className || '',
          section: student.section || '',
          rollNumber: student.classRollNumber || 0,
          feeStatus: (student.feeStatus || 'PENDING').toLowerCase() as 'paid' | 'pending' | 'overdue',
          attendance: {
            present: student.attendancePresent || 0,
            absent: student.attendanceAbsent || 0,
            total: (student.attendancePresent || 0) + (student.attendanceAbsent || 0)
          },
          performance: {
            averageScore: student.averageScore || 0,
            grade: student.grade || 'N/A'
          }
        };
      });
      
      console.log('Transformed students:', transformedStudents);
      console.log('Total students fetched:', transformedStudents.length);
      setClassStudents(transformedStudents);
    } catch (err: any) {
      console.error('Error fetching students for classId', classId, ':', err);
      // Set empty array if class not found or error occurs
      setClassStudents([]);
    }
  };

  const fetchStudentResults = async () => {
    try {
      // Fetch results for all students in teacher's classes
      const results: StudentResult[] = [];
      for (const cls of assignedClasses) {
        const studentsData = await TeacherService.getStudentsByClass(parseInt(cls.id));
        for (const student of studentsData) {
          if (student.panNumber) {
            const scores = await TeacherService.getStudentScores(student.panNumber);
            scores.forEach((score: any) => {
              results.push({
                id: score.id?.toString() || '',
                studentName: student.name || '',
                studentClass: cls.className,
                section: cls.section,
                subject: score.subjectName || '',
                examType: score.examType || '',
                examDate: score.examDate || '',
                marks: score.marksObtained || 0,
                totalMarks: score.totalMarks || 100,
                percentage: score.percentage || 0,
                grade: score.grade || '',
                remarks: score.remarks || undefined
              });
            });
          }
        }
      }
      setStudentResults(results);
    } catch (err: any) {
      console.error('Error fetching student results:', err);
    }
  };

  // Load results when Results tab is activated
  useEffect(() => {
    if (activeTab === 'results' && studentResults.length === 0) {
      fetchStudentResults();
    }
  }, [activeTab]);

  // Handle leave request approval
  const handleApproveLeave = async (requestId: string) => {
    try {
      await LeaveService.approveLeaveRequest(parseInt(requestId), 'Approved');
      await fetchLeaveRequests(); // Refresh the list
    } catch (err: any) {
      console.error('Error approving leave request:', err);
      alert('Failed to approve leave request: ' + err.message);
    }
  };

  // Handle leave request rejection
  const handleRejectLeave = async (requestId: string) => {
    try {
      const remarks = prompt('Please provide a reason for rejection:');
      if (remarks) {
        await LeaveService.rejectLeaveRequest(parseInt(requestId), remarks);
        await fetchLeaveRequests(); // Refresh the list
      }
    } catch (err: any) {
      console.error('Error rejecting leave request:', err);
      alert('Failed to reject leave request: ' + err.message);
    }
  };

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

  const renderHome = () => {
    if (loading) return <div className="loading-message">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!teacher) return <div className="error-message">No teacher data available</div>;

    return (
      <div className="home-section">
        <div className="teacher-profile" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '2.5rem',
          color: 'white',
          boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
          marginBottom: '2rem'
        }}>
          <div className="profile-header" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            marginBottom: '2rem',
            paddingBottom: '2rem',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div className="profile-photo" style={{
              fontSize: '5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '120px',
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
            }}>
              {teacher.profilePhoto}
            </div>
            <div className="profile-info" style={{ flex: 1 }}>
              <h2 style={{ 
                margin: '0 0 1.5rem 0', 
                fontSize: '2.5rem', 
                fontWeight: '700',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                lineHeight: '1.2'
              }}>
                {teacher.name}
              </h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0' }}>
                <span style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {teacher.designation}
                </span>
                {teacher.qualification && teacher.qualification !== 'N/A' && (
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.25)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    📚 {teacher.qualification}
                  </span>
                )}
                <span style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  🏫 {teacher.currentSchool}
                </span>
              </div>
            </div>
          </div>
          
          <div className="personal-info-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}>
            <div className="info-item" style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '1.25rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}>
              <label style={{ 
                fontSize: '0.85rem', 
                opacity: 0.7, 
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '400',
                letterSpacing: '0.5px',
                color: 'white'
              }}>📧 EMAIL</label>
              <span style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                wordBreak: 'break-word',
              }}>{teacher.email}</span>
            </div>
            
            <div className="info-item" style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '1.25rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}>
              <label style={{ 
                fontSize: '0.85rem', 
                opacity: 0.7, 
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '400',
                letterSpacing: '0.5px',
                color: 'white'
              }}>📱 MOBILE NUMBER</label>
              <span style={{ fontSize: '1rem', fontWeight: '600' }}>{teacher.mobileNumber}</span>
            </div>
            
            {teacher.personalInfo.address && teacher.personalInfo.address !== 'N/A' && (
              <div className="info-item" style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '1.25rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s, background 0.2s'
              }}>
                <label style={{ 
                  fontSize: '0.85rem', 
                  opacity: 0.7, 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '400',
                  letterSpacing: '0.5px',
                  color: 'white'
                }}>🏠 ADDRESS</label>
                <span style={{ fontSize: '1rem', fontWeight: '600' }}>{teacher.personalInfo.address}</span>
              </div>
            )}
            
            <div className="info-item" style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '1.25rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'transform 0.2s, background 0.2s'
            }}>
              <label style={{ 
                fontSize: '0.85rem', 
                opacity: 0.7, 
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '400',
                letterSpacing: '0.5px',
                color: 'white'
              }}>🚨 EMERGENCY CONTACT</label>
              <span style={{ fontSize: '1rem', fontWeight: '600' }}>{teacher.personalInfo.emergencyContact}</span>
            </div>
            
            {teacher.personalInfo.bloodGroup && teacher.personalInfo.bloodGroup !== 'N/A' && (
              <div className="info-item" style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '1.25rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s, background 0.2s'
              }}>
                <label style={{ 
                  fontSize: '0.85rem', 
                  opacity: 0.7, 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '400',
                  letterSpacing: '0.5px'
                }}>🩸 BLOOD GROUP</label>
                <span style={{ fontSize: '1rem', fontWeight: '600' }}>{teacher.personalInfo.bloodGroup}</span>
              </div>
            )}
            
            {teacher.personalInfo.dateOfBirth && teacher.personalInfo.dateOfBirth !== 'N/A' && (
              <div className="info-item" style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '1.25rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s, background 0.2s'
              }}>
                <label style={{ 
                  fontSize: '0.85rem', 
                  opacity: 0.7, 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '400',
                  letterSpacing: '0.5px'
                }}>🎂 DATE OF BIRTH</label>
                <span style={{ fontSize: '1rem', fontWeight: '600' }}>{teacher.personalInfo.dateOfBirth}</span>
              </div>
            )}
            
            {teacher.personalInfo.joiningDate && teacher.personalInfo.joiningDate !== 'N/A' && (
              <div className="info-item" style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '1.25rem',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'transform 0.2s, background 0.2s'
              }}>
                <label style={{ 
                  fontSize: '0.85rem', 
                  opacity: 0.7, 
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '400',
                  letterSpacing: '0.5px',
                  color: 'white'
                }}>📅 JOINING DATE</label>
                <span style={{ fontSize: '1rem', fontWeight: '600' }}>{teacher.personalInfo.joiningDate}</span>
              </div>
            )}
          </div>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>Total Classes</h3>
              <p className="stat-number">{assignedClasses.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Total Students</h3>
              <p className="stat-number">
                {Object.values(studentCounts).reduce((sum: number, count: number) => sum + count, 0)}
              </p>
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
              <p className="stat-number">{leaveRequests.filter(l => l.status === 'pending').length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssignedClasses = () => {
    if (loading) return <div className="loading-message">Loading...</div>;
    
    return (
      <div className="assigned-classes-section">
        <h3>Assigned Classes</h3>
        {assignedClasses.length === 0 ? (
          <div className="no-data-message">
            <p>No classes have been assigned to you yet.</p>
            <p>Please contact the administrator to assign classes to your timetable.</p>
          </div>
        ) : (
          <div className="classes-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
            {assignedClasses.map((cls) => (
          <div key={cls.id} className="class-card" style={{
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '1.5rem',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}>
            <div className="class-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f3f4f6'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937', fontWeight: '600' }}>
                  {cls.className}
                </h4>
                <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.25rem' }}>Section {cls.section}</div>
              </div>
              <span className="subject-badge" style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}>{cls.subject}</span>
            </div>
            <div className="class-details" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📅</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Day</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1f2937' }}>
                    {cls.dayOfWeek || 'Not Set'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>🔢</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Period</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1f2937' }}>{cls.periodNumber}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⏰</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Time</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1f2937' }}>{cls.startTime} - {cls.endTime}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>👥</span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Students</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#1f2937' }}>{studentCounts[cls.classId] ?? cls.totalStudents ?? 0}</div>
                </div>
              </div>
            </div>
            <div className="class-actions" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <button 
                className="action-btn"
                style={{
                  padding: '0.6rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                onClick={async () => {
                  console.log('View Students clicked for class:', {
                    timetableId: cls.id,
                    classId: cls.classId,
                    className: cls.className,
                    section: cls.section
                  });
                  
                  if (!cls.classId) {
                    alert('Class ID is missing. Please contact administrator.');
                    return;
                  }
                  
                  await fetchStudentsForClass(cls.classId);
                  setActiveTab('students');
                }}
              >
                👥 View Students
              </button>
              <button 
                className="action-btn"
                style={{
                  padding: '0.6rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                onClick={() => {
                  console.log('Mark Attendance clicked for:', cls);
                  setSelectedClassForAttendance(cls);
                  setShowMarkAttendance(true);
                }}
              >
                ✓ Mark Attendance
              </button>
              <button 
                className="action-btn"
                style={{
                  padding: '0.6rem',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
              >
                🎥 Upload Lecture
              </button>
            </div>
          </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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

  const renderLeaveRequests = () => {
    if (loading) return <div className="loading-message">Loading leave requests...</div>;
    
    return (
      <div className="leave-requests-section">
        <h3>Leave Requests</h3>
        {leaveRequests.length === 0 ? (
          <div className="no-data-message">No leave requests found.</div>
        ) : (
          <div className="leave-requests-list">
            {leaveRequests.map((request) => (
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
                  <button 
                    className="action-btn approve"
                    onClick={() => handleApproveLeave(request.id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleRejectLeave(request.id)}
                  >
                    Reject
                  </button>
                </>
              )}
              <button className="action-btn">View Details</button>
            </div>
          </div>
        ))}
      </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (loading) return <div className="loading-message">Loading student results...</div>;
    
    return (
      <div className="results-section">
        <h3>Student Results</h3>
        <div className="results-header">
          <button className="action-btn upload-btn">+ Upload New Result</button>
        </div>
        {studentResults.length === 0 ? (
          <div className="no-data-message">No student results found.</div>
        ) : (
          <div className="results-list">
            {studentResults.map((result) => (
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
        )}
      </div>
    );
  };

  const renderStudentInfo = () => {
    const handleClassChange = async (classValue: string) => {
      console.log('Class dropdown changed to:', classValue);
      setSelectedClass(classValue);
      
      if (classValue) {
        // Find the selected class
        const selectedClassData = assignedClasses.find(cls => `${cls.className}-${cls.section}` === classValue);
        console.log('Selected class data:', selectedClassData);
        
        if (selectedClassData && selectedClassData.classId) {
          console.log('Fetching students for selected class, classId:', selectedClassData.classId);
          await fetchStudentsForClass(selectedClassData.classId);
        } else {
          console.error('Selected class has no classId:', selectedClassData);
          alert('Unable to load students. Class ID is missing.');
        }
      } else {
        // Clear students if no class selected
        setClassStudents([]);
      }
    };

    return (
      <div className="student-info-section">
        <h3>Student Information</h3>
        {assignedClasses.length === 0 ? (
          <div className="no-data-message">
            <p>No classes assigned yet. Please contact the administrator.</p>
          </div>
        ) : (
          <>
            <div className="class-selector">
              <select 
                value={selectedClass} 
                onChange={(e) => handleClassChange(e.target.value)}
                className="class-select"
              >
                <option value="">Select Class</option>
                {Array.from(new Set(assignedClasses.map(cls => `${cls.className}-${cls.section}`))).map((className: string) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>
            
            {selectedClass && (
          <div className="students-table">
            {loading ? (
              <div className="loading-message">Loading students...</div>
            ) : classStudents.length === 0 ? (
              <div className="no-data-message">No students found for this class.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>PAN Number</th>
                    <th>Name</th>
                    <th>Parent Name</th>
                    <th>Mobile</th>
                    <th>Class</th>
                    <th>Fee Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                        No students found in this class
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((student) => (
                      <tr key={student.id}>
                        <td>{student.rollNumber || 'N/A'}</td>
                        <td>{student.id}</td>
                        <td>{student.name}</td>
                        <td>{student.parentName}</td>
                        <td>{student.mobileNumber}</td>
                        <td>{student.currentClass}-{student.section}</td>
                        <td>
                          <span className={`status-badge ${student.feeStatus}`}>
                            {student.feeStatus.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn" onClick={() => {
                            console.log('View details for student:', student);
                            alert(`Student Details:\n\nName: ${student.name}\nPAN: ${student.id}\nParent: ${student.parentName}\nMobile: ${student.mobileNumber}\nClass: ${student.currentClass}-${student.section}\nRoll No: ${student.rollNumber || 'N/A'}\nFee Status: ${student.feeStatus}`);
                          }}>View Details</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
          </>
        )}
      </div>
    );
  };

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
      
      {/* Mark Attendance Modal */}
      {showMarkAttendance && selectedClassForAttendance && (
        <MarkAttendance
          classId={selectedClassForAttendance.classId}
          className={selectedClassForAttendance.className}
          section={selectedClassForAttendance.section}
          onClose={() => {
            setShowMarkAttendance(false);
            setSelectedClassForAttendance(null);
          }}
        />
      )}
    </div>
  );
};

export default TeacherDashboard; 