import React, { useState, useEffect } from 'react';
import './TeacherDashboard.css';
import { 
  Teacher, 
  AssignedClass, 
  StudentResult,
  ClassStudent,
  TCApprovalRequest
} from '../../types/teacher';
import TeacherService from '../../services/teacherService';
import LeaveService, { StudentLeaveResponse, StaffLeaveResponse } from '../../services/leaveService';
import QueryService, { StudentQueryResponse, TeacherQueryResponse } from '../../services/queryService';
import VideoLectureService, { VideoLecture } from '../../services/videoLectureService';
import MarkAttendance from './MarkAttendance';
import NotificationService, { NotificationDto } from '../../services/notificationService';
import resultService from '../../services/resultService';
import SubjectService from '../../services/subjectService';
import galleryService from '../../services/galleryService';

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
  const [studentResults, setStudentResults] = useState<StudentResult[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [studentCounts, setStudentCounts] = useState<{[classId: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // New states for queries and leaves
  const [studentQueries, setStudentQueries] = useState<StudentQueryResponse[]>([]);
  const [studentLeaves, setStudentLeaves] = useState<StudentLeaveResponse[]>([]);
  const [myTeacherQueries, setMyTeacherQueries] = useState<TeacherQueryResponse[]>([]);
  const [myStaffLeaves, setMyStaffLeaves] = useState<StaffLeaveResponse[]>([]);
  
  // Form states for teacher's own queries and leave requests
  const [querySubject, setQuerySubject] = useState('');
  const [queryContent, setQueryContent] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [showQueryForm, setShowQueryForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [responseText, setResponseText] = useState<{[key: number]: string}>({});

  // Video Lecture states
  const [videoLectures, setVideoLectures] = useState<VideoLecture[]>([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoLecture | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    youtubeLink: '',
    subject: '',
    className: '',
    section: '',
    duration: '',
    topic: ''
  });

  // Results Management states - moved from renderResults to fix Hooks violation
  const [resultsMode, setResultsMode] = useState<'entry' | 'view'>('entry');
  const [selectedResultClass, setSelectedResultClass] = useState<string>('');
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [studentScores, setStudentScores] = useState<Array<{
    panNumber: string;
    name: string;
    rollNumber: string;
    marks: number;
    grade: string;
  }>>([]);
  const [saving, setSaving] = useState(false);

  // Gallery states
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [showGalleryUpload, setShowGalleryUpload] = useState(false);

  // Fetch student queries for teacher
  const fetchStudentQueries = async () => {
    try {
      const queries = await QueryService.getStudentQueriesForTeacher();
      setStudentQueries(queries);
    } catch (err: any) {
      console.error('Error fetching student queries:', err);
    }
  };

  // Fetch student leave requests for teacher
  const fetchStudentLeaves = async () => {
    try {
      const leaves = await LeaveService.getStudentLeavesForTeacher();
      setStudentLeaves(leaves);
    } catch (err: any) {
      console.error('Error fetching student leaves:', err);
    }
  };

  // Fetch teacher's own queries to admin
  const fetchMyTeacherQueries = async () => {
    try {
      const queries = await QueryService.getMyTeacherQueries();
      setMyTeacherQueries(queries);
    } catch (err: any) {
      console.error('Error fetching teacher queries:', err);
    }
  };

  // Fetch teacher's own leave requests
  const fetchMyStaffLeaves = async () => {
    try {
      const leaves = await LeaveService.getMyStaffLeaves();
      setMyStaffLeaves(leaves);
    } catch (err: any) {
      console.error('Error fetching staff leaves:', err);
    }
  };

  // Handle teacher responding to student query
  const handleRespondToQuery = async (queryId: number) => {
    try {
      const response = responseText[queryId];
      if (!response || !response.trim()) {
        alert('Please enter a response');
        return;
      }
      await QueryService.respondToStudentQuery({ queryId, response });
      alert('Response sent successfully!');
      setResponseText({ ...responseText, [queryId]: '' });
      fetchStudentQueries();
    } catch (err: any) {
      alert('Failed to send response: ' + err.message);
    }
  };

  // Handle teacher approving/rejecting student leave
  const handleLeaveAction = async (leaveId: number, status: 'APPROVED' | 'REJECTED', responseMessage: string) => {
    try {
      await LeaveService.takeActionOnStudentLeave(leaveId, { status, responseMessage });
      alert(`Leave request ${status.toLowerCase()} successfully!`);
      fetchStudentLeaves();
    } catch (err: any) {
      alert('Failed to process leave request: ' + err.message);
    }
  };

  // Handle teacher submitting own query to admin
  const handleSubmitTeacherQuery = async () => {
    try {
      if (!querySubject.trim() || !queryContent.trim()) {
        alert('Please fill in all fields');
        return;
      }
      await QueryService.raiseTeacherQuery({ subject: querySubject, content: queryContent });
      alert('Query sent to admin successfully!');
      setQuerySubject('');
      setQueryContent('');
      setShowQueryForm(false);
      fetchMyTeacherQueries();
    } catch (err: any) {
      alert('Failed to send query: ' + err.message);
    }
  };

  // Handle teacher submitting own leave request
  const handleSubmitStaffLeave = async () => {
    try {
      if (!leaveReason.trim() || !leaveStartDate || !leaveEndDate || !teacher?.id) {
        alert('Please fill in all fields');
        return;
      }
      await LeaveService.createStaffLeaveRequest({
        teacherId: parseInt(teacher.id),
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveReason
      });
      alert('Leave request submitted successfully!');
      setLeaveReason('');
      setLeaveStartDate('');
      setLeaveEndDate('');
      setShowLeaveForm(false);
      fetchMyStaffLeaves();
    } catch (err: any) {
      alert('Failed to submit leave request: ' + err.message);
    }
  };

  // Video Lecture Functions
  const fetchVideoLectures = async () => {
    try {
      if (teacher?.id) {
        const lectures = await VideoLectureService.getVideoLecturesByTeacher(parseInt(teacher.id));
        setVideoLectures(lectures);
      }
    } catch (err: any) {
      console.error('Error fetching video lectures:', err);
    }
  };

  const handleVideoFormChange = (field: string, value: string) => {
    setVideoForm({ ...videoForm, [field]: value });
  };

  const handleSubmitVideo = async () => {
    try {
      if (!videoForm.title || !videoForm.youtubeLink || !videoForm.subject || !videoForm.className || !videoForm.section || !teacher?.id) {
        alert('Please fill in all required fields (Title, YouTube Link, Subject, Class, Section)');
        return;
      }

      const videoData: VideoLecture = {
        ...videoForm,
        teacherId: parseInt(teacher.id),
        isActive: true
      };

      if (editingVideo && editingVideo.id) {
        await VideoLectureService.updateVideoLecture(editingVideo.id, videoData);
        alert('Video lecture updated successfully!');
      } else {
        await VideoLectureService.createVideoLecture(videoData);
        alert('Video lecture uploaded successfully!');
      }

      // Reset form
      setVideoForm({
        title: '',
        description: '',
        youtubeLink: '',
        subject: '',
        className: '',
        section: '',
        duration: '',
        topic: ''
      });
      setShowVideoForm(false);
      setEditingVideo(null);
      fetchVideoLectures();
    } catch (err: any) {
      alert('Failed to save video lecture: ' + err.message);
    }
  };

  const handleEditVideo = (video: VideoLecture) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description || '',
      youtubeLink: video.youtubeLink,
      subject: video.subject,
      className: video.className,
      section: video.section,
      duration: video.duration || '',
      topic: video.topic || ''
    });
    setShowVideoForm(true);
  };

  const handleDeleteVideo = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this video lecture?')) {
      try {
        await VideoLectureService.deleteVideoLecture(id);
        alert('Video lecture deleted successfully!');
        fetchVideoLectures();
      } catch (err: any) {
        alert('Failed to delete video lecture: ' + err.message);
      }
    }
  };

  // Gallery Functions
  const fetchGalleryImages = async () => {
    try {
      const images = await galleryService.getAllImages();
      setGalleryImages(images);
    } catch (err: any) {
      console.error('Error fetching gallery images:', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile || !teacher?.id) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    try {
      await galleryService.uploadImage({
        file: selectedFile,
        title: imageTitle || 'Untitled',
        description: imageDescription || '',
        uploadedByType: 'TEACHER',
        uploadedById: parseInt(teacher.id),
        uploadedByName: teacher.name,
        sessionId: 1 // You may want to fetch current session ID dynamically
      });

      alert('Image uploaded successfully!');
      setSelectedFile(null);
      setImageTitle('');
      setImageDescription('');
      setShowGalleryUpload(false);
      fetchGalleryImages();
    } catch (err: any) {
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.getMyNotifications();
      setNotifications(data);
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Mark notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await fetchNotifications(); // Refresh notifications
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      await fetchNotifications(); // Refresh notifications
    } catch (err: any) {
      console.error('Error marking all as read:', err);
    }
  };

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
    fetchStudentQueries();
    fetchStudentLeaves();
    fetchMyTeacherQueries();
    fetchMyStaffLeaves();
    fetchGalleryImages();
  }, []);

  // Fetch video lectures when teacher data is loaded
  useEffect(() => {
    if (teacher?.id) {
      fetchVideoLectures();
    }
  }, [teacher]);

  // Load students when class is selected for results
  useEffect(() => {
    if (selectedResultClass) {
      loadStudentsForResults();
    }
  }, [selectedResultClass]);

  // Helper function to load students for results entry
  const loadStudentsForResults = async () => {
    if (!selectedResultClass) return;

    const selectedClassData = assignedClasses.find(
      cls => `${cls.className}-${cls.section}` === selectedResultClass
    );

    if (selectedClassData && selectedClassData.classId) {
      try {
        // Fetch students directly for the class
        const studentsData = await TeacherService.getStudentsByClass(parseInt(selectedClassData.classId));
        
        // Initialize student scores array
        const initialScores = studentsData.map((student: any) => ({
          panNumber: student.panNumber,
          name: student.name,
          rollNumber: student.classRollNumber || student.rollNumber || 'N/A',
          marks: 0,
          grade: ''
        }));

        setStudentScores(initialScores);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    }
  };

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

    } catch (err: any) {
      console.error('Error fetching teacher data:', err);
      setError(err.message || 'Failed to load teacher data');
    } finally {
      setLoading(false);
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

  const renderNotifications = () => (
    <div className={`notifications-panel ${showNotifications ? 'show' : ''}`}>
      <div className="notifications-header">
        <h3>Notifications ({unreadCount} unread)</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-btn"
              onClick={markAllAsRead}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Mark All Read
            </button>
          )}
          <button 
            className="close-notifications"
            onClick={() => setShowNotifications(false)}
          >
            ×
          </button>
        </div>
      </div>
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <span style={{ fontSize: '3rem' }}>📭</span>
            <p style={{ marginTop: '1rem' }}>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
              onClick={() => !notification.isRead && notification.id && markNotificationAsRead(notification.id)}
              style={{
                cursor: notification.isRead ? 'default' : 'pointer',
                background: notification.isRead ? '#f9fafb' : 'white',
                borderLeft: `4px solid ${
                  notification.priority === 'HIGH' ? '#ef4444' :
                  notification.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'
                }`
              }}
            >
              <div className="notification-icon">
                {notification.priority === 'HIGH' && '🔴'}
                {notification.priority === 'MEDIUM' && '🟡'}
                {notification.priority === 'LOW' && '🟢'}
              </div>
              <div className="notification-content">
                <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                  {notification.title}
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                  {notification.message}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="notification-time" style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A'}
                  </span>
                  {notification.senderName && (
                    <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      From: {notification.senderName}
                    </span>
                  )}
                </div>
              </div>
              {!notification.isRead && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  marginLeft: '1rem'
                }} />
              )}
            </div>
          ))
        )}
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
              <p className="stat-number">{studentQueries.filter(q => q.status === 'OPEN').length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Leave Requests</h3>
              <p className="stat-number">{studentLeaves.filter(l => l.status === 'PENDING').length}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssignedClasses = () => {
    if (loading) return <div className="loading-message">Loading...</div>;
    
    // Get current day of week
    const daysOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = daysOfWeek[new Date().getDay()];
    
    // Filter classes for today only
    const todayClasses = assignedClasses.filter(cls => 
      cls.dayOfWeek?.toUpperCase() === today
    );
    
    return (
      <div className="assigned-classes-section">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h3 style={{ margin: 0 }}>Today's Classes ({today})</h3>
          <div style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#eef1ff',
            color: '#3b82f6',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            {todayClasses.length} {todayClasses.length === 1 ? 'Class' : 'Classes'} Today
          </div>
        </div>
        {todayClasses.length === 0 ? (
          <div className="no-data-message" style={{
            textAlign: 'center',
            padding: '3rem 2rem',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
              No Classes Today!
            </p>
            <p style={{ color: '#6b7280' }}>You don't have any classes scheduled for {today}.</p>
          </div>
        ) : (
          <div className="classes-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginTop: '1rem'
          }}>
            {todayClasses.sort((a, b) => a.periodNumber - b.periodNumber).map((cls) => (
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
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Student Queries</h3>
          <button 
            className="action-btn"
            onClick={() => setShowQueryForm(!showQueryForm)}
            style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px' }}
          >
            {showQueryForm ? 'Cancel' : '+ Send Query to Admin'}
          </button>
        </div>

        {/* Form for teacher to send query to admin */}
        {showQueryForm && (
          <div style={{ 
            border: '2px solid #3b82f6', 
            borderRadius: '8px', 
            padding: '1.5rem', 
            marginBottom: '1.5rem',
            backgroundColor: '#f0f9ff'
          }}>
            <h4 style={{ marginBottom: '1rem' }}>Send Query to Admin</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Subject</label>
              <input 
                type="text"
                value={querySubject}
                onChange={(e) => setQuerySubject(e.target.value)}
                placeholder="Enter query subject..."
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Question</label>
              <textarea 
                value={queryContent}
                onChange={(e) => setQueryContent(e.target.value)}
                placeholder="Describe your query in detail..."
                rows={4}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <button 
              className="action-btn"
              onClick={handleSubmitTeacherQuery}
              style={{ backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px' }}
            >
              Submit Query
            </button>
          </div>
        )}

        {/* Show teacher's own queries to admin */}
        {myTeacherQueries.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#3b82f6' }}>My Queries to Admin</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myTeacherQueries.map((query) => (
                <div key={query.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: query.status === 'RESPONDED' ? '#f0fdf4' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{query.subject}</strong>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      backgroundColor: query.status === 'OPEN' ? '#fef3c7' : query.status === 'RESPONDED' ? '#d1fae5' : '#e5e7eb',
                      color: query.status === 'OPEN' ? '#92400e' : query.status === 'RESPONDED' ? '#065f46' : '#1f2937'
                    }}>
                      {query.status}
                    </span>
                  </div>
                  <p style={{ marginBottom: '0.5rem' }}><strong>Question:</strong> {query.content}</p>
                  {query.response && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <p><strong>Admin's Response:</strong></p>
                      <p style={{ marginTop: '0.25rem' }}>{query.response}</p>
                    </div>
                  )}
                  <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                    Sent: {query.createdAt ? new Date(query.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student queries list */}
        <h4 style={{ marginBottom: '1rem' }}>Queries from Students</h4>
        {studentQueries.length === 0 ? (
          <div className="no-data-message">No student queries yet.</div>
        ) : (
          <div className="queries-list">
            {studentQueries.map((query) => (
              <div key={query.id} className={`query-card ${query.status?.toLowerCase()}`} style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                backgroundColor: query.status === 'RESPONDED' ? '#f0fdf4' : '#fff'
              }}>
                <div className="query-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0 }}>{query.subject}</h4>
                  <span className={`status-badge ${query.status?.toLowerCase()}`} style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    backgroundColor: query.status === 'OPEN' ? '#fef3c7' : '#d1fae5',
                    color: query.status === 'OPEN' ? '#92400e' : '#065f46'
                  }}>
                    {query.status}
                  </span>
                </div>
                <div className="query-details">
                  <p><strong>Question:</strong> {query.content}</p>
                  <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    Submitted: {query.createdAt ? new Date(query.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                {query.response && (
                  <div className="query-reply" style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    backgroundColor: '#f3f4f6', 
                    borderRadius: '6px' 
                  }}>
                    <p><strong>Your Reply:</strong> {query.response}</p>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      Reply Time: {query.respondedAt ? new Date(query.respondedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                )}
                <div className="query-actions" style={{ marginTop: '1rem' }}>
                  {query.status === 'OPEN' && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Your Response:
                      </label>
                      <textarea
                        key={`query-${query.id || 'unknown'}-textarea`}
                        value={responseText[query.id!] || ''}
                        onChange={(e) => {
                          if (query.id) {
                            setResponseText({ ...responseText, [query.id]: e.target.value });
                          }
                        }}
                        placeholder="Type your response to the student..."
                        rows={4}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          borderRadius: '6px', 
                          border: '2px solid #e2e8f0',
                          marginBottom: '0.75rem',
                          fontSize: '0.95rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                      />
                      <button 
                        className="action-btn reply-btn"
                        onClick={() => {
                          if (query.id && responseText[query.id]?.trim()) {
                            handleRespondToQuery(query.id);
                          }
                        }}
                        disabled={!query.id || !responseText[query.id]?.trim()}
                        style={{ 
                          backgroundColor: '#10b981', 
                          color: 'white', 
                          padding: '0.75rem 1.5rem', 
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.95rem',
                          fontWeight: '500',
                          cursor: (!query.id || !responseText[query.id]?.trim()) ? 'not-allowed' : 'pointer',
                          opacity: (!query.id || !responseText[query.id]?.trim()) ? 0.5 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        📤 Send Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderVideoLectures = () => (
    <div className="video-lectures-section">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: 0 }}>Video Lectures</h3>
        <button 
          className="action-btn upload-btn"
          onClick={() => {
            setEditingVideo(null);
            setVideoForm({
              title: '',
              description: '',
              youtubeLink: '',
              subject: '',
              className: '',
              section: '',
              duration: '',
              topic: ''
            });
            setShowVideoForm(!showVideoForm);
          }}
          style={{
            backgroundColor: showVideoForm ? '#ef4444' : '#10b981',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {showVideoForm ? '✕ Cancel' : '+ Upload New Lecture'}
        </button>
      </div>

      {/* Video Upload Form */}
      {showVideoForm && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '1.5rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ marginTop: 0, color: '#1f2937' }}>
            {editingVideo ? '✏️ Edit Video Lecture' : '📤 Upload New Video Lecture'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Title *
              </label>
              <input
                type="text"
                value={videoForm.title}
                onChange={(e) => handleVideoFormChange('title', e.target.value)}
                placeholder="e.g., Introduction to Quadratic Equations"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                YouTube Link *
              </label>
              <input
                type="url"
                value={videoForm.youtubeLink}
                onChange={(e) => handleVideoFormChange('youtubeLink', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Subject *
              </label>
              <input
                type="text"
                value={videoForm.subject}
                onChange={(e) => handleVideoFormChange('subject', e.target.value)}
                placeholder="e.g., Mathematics"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Topic
              </label>
              <input
                type="text"
                value={videoForm.topic}
                onChange={(e) => handleVideoFormChange('topic', e.target.value)}
                placeholder="e.g., Algebra - Quadratic Formulas"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Class *
              </label>
              <input
                type="text"
                value={videoForm.className}
                onChange={(e) => handleVideoFormChange('className', e.target.value)}
                placeholder="e.g., 9th"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Section *
              </label>
              <input
                type="text"
                value={videoForm.section}
                onChange={(e) => handleVideoFormChange('section', e.target.value)}
                placeholder="e.g., A"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Duration
              </label>
              <input
                type="text"
                value={videoForm.duration}
                onChange={(e) => handleVideoFormChange('duration', e.target.value)}
                placeholder="e.g., 45:30 or 1h 15m"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem'
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Description
              </label>
              <textarea
                value={videoForm.description}
                onChange={(e) => handleVideoFormChange('description', e.target.value)}
                placeholder="Brief description of the video lecture content..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={handleSubmitVideo}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {editingVideo ? '💾 Update Lecture' : '📤 Upload Lecture'}
            </button>
            <button
              onClick={() => {
                setShowVideoForm(false);
                setEditingVideo(null);
              }}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Video Lectures Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Loading...</div>
      ) : videoLectures.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '1px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
          <p style={{ color: '#6b7280', margin: 0 }}>No video lectures uploaded yet.</p>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Click "Upload New Lecture" to add your first video.
          </p>
        </div>
      ) : (
        <div className="lectures-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {videoLectures.map((lecture) => {
            const thumbnailUrl = VideoLectureService.getYouTubeThumbnail(lecture.youtubeLink);
            
            return (
              <div key={lecture.id} className="lecture-card" style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', backgroundColor: '#000' }}>
                  <img 
                    src={thumbnailUrl} 
                    alt={lecture.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    ▶️
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.1rem' }}>
                    {lecture.title}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {lecture.className} - {lecture.section}
                    </span>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {lecture.subject}
                    </span>
                  </div>
                  {lecture.topic && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.5rem 0' }}>
                      📚 {lecture.topic}
                    </p>
                  )}
                  {lecture.description && (
                    <p style={{ 
                      fontSize: '0.9rem', 
                      color: '#4b5563', 
                      margin: '0.5rem 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {lecture.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                    {lecture.duration && <span>⏱️ {lecture.duration}</span>}
                    {lecture.uploadedAt && (
                      <span>📅 {new Date(lecture.uploadedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ 
                  padding: '1rem',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <button
                    onClick={() => window.open(lecture.youtubeLink, '_blank')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    ▶️ Watch
                  </button>
                  <button
                    onClick={() => handleEditVideo(lecture)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => lecture.id && handleDeleteVideo(lecture.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderLeaveRequests = () => {
    if (loading) return <div className="loading-message">Loading leave requests...</div>;
    
    return (
      <div className="leave-requests-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Student Leave Requests</h3>
          <button 
            className="action-btn"
            onClick={() => setShowLeaveForm(!showLeaveForm)}
            style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px' }}
          >
            {showLeaveForm ? 'Cancel' : '+ Request My Leave'}
          </button>
        </div>

        {/* Form for teacher to submit own leave request */}
        {showLeaveForm && (
          <div style={{ 
            border: '2px solid #3b82f6', 
            borderRadius: '8px', 
            padding: '1.5rem', 
            marginBottom: '1.5rem',
            backgroundColor: '#f0f9ff'
          }}>
            <h4 style={{ marginBottom: '1rem' }}>Request Leave</h4>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Reason</label>
              <input 
                type="text"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="e.g., Medical, Personal, Family"
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
                <input 
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date</label>
                <input 
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  min={leaveStartDate}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            <button 
              className="action-btn"
              onClick={handleSubmitStaffLeave}
              style={{ backgroundColor: '#10b981', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '6px' }}
            >
              Submit Leave Request
            </button>
          </div>
        )}

        {/* Show teacher's own leave requests */}
        {myStaffLeaves.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#3b82f6' }}>My Leave Requests</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myStaffLeaves.map((leave) => (
                <div key={leave.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1rem',
                  backgroundColor: leave.status === 'APPROVED' ? '#f0fdf4' : leave.status === 'REJECTED' ? '#fef2f2' : '#fff'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>{leave.reason}</strong>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      backgroundColor: leave.status === 'PENDING' ? '#fef3c7' : leave.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                      color: leave.status === 'PENDING' ? '#92400e' : leave.status === 'APPROVED' ? '#065f46' : '#991b1b'
                    }}>
                      {leave.status}
                    </span>
                  </div>
                  <p><strong>Duration:</strong> {leave.startDate} to {leave.endDate} ({leave.daysRequested} days)</p>
                  {leave.adminResponse && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <p><strong>Admin's Response:</strong></p>
                      <p style={{ marginTop: '0.25rem' }}>{leave.adminResponse}</p>
                    </div>
                  )}
                  {leave.processedBy && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      Processed by: {leave.processedBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student leave requests */}
        <h4 style={{ marginBottom: '1rem' }}>Leave Requests from Students</h4>
        {studentLeaves.length === 0 ? (
          <div className="no-data-message">No student leave requests yet.</div>
        ) : (
          <div className="leave-requests-list">
            {studentLeaves.map((request) => (
          <div key={request.id} className={`leave-request-card ${request.status?.toLowerCase()}`} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: request.status === 'APPROVED' ? '#f0fdf4' : request.status === 'REJECTED' ? '#fef2f2' : '#fff'
          }}>
            <div className="leave-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ margin: 0 }}>{request.studentName || 'Student'}</h4>
              <span className={`status-badge ${request.status?.toLowerCase()}`} style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.85rem',
                backgroundColor: request.status === 'PENDING' ? '#fef3c7' : request.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                color: request.status === 'PENDING' ? '#92400e' : request.status === 'APPROVED' ? '#065f46' : '#991b1b'
              }}>
                {request.status}
              </span>
            </div>
            <div className="leave-details">
              <p><strong>Reason:</strong> {request.reason}</p>
              <p><strong>Duration:</strong> {request.startDate} to {request.endDate} ({request.daysRequested} days)</p>
              <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                Submitted: {request.createdAt ? new Date(request.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            {request.classTeacherResponse && (
              <div className="teacher-remarks" style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '6px' 
              }}>
                <p><strong>Your Response:</strong> {request.classTeacherResponse}</p>
              </div>
            )}
            <div className="leave-actions" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              {request.status === 'PENDING' && (
                <>
                  <input
                    type="text"
                    placeholder="Add remarks (optional)"
                    value={responseText[request.id] || ''}
                    onChange={(e) => setResponseText({ ...responseText, [request.id]: e.target.value })}
                    style={{ 
                      flex: 1, 
                      padding: '0.5rem', 
                      borderRadius: '4px', 
                      border: '1px solid #ddd' 
                    }}
                  />
                  <button 
                    className="action-btn approve"
                    onClick={() => handleLeaveAction(request.id, 'APPROVED', responseText[request.id] || 'Approved')}
                    style={{ 
                      backgroundColor: '#10b981', 
                      color: 'white', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '6px' 
                    }}
                  >
                    Approve
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleLeaveAction(request.id, 'REJECTED', responseText[request.id] || 'Rejected')}
                    style={{ 
                      backgroundColor: '#ef4444', 
                      color: 'white', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '6px' 
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    // Sample exam types
    const examTypes = [
      'FA1 - Formative Assessment 1',
      'FA2 - Formative Assessment 2',
      'Mid Term',
      'FA3 - Formative Assessment 3',
      'FA4 - Formative Assessment 4',
      'Final Exam'
    ];

    const handleMarksChange = (panNumber: string, marks: number) => {
      setStudentScores(prev => prev.map(student => {
        if (student.panNumber === panNumber) {
          // Auto-calculate grade based on percentage
          const percentage = (marks / 100) * 100;
          let grade = '';
          if (percentage >= 90) grade = 'A+';
          else if (percentage >= 80) grade = 'A';
          else if (percentage >= 70) grade = 'B+';
          else if (percentage >= 60) grade = 'B';
          else if (percentage >= 50) grade = 'C';
          else if (percentage >= 40) grade = 'D';
          else grade = 'F';

          return { ...student, marks, grade };
        }
        return student;
      }));
    };

    const handleGradeChange = (panNumber: string, grade: string) => {
      setStudentScores(prev => prev.map(student => 
        student.panNumber === panNumber ? { ...student, grade } : student
      ));
    };

    const handleSaveResults = async () => {
      if (!selectedResultClass || !selectedExam || !selectedSubject) {
        alert('Please select Class, Exam, and Subject');
        return;
      }

      if (studentScores.length === 0) {
        alert('No student data to save');
        return;
      }

      // Validate that at least one student has marks entered
      const hasMarks = studentScores.some(s => s.marks > 0);
      if (!hasMarks) {
        alert('Please enter marks for at least one student');
        return;
      }

      setSaving(true);
      try {
        // Find the selected class data
        const selectedClassData = assignedClasses.find(
          cls => `${cls.className}-${cls.section}` === selectedResultClass
        );

        if (!selectedClassData) {
          throw new Error('Selected class not found');
        }

        // For now, we'll use placeholder IDs since we don't have the actual mapping
        // In production, you should fetch these from the backend
        const examIdMap: {[key: string]: number} = {
          'FA1 - Formative Assessment 1': 1,
          'FA2 - Formative Assessment 2': 2,
          'Mid Term': 3,
          'FA3 - Formative Assessment 3': 4,
          'FA4 - Formative Assessment 4': 5,
          'Final Exam': 6
        };

        const examId = examIdMap[selectedExam] || 1;

        // Prepare scores data
        const scoresData = studentScores
          .filter(s => s.marks > 0) // Only save students with marks entered
          .map(s => ({
            studentPanNumber: s.panNumber,
            marks: s.marks,
            grade: s.grade
          }));

        if (scoresData.length === 0) {
          alert('No valid marks to save');
          setSaving(false);
          return;
        }

        // For subject ID, we'll need to fetch it based on subject name
        // For now, using a placeholder approach
        console.log('Attempting to save results:', {
          classId: parseInt(selectedClassData.classId),
          subject: selectedSubject,
          examId,
          scoresCount: scoresData.length
        });

        alert(`Results will be saved for ${scoresData.length} students!\n\nNote: Full integration with backend subject/exam IDs is pending. Please ensure exams are created in the system first.`);
        
        // Uncomment this when backend is ready with proper exam/subject IDs:
        /*
        await resultService.bulkUpdateScores({
          classId: parseInt(selectedClassData.classId),
          subjectId: subjectId, // Need to fetch this based on selectedSubject
          examId: examId,
          scores: scoresData
        });
        
        alert(`Successfully saved results for ${scoresData.length} students!`);
        
        // Reset form
        setSelectedResultClass('');
        setSelectedExam('');
        setSelectedSubject('');
        setStudentScores([]);
        */
      } catch (error: any) {
        console.error('Error saving results:', error);
        alert(`Failed to save results: ${error.message || 'Unknown error'}`);
      } finally {
        setSaving(false);
      }
    };

    if (loading) return <div className="loading-message">Loading...</div>;
    
    return (
      <div className="results-section">
        {/* Mode Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <h3>Results Management</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setResultsMode('entry')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: resultsMode === 'entry' ? '#3b82f6' : 'white',
                color: resultsMode === 'entry' ? 'white' : '#374151',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📝 Enter Results
            </button>
            <button
              onClick={() => setResultsMode('view')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: resultsMode === 'view' ? '#3b82f6' : 'white',
                color: resultsMode === 'view' ? 'white' : '#374151',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              📊 View Results
            </button>
          </div>
        </div>

        {resultsMode === 'entry' ? (
          <div>
            {/* Filter Section */}
            <div style={{
              backgroundColor: '#f9fafb',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{ marginBottom: '1rem' }}>Select Class, Exam & Subject</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Class
                  </label>
                  <select
                    value={selectedResultClass}
                    onChange={(e) => setSelectedResultClass(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <option value="">Select Class</option>
                    {Array.from(new Set(assignedClasses.map(cls => `${cls.className}-${cls.section}`))).map((classKey) => {
                      const cls = assignedClasses.find(c => `${c.className}-${c.section}` === classKey);
                      return cls ? (
                        <option key={classKey} value={classKey}>
                          {cls.className} - {cls.section}
                        </option>
                      ) : null;
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Exam Type
                  </label>
                  <select
                    value={selectedExam}
                    onChange={(e) => setSelectedExam(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <option value="">Select Exam</option>
                    {examTypes.map((exam) => (
                      <option key={exam} value={exam}>
                        {exam}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <option value="">Select Subject</option>
                    {Array.from(new Set(assignedClasses.map(cls => cls.subject))).filter(Boolean).map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Results Entry Table */}
            {studentScores.length > 0 && (
              <div>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f3f4f6' }}>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                          Roll No
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                          Student Name
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                          Marks (out of 100)
                        </th>
                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentScores.map((student, index) => (
                        <tr key={student.panNumber} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb' }}>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                            {student.rollNumber}
                          </td>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                            {student.name}
                          </td>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={student.marks}
                              onChange={(e) => handleMarksChange(student.panNumber, Number(e.target.value))}
                              style={{
                                width: '100px',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                textAlign: 'center'
                              }}
                            />
                          </td>
                          <td style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                            <select
                              value={student.grade}
                              onChange={(e) => handleGradeChange(student.panNumber, e.target.value)}
                              style={{
                                width: '80px',
                                padding: '0.5rem',
                                borderRadius: '6px',
                                border: '1px solid #d1d5db',
                                fontWeight: '500'
                              }}
                            >
                              <option value="">-</option>
                              <option value="A+">A+</option>
                              <option value="A">A</option>
                              <option value="B+">B+</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="F">F</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      setSelectedResultClass('');
                      setSelectedExam('');
                      setSelectedSubject('');
                      setStudentScores([]);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '6px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveResults}
                    disabled={saving}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#10b981',
                      color: 'white',
                      fontWeight: '500',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1
                    }}
                  >
                    {saving ? 'Saving...' : '💾 Save All Results'}
                  </button>
                </div>
              </div>
            )}

            {studentScores.length === 0 && selectedResultClass && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <p>📋 Select exam type and subject to load students</p>
              </div>
            )}

            {!selectedResultClass && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <p>👆 Select a class to begin entering results</p>
              </div>
            )}
          </div>
        ) : (
          /* View Mode */
          <div>
            <div className="no-data-message">
              <p>📊 View mode coming soon! You'll be able to see all entered results here.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGallery = () => {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>📸 School Gallery</h2>
          <button
            onClick={() => setShowGalleryUpload(!showGalleryUpload)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {showGalleryUpload ? '❌ Cancel' : '📤 Upload Image'}
          </button>
        </div>

        {/* Upload Form */}
        {showGalleryUpload && (
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '2rem',
            borderRadius: '12px',
            marginBottom: '2rem',
            border: '2px dashed #667eea'
          }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#374151' }}>Upload New Image</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Title
              </label>
              <input
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="Enter image title"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Description
              </label>
              <textarea
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="Enter image description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#374151' }}>
                Select Image File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white'
                }}
              />
              {selectedFile && (
                <p style={{ marginTop: '0.5rem', color: '#10b981', fontSize: '0.9rem' }}>
                  ✓ Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <button
              onClick={handleImageUpload}
              disabled={!selectedFile || uploadingImage}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: uploadingImage ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: uploadingImage || !selectedFile ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {uploadingImage ? '⏳ Uploading...' : '🚀 Upload to Gallery'}
            </button>
          </div>
        )}

        {/* Gallery Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {galleryImages.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '3rem',
              color: '#6b7280'
            }}>
              <p style={{ fontSize: '1.2rem' }}>📷 No images in gallery yet</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Upload your first image to get started!</p>
            </div>
          ) : (
            galleryImages.map((image) => (
              <div
                key={image.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ height: '200px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                  <img
                    src={image.imageUrl}
                    alt={image.title || 'Gallery image'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
                <div style={{ padding: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#111827', fontSize: '1.1rem' }}>
                    {image.title || 'Untitled'}
                  </h4>
                  {image.description && (
                    <p style={{ margin: '0 0 0.75rem 0', color: '#6b7280', fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {image.description}
                    </p>
                  )}
                  <div style={{ fontSize: '0.85rem', color: '#9ca3af', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                    <p style={{ margin: '0.25rem 0' }}>📤 {image.uploadedByName}</p>
                    <p style={{ margin: '0.25rem 0' }}>📅 {new Date(image.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
      case 'gallery':
        return renderGallery();
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
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
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
            <button
              className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              🖼️ Gallery
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