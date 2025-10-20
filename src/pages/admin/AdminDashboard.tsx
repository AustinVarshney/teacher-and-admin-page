import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import StudentDetailView from './StudentDetailView';
import UnifiedRegistration from './UnifiedRegistration';
import SessionManagement from './SessionManagement';
import ClassManagement from './ClassManagement';
import EventManagement from './EventManagement';
import SubjectManagement from './SubjectManagement';
import FeeManagement from './FeeManagement';
import TimetableManagement from './TimetableManagement';
import HolidayManagement from './HolidayManagement';
import MarksUpload from './MarksUpload';
import ExamManagement from './ExamManagement';
import GalleryManagement from './GalleryManagement';
import { FeeService } from '../../services/feeService';
import AdminService, { StudentResponse, TeacherResponse, NonTeachingStaffResponse, ClassInfoResponse } from '../../services/adminService';
import StudentService from '../../services/studentService';
import TransferCertificateService from '../../services/transferCertificateService';
import NotificationService, { BroadcastMessageDto } from '../../services/notificationService';
import LeaveService, { StaffLeaveResponse } from '../../services/leaveService';
import QueryService, { TeacherQueryResponse } from '../../services/queryService';
import { SessionService } from '../../services/sessionService';
import { 
  Student, 
  Message,
  ClassData,
  FeeCatalog
} from '../../types/admin';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState(() => {
    // Restore last active tab from localStorage
    const savedTab = localStorage.getItem('adminActiveTab');
    return savedTab || 'overview';
  });
  const [feeManagementKey, setFeeManagementKey] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  
  // State for real data from database
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [nonTeachingStaff, setNonTeachingStaff] = useState<NonTeachingStaffResponse[]>([]);
  const [classes, setClasses] = useState<ClassInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Filter state for staff (active, inactive, all)
  const [staffFilter, setStaffFilter] = useState<'active' | 'inactive' | 'all'>('active');
  
  // Filter state for students (all, active, inactive, graduated)
  const [studentFilter, setStudentFilter] = useState<'all' | 'active' | 'inactive' | 'graduated'>('all');
  
  // Search terms for different sections
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [classSearchTerm, setClassSearchTerm] = useState('');

  // Transfer Certificate state (moved to top level to fix hooks order)
  const [tcRequests, setTcRequests] = useState<any[]>([]);
  const [tcLoading, setTcLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [processing, setProcessing] = useState(false);

  // Broadcast/Inbox state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [selectedRecipientType, setSelectedRecipientType] = useState<'STUDENT' | 'TEACHER' | 'BOTH'>('STUDENT');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [selectAllStudents, setSelectAllStudents] = useState(false);
  const [selectAllTeachers, setSelectAllTeachers] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [broadcastError, setBroadcastError] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');

  // Teacher Query and Leave Management state
  const [teacherQueries, setTeacherQueries] = useState<TeacherQueryResponse[]>([]);
  const [staffLeaves, setStaffLeaves] = useState<StaffLeaveResponse[]>([]);
  const [queryResponseText, setQueryResponseText] = useState<{[key: number]: string}>({});
  const [leaveResponseText, setLeaveResponseText] = useState<{[key: number]: string}>({});
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);

  // Handle logout properly
  const handleLogout = () => {
    // Clear localStorage items (but NOT userType - App.tsx needs it for redirect)
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminActiveTab');
    // Call parent onLogout which will handle navigation and clear userType
    onLogout();
  };

  // Scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  // Fetch active session
  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const session = await SessionService.getActiveSession();
        if (session && session.id) {
          setActiveSessionId(session.id);
        }
      } catch (err) {
        console.error('Failed to fetch active session:', err);
      }
    };
    fetchActiveSession();
  }, []);

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    // Force FeeManagement to remount when switching to fees tab
    if (activeTab === 'fees') {
      setFeeManagementKey(prev => prev + 1);
    }
  }, [activeTab]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);
  
  // Load TC requests when switching to TC tab (no auto-refresh)
  useEffect(() => {
    if (activeTab === 'transfer-certificates') {
      loadTCRequests(false); // Load with alerts on errors
    }
  }, [activeTab]);

  // Load teacher queries and staff leaves
  useEffect(() => {
    if (activeTab === 'teacher-queries') {
      loadTeacherQueries();
    } else if (activeTab === 'staff-leaves') {
      loadStaffLeaves();
    }
  }, [activeTab]);
  
  // Refetch when staff filter changes
  useEffect(() => {
    if (!loading) { // Only refetch if not in initial load
      fetchAllData();
    }
  }, [staffFilter]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all data in parallel
      const [studentsData, teachersData, staffData, classesData] = await Promise.all([
        AdminService.getAllStudents().catch(err => { console.error('Students fetch error:', err); return []; }),
        AdminService.getAllTeachers().catch(err => { console.error('Teachers fetch error:', err); return []; }),
        AdminService.getAllNonTeachingStaff().catch(err => { console.error('Staff fetch error:', err); return []; }),
        AdminService.getAllClasses().catch(err => { console.error('Classes fetch error:', err); return []; })
      ]);
      
      // Filter teachers and staff based on staffFilter
      const filteredTeachers = staffFilter === 'active'
        ? teachersData.filter(t => t.status === 'ACTIVE')
        : staffFilter === 'inactive'
        ? teachersData.filter(t => t.status === 'INACTIVE')
        : teachersData;
        
      const filteredStaff = staffFilter === 'active'
        ? staffData.filter(s => s.status === 'ACTIVE')
        : staffFilter === 'inactive'
        ? staffData.filter(s => s.status === 'INACTIVE')
        : staffData;
      
      // No filtering for students - store all students to enable status management
      setStudents(studentsData);
      setTeachers(filteredTeachers);
      setNonTeachingStaff(filteredStaff);
      setClasses(classesData);
    } catch (err: any) {
      console.error('Failed to fetch admin data:', err);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // Transfer Certificate helper functions
  const loadTCRequests = async (silent = false) => {
    try {
      setTcLoading(true);
      const requests = await TransferCertificateService.getAllRequests('PENDING');
      setTcRequests(requests || []);
    } catch (error: any) {
      console.error('Error loading TC requests:', error);
      // Only show alert if not a silent refresh (i.e., not from polling)
      if (!silent) {
        alert(error.message || 'Failed to load TC requests');
      }
    } finally {
      setTcLoading(false);
    }
  };

  const handleOpenModal = (request: any, action: 'APPROVED' | 'REJECTED') => {
    setSelectedRequest(request);
    setModalAction(action);
    setAdminReply('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setModalAction(null);
    setAdminReply('');
  };

  const handleSubmitDecision = async () => {
    if (!selectedRequest || !modalAction) return;

    if (!adminReply.trim()) {
      alert('Please provide a reply/remarks');
      return;
    }

    try {
      setProcessing(true);
      await TransferCertificateService.processRequest(
        selectedRequest.id,
        modalAction,
        adminReply
      );
      alert(`Request ${modalAction.toLowerCase()} successfully!`);
      handleCloseModal();
      loadTCRequests(); // Reload the list
    } catch (error: any) {
      console.error('Error processing TC request:', error);
      alert(error.message || 'Failed to process request');
    } finally {
      setProcessing(false);
    }
  };

  // Convert backend StudentResponse to frontend Student type
  const convertToFrontendStudent = (backendStudent: StudentResponse): Student => ({
    id: backendStudent.panNumber,
    name: backendStudent.name,
    section: backendStudent.section, // Use section from backend
    classRollNumber: backendStudent.classRollNumber,
    status: backendStudent.status, // Add status mapping
    feeStatus: backendStudent.feeStatus.toLowerCase() as 'paid' | 'pending' | 'overdue',
    feeCatalogStatus: backendStudent.feeCatalogStatus.toLowerCase().replace('_', '_') as 'up_to_date' | 'pending' | 'overdue',
    currentClass: backendStudent.currentClass, // Use currentClass from backend
    parentName: backendStudent.parentName,
    mobileNumber: backendStudent.mobileNumber,
    dateOfBirth: backendStudent.dateOfBirth,
    gender: backendStudent.gender.toLowerCase() as 'male' | 'female' | 'other',
    address: backendStudent.address,
    emergencyContact: backendStudent.emergencyContact,
    bloodGroup: backendStudent.bloodGroup,
    admissionDate: backendStudent.admissionDate,
    previousSchool: backendStudent.previousSchool
  });

  // Compute statistics from real data
  const stats = AdminService.calculateStats(students, teachers, classes);

  // Mock data for features not yet implemented in backend

  const mockMessages: Message[] = [];

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const handleCloseStudentDetail = () => {
    setShowStudentDetail(false);
    setSelectedStudent(null);
    // Refresh fee management data after closing student detail (in case class was updated)
    setFeeManagementKey(prev => prev + 1);
  };

  const getFeeCatalog = async (studentPanNumber: string): Promise<FeeCatalog> => {
    try {
      const catalog = await FeeService.getFeeCatalogByPan(studentPanNumber);
      return catalog;
    } catch (error) {
      console.error('Failed to fetch fee catalog:', error);
      // Return empty catalog on error
      return {
        studentId: studentPanNumber,
        monthlyFees: [],
        totalAmount: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0
      };
    }
  };

  // Wrapper component to handle async fee catalog loading
  const StudentDetailViewWrapper: React.FC<{
    student: Student;
    onClose: () => void;
    onUpdate: () => Promise<void>;
    getFeeCatalog: (panNumber: string) => Promise<FeeCatalog>;
  }> = ({ student, onClose, onUpdate, getFeeCatalog }) => {
    const [feeCatalog, setFeeCatalog] = useState<FeeCatalog>({
      studentId: student.id,
      monthlyFees: [],
      totalAmount: 0,
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0
    });
    const [loadingFees, setLoadingFees] = useState(true);

    useEffect(() => {
      const loadFeeCatalog = async () => {
        setLoadingFees(true);
        try {
          const catalog = await getFeeCatalog(student.id);
          setFeeCatalog(catalog);
        } catch (error) {
          console.error('Error loading fee catalog:', error);
        } finally {
          setLoadingFees(false);
        }
      };
      loadFeeCatalog();
    }, [student.id]);

    if (loadingFees) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            fontSize: '1.2rem'
          }}>
            Loading fee details...
          </div>
        </div>
      );
    }

    return (
      <StudentDetailView
        student={student}
        feeCatalog={feeCatalog}
        onClose={onClose}
        onUpdate={onUpdate}
      />
    );
  };

  // Handle student status change
  const handleStudentStatusChange = async (panNumber: string, newStatus: string) => {
    try {
      setLoading(true);
      
      // Use AdminService method which sends correct DTO format
      await AdminService.updateStudentStatus([panNumber], newStatus as 'ACTIVE' | 'INACTIVE' | 'GRADUATED');
      
      // Refresh student data
      await fetchAllData();
      
      // Silently update without alert popup
    } catch (err: any) {
      console.error('Failed to update student status:', err);
      // Show error alert only if something goes wrong
      alert(`Failed to update student status: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => {
    if (loading) {
      return <div className="loading-message">Loading dashboard data...</div>;
    }

    if (error) {
      return (
        <div className="error-message">
          <p>Error loading data: {error}</p>
          <button onClick={fetchAllData} className="action-btn">Retry</button>
        </div>
      );
    }

    return (
      <div className="overview-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Total Students</h3>
              <p className="stat-number">{stats.totalStudents}</p>
              <p className="stat-change positive">Active: {stats.activeStudents}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-content">
              <h3>Teaching Staff</h3>
              <p className="stat-number">{stats.totalTeachers}</p>
              <p className="stat-change positive">Active: {stats.activeTeachers}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Fee Collection</h3>
              <p className="stat-number">{stats.feeCollectionRate}%</p>
              <p className="stat-change positive">Overall collection rate</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Pending Fees</h3>
              <p className="stat-number">{stats.pendingRequests}</p>
              <p className="stat-change negative">Students with pending fees</p>
            </div>
          </div>
        </div>

        <div className="recent-activities">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            {mockMessages.length === 0 ? (
              <div className="no-data">No recent activities</div>
            ) : (
              mockMessages.slice(0, 5).map((message) => (
                <div key={message.id} className={`activity-item ${!message.isRead ? 'unread' : ''}`}>
                  <div className="activity-icon">📧</div>
                  <div className="activity-content">
                    <p className="activity-title">{message.subject}</p>
                    <p className="activity-time">{message.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStudents = () => {
    if (loading) {
      return <div className="loading-message">Loading students data...</div>;
    }

    if (error) {
      return (
        <div className="error-message">
          <p>Error loading students: {error}</p>
          <button onClick={fetchAllData} className="action-btn">Retry</button>
        </div>
      );
    }

    // Apply student status filter first
    const statusFilteredStudents = studentFilter === 'all' 
      ? students 
      : students.filter(s => s.status === studentFilter.toUpperCase());

    // Calculate counts for filter badges
    const studentCounts = {
      all: students.length,
      active: students.filter(s => s.status === 'ACTIVE').length,
      inactive: students.filter(s => s.status === 'INACTIVE').length,
      graduated: students.filter(s => s.status === 'GRADUATED').length
    };

    // Then group filtered students by class
    const filteredByStatusClassData: ClassData[] = classes.map(cls => {
      const classStudents = statusFilteredStudents.filter(s => s.classId === cls.id);
      const paidStudents = classStudents.filter(s => s.feeStatus === 'PAID').length;
      const feeCollectionRate = classStudents.length > 0 
        ? Math.round((paidStudents / classStudents.length) * 100) 
        : 0;
      
      return {
        className: cls.className,
        section: 'A',
        students: classStudents.map(convertToFrontendStudent),
        totalStudents: classStudents.length,
        feeCollectionRate
      };
    }).filter(cls => cls.students.length > 0); // Only show classes with students

    // Apply search filter
    const filteredClassData = classSearchTerm.trim() === '' 
      ? filteredByStatusClassData 
      : filteredByStatusClassData
          .map(cls => ({
            ...cls,
            students: cls.students.filter(s => 
              s.name.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
              s.id.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
              s.section.toLowerCase().includes(classSearchTerm.toLowerCase())
            )
          }))
          .filter(cls => 
            cls.className.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
            cls.students.length > 0
          );

    return (
      <div className="students-section">
        {/* Student Status Filter */}
        <div className="student-filters">
          <h3>Student Status Filter:</h3>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${studentFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStudentFilter('all')}
            >
              ⚪ All Students <span className="filter-count">({studentCounts.all})</span>
            </button>
            <button 
              className={`filter-btn ${studentFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStudentFilter('active')}
            >
              🟢 Active <span className="filter-count">({studentCounts.active})</span>
            </button>
            <button 
              className={`filter-btn ${studentFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStudentFilter('inactive')}
            >
              🔴 Inactive <span className="filter-count">({studentCounts.inactive})</span>
            </button>
            <button 
              className={`filter-btn ${studentFilter === 'graduated' ? 'active' : ''}`}
              onClick={() => setStudentFilter('graduated')}
            >
              🎓 Graduated <span className="filter-count">({studentCounts.graduated})</span>
            </button>
          </div>
        </div>

        <div className="section-header">
          <h3>Class-wise Student Data</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, PAN, class, or section..."
              value={classSearchTerm}
              onChange={(e) => setClassSearchTerm(e.target.value)}
            />
            {classSearchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setClassSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredClassData.length === 0 ? (
          <div className="no-data">
            {studentFilter === 'all' 
              ? 'No students found matching your search' 
              : `No ${studentFilter} students found matching your search`
            }
          </div>
        ) : (
          <div className="class-tabs">
            {filteredClassData.map((cls) => {
              // Parse className (e.g., "1-A" -> "Class 1 - Section A")
              const parts = cls.className.split('-');
              const classNumber = parts[0];
              const sectionLetter = parts[1] || cls.section;
              const formattedClassName = `Class ${classNumber} - Section ${sectionLetter}`;
              
              return (
                <div key={cls.className} className="class-tab">
                  <h4>{formattedClassName}</h4>
                  <div className="class-stats">
                  <span>Total: {cls.totalStudents}</span>
                  <span>Fee Collection: {cls.feeCollectionRate}%</span>
                </div>
                {cls.students.length === 0 ? (
                  <div className="no-data">No students in this class yet</div>
                ) : (
                  <div className="students-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Roll No</th>
                          <th>Section</th>
                          <th>Fee Status</th>
                          <th>Student Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cls.students.map((student) => (
                          <tr key={student.id}>
                            <td>{student.name}</td>
                            <td>{student.classRollNumber}</td>
                            <td>{student.section}</td>
                            <td>
                              <span className={`status-badge ${student.feeStatus}`}>
                                {student.feeStatus === 'paid' && 'Paid'}
                                {student.feeStatus === 'pending' && 'Pending'}
                                {student.feeStatus === 'overdue' && 'Overdue'}
                                {!['paid', 'pending', 'overdue'].includes(student.feeStatus) && student.feeStatus}
                              </span>
                            </td>
                            <td>
                              <select
                                className="status-dropdown"
                                value={student.status || 'ACTIVE'}
                                onChange={(e) => handleStudentStatusChange(student.id, e.target.value)}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: '2px solid',
                                  borderColor: student.status === 'ACTIVE' ? '#28a745' : student.status === 'INACTIVE' ? '#dc3545' : student.status === 'GRADUATED' ? '#ffc107' : '#6c757d',
                                  backgroundColor: student.status === 'ACTIVE' ? '#d4edda' : student.status === 'INACTIVE' ? '#f8d7da' : student.status === 'GRADUATED' ? '#fff3cd' : '#f8f9fa',
                                  color: student.status === 'ACTIVE' ? '#155724' : student.status === 'INACTIVE' ? '#721c24' : student.status === 'GRADUATED' ? '#856404' : '#495057',
                                  fontWeight: '600',
                                  fontSize: '14px',
                                  cursor: 'pointer',
                                  outline: 'none',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                              >
                                <option value="ACTIVE">✓ Active</option>
                                <option value="INACTIVE">✕ Inactive</option>
                                <option value="GRADUATED">🎓 Graduated</option>
                              </select>
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
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStaff = () => {
    if (loading) {
      return <div className="loading-message">Loading staff data...</div>;
    }

    if (error) {
      return (
        <div className="error-message">
          <p>Error loading staff: {error}</p>
          <button onClick={fetchAllData} className="action-btn">Retry</button>
        </div>
      );
    }

    // Filter staff by search term
    const searchTerm = staffSearchTerm.trim().toLowerCase();
    const filteredTeachers = searchTerm === '' 
      ? teachers 
      : teachers.filter(teacher =>
          teacher.name.toLowerCase().includes(searchTerm) ||
          teacher.email.toLowerCase().includes(searchTerm) ||
          teacher.designation.toLowerCase().includes(searchTerm) ||
          (teacher.contactNumber && teacher.contactNumber.includes(searchTerm))
        );

    const filteredNonTeachingStaff = searchTerm === '' 
      ? nonTeachingStaff 
      : nonTeachingStaff.filter(staff =>
          staff.name.toLowerCase().includes(searchTerm) ||
          staff.email.toLowerCase().includes(searchTerm) ||
          staff.designation.toLowerCase().includes(searchTerm) ||
          (staff.contactNumber && staff.contactNumber.includes(searchTerm))
        );

    return (
      <div className="staff-section">
        {/* Search Bar */}
        <div className="section-header">
          <h3>Staff Management</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, designation, or contact..."
              value={staffSearchTerm}
              onChange={(e) => setStaffSearchTerm(e.target.value)}
            />
            {staffSearchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setStaffSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="staff-filters">
          <h3>Staff Status Filter:</h3>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${staffFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStaffFilter('active')}
            >
              🟢 Active Only
            </button>
            <button 
              className={`filter-btn ${staffFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStaffFilter('inactive')}
            >
              🔴 Inactive Only
            </button>
            <button 
              className={`filter-btn ${staffFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStaffFilter('all')}
            >
              ⚪ All Staff
            </button>
          </div>
        </div>
        
        <div className="staff-tabs">
          <div className="staff-tab">
            <h3>Teaching Staff ({filteredTeachers.length})</h3>
            {filteredTeachers.length === 0 ? (
              <div className="no-data">No teaching staff found matching your search</div>
            ) : (
              <div className="staff-grid">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="staff-card">
                    <div className="staff-avatar">👨‍🏫</div>
                    <div className="staff-info">
                      <h4>{teacher.name}</h4>
                      <p className="staff-designation">{teacher.designation}</p>
                      <p className="staff-qualification">{teacher.qualification}</p>
                      <p className="staff-contact">{teacher.contactNumber}</p>
                      <p className="staff-email">{teacher.email}</p>
                      <div className="staff-classes">
                        <strong>Assigned Classes:</strong> {teacher.className?.join(', ') || 'None'}
                      </div>
                      <div className="staff-status">
                        <span className={`status-badge ${teacher.status.toLowerCase()}`}>
                          {teacher.status}
                        </span>
                      </div>
                    </div>
                    <div className="staff-actions">
                      <button className="action-btn">View Details</button>
                      {teacher.status === 'ACTIVE' ? (
                        <button 
                          className="action-btn deactivate-btn"
                          onClick={() => handleDeactivateTeacher(teacher.id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          className="action-btn activate-btn"
                          onClick={() => handleReactivateTeacher(teacher.id)}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="staff-tab">
            <h3>Non-Teaching Staff ({filteredNonTeachingStaff.length})</h3>
            {filteredNonTeachingStaff.length === 0 ? (
              <div className="no-data">No non-teaching staff found matching your search</div>
            ) : (
              <div className="staff-grid">
                {filteredNonTeachingStaff.map((staff) => (
                  <div key={staff.userId} className="staff-card">
                    <div className="staff-avatar">👷</div>
                    <div className="staff-info">
                      <h4>{staff.name}</h4>
                      <p className="staff-designation">{staff.designation}</p>
                      <p className="staff-contact">{staff.contactNumber}</p>
                      <p className="staff-email">{staff.email}</p>
                      <div className="staff-status">
                        <span className={`status-badge ${staff.status.toLowerCase()}`}>
                          {staff.status}
                        </span>
                      </div>
                    </div>
                    <div className="staff-actions">
                      <button className="action-btn">View Details</button>
                      {staff.status === 'ACTIVE' ? (
                        <button 
                          className="action-btn deactivate-btn"
                          onClick={() => handleDeactivateNonTeachingStaff(staff.userId)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button 
                          className="action-btn activate-btn"
                          onClick={() => handleReactivateNonTeachingStaff(staff.userId)}
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleDeactivateTeacher = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this teacher?')) {
      try {
        await AdminService.deactivateTeacher(id);
        alert('Teacher deactivated successfully');
        fetchAllData(); // Refresh data
      } catch (error: any) {
        alert(error.message || 'Failed to deactivate teacher');
      }
    }
  };
  
  const handleReactivateTeacher = async (id: number) => {
    if (window.confirm('Are you sure you want to reactivate this teacher?')) {
      try {
        await AdminService.reactivateTeacher(id);
        alert('Teacher reactivated successfully');
        fetchAllData(); // Refresh data
      } catch (error: any) {
        alert(error.message || 'Failed to reactivate teacher');
      }
    }
  };

  const handleDeactivateNonTeachingStaff = async (id: number) => {
    if (window.confirm('Are you sure you want to deactivate this staff member?')) {
      try {
        await AdminService.deactivateNonTeachingStaff(id);
        alert('Staff member deactivated successfully');
        fetchAllData(); // Refresh data
      } catch (error: any) {
        alert(error.message || 'Failed to deactivate staff member');
      }
    }
  };
  
  const handleReactivateNonTeachingStaff = async (id: number) => {
    if (window.confirm('Are you sure you want to reactivate this staff member?')) {
      try {
        await AdminService.reactivateNonTeachingStaff(id);
        alert('Staff member reactivated successfully');
        fetchAllData(); // Refresh data
      } catch (error: any) {
        alert(error.message || 'Failed to reactivate staff member');
      }
    }
  };

  const renderTransferCertificates = () => {
    return (
      <div className="transfer-certificates-section">
        <div style={{ marginBottom: '20px' }}>
          <h3>Transfer Certificate Requests</h3>
        </div>

        {tcLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading TC requests...
          </div>
        ) : tcRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No pending TC requests at the moment.</p>
          </div>
        ) : (
          <div className="tc-requests">
            {tcRequests.map((tc) => (
              <div key={tc.id} className="tc-request-card">
                <div className="tc-header">
                  <h4>{tc.studentName || 'N/A'}</h4>
                  <span className={`status-badge ${tc.status.toLowerCase()}`}>
                    {tc.status}
                  </span>
                </div>
                <div className="tc-details">
                  <p><strong>PAN:</strong> {tc.studentPanNumber || tc.studentPan}</p>
                  <p><strong>Class:</strong> {tc.className || 'N/A'}</p>
                  <p><strong>Session:</strong> {tc.sessionName || 'N/A'}</p>
                  <p><strong>Request Date:</strong> {tc.requestDate ? new Date(tc.requestDate).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Reason:</strong> {tc.reason || 'N/A'}</p>
                </div>
                <div className="tc-actions">
                  <button 
                    className="action-btn approve"
                    onClick={() => handleOpenModal(tc, 'APPROVED')}
                    disabled={processing}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="action-btn reject"
                    onClick={() => handleOpenModal(tc, 'REJECTED')}
                    disabled={processing}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Approve/Reject */}
        {showModal && selectedRequest && modalAction && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}>
              <h3 style={{ marginBottom: '20px', color: modalAction === 'APPROVED' ? 'green' : 'red' }}>
                {modalAction === 'APPROVED' ? '✓ Approve' : '✗ Reject'} TC Request
              </h3>
              
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                <p><strong>Student:</strong> {selectedRequest.studentName}</p>
                <p><strong>PAN:</strong> {selectedRequest.studentPanNumber || selectedRequest.studentPan}</p>
                <p><strong>Class:</strong> {selectedRequest.className}</p>
                <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Admin Reply/Remarks <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder={`Enter your remarks for ${modalAction === 'APPROVED' ? 'approving' : 'rejecting'} this request`}
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCloseModal}
                  disabled={processing}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#333',
                    cursor: processing ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitDecision}
                  disabled={processing || !adminReply.trim()}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: processing || !adminReply.trim() ? '#ccc' : (modalAction === 'APPROVED' ? '#28a745' : '#dc3545'),
                    color: 'white',
                    cursor: processing || !adminReply.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {processing ? 'Processing...' : `Confirm ${modalAction === 'APPROVED' ? 'Approval' : 'Rejection'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderInbox = () => {
    // Filter students based on search term
    const filteredStudents = students.filter(student => {
      const searchLower = studentSearchTerm.toLowerCase();
      return (
        student.name.toLowerCase().includes(searchLower) ||
        student.panNumber.toLowerCase().includes(searchLower) ||
        student.className?.toLowerCase().includes(searchLower)
      );
    });

    // Filter teachers based on search term
    const filteredTeachers = teachers.filter(teacher => {
      const searchLower = teacherSearchTerm.toLowerCase();
      return (
        teacher.name.toLowerCase().includes(searchLower) ||
        teacher.email.toLowerCase().includes(searchLower) ||
        teacher.designation?.toLowerCase().includes(searchLower)
      );
    });

    // Handle select all students
    const handleSelectAllStudents = (checked: boolean) => {
      setSelectAllStudents(checked);
      if (checked) {
        setSelectedStudents(filteredStudents.map(s => s.panNumber));
      } else {
        setSelectedStudents([]);
      }
    };

    // Handle select all teachers
    const handleSelectAllTeachers = (checked: boolean) => {
      setSelectAllTeachers(checked);
      if (checked) {
        setSelectedTeachers(filteredTeachers.map(t => t.email));
      } else {
        setSelectedTeachers([]);
      }
    };

    // Handle individual student selection
    const handleStudentToggle = (panNumber: string) => {
      setSelectedStudents(prev => {
        if (prev.includes(panNumber)) {
          return prev.filter(p => p !== panNumber);
        } else {
          return [...prev, panNumber];
        }
      });
    };

    // Handle individual teacher selection
    const handleTeacherToggle = (email: string) => {
      setSelectedTeachers(prev => {
        if (prev.includes(email)) {
          return prev.filter(e => e !== email);
        } else {
          return [...prev, email];
        }
      });
    };

    // Handle broadcast message
    const handleBroadcast = async () => {
      try {
        setBroadcasting(true);
        setBroadcastError('');
        setBroadcastSuccess('');

        // Validation
        if (!broadcastTitle.trim()) {
          setBroadcastError('Please enter a message title');
          return;
        }

        if (!broadcastMessage.trim()) {
          setBroadcastError('Please enter a message');
          return;
        }

        // Collect recipients based on selection
        let recipientIds: string[] = [];
        
        if (selectedRecipientType === 'STUDENT' || selectedRecipientType === 'BOTH') {
          if (selectedStudents.length === 0) {
            setBroadcastError('Please select at least one student');
            return;
          }
          recipientIds = [...recipientIds, ...selectedStudents];
        }

        if (selectedRecipientType === 'TEACHER' || selectedRecipientType === 'BOTH') {
          if (selectedTeachers.length === 0 && selectedRecipientType === 'TEACHER') {
            setBroadcastError('Please select at least one teacher');
            return;
          }
          recipientIds = [...recipientIds, ...selectedTeachers];
        }

        if (recipientIds.length === 0) {
          setBroadcastError('Please select at least one recipient');
          return;
        }

        // Send broadcast for students
        if (selectedRecipientType === 'STUDENT' || selectedRecipientType === 'BOTH') {
          const studentBroadcast: BroadcastMessageDto = {
            title: broadcastTitle,
            message: broadcastMessage,
            recipientIds: selectedStudents,
            recipientType: 'STUDENT',
            priority: broadcastPriority
          };
          await NotificationService.broadcastMessage(studentBroadcast);
        }

        // Send broadcast for teachers
        if (selectedRecipientType === 'TEACHER' || selectedRecipientType === 'BOTH') {
          const teacherBroadcast: BroadcastMessageDto = {
            title: broadcastTitle,
            message: broadcastMessage,
            recipientIds: selectedTeachers,
            recipientType: 'TEACHER',
            priority: broadcastPriority
          };
          await NotificationService.broadcastMessage(teacherBroadcast);
        }

        setBroadcastSuccess(`Message sent successfully to ${recipientIds.length} recipient(s)!`);
        
        // Reset form
        setBroadcastTitle('');
        setBroadcastMessage('');
        setSelectedStudents([]);
        setSelectedTeachers([]);
        setSelectAllStudents(false);
        setSelectAllTeachers(false);
        
        // Clear success message after 5 seconds
        setTimeout(() => setBroadcastSuccess(''), 5000);

      } catch (err: any) {
        console.error('Broadcast error:', err);
        setBroadcastError(err.message || 'Failed to send broadcast message');
      } finally {
        setBroadcasting(false);
      }
    };

    return (
      <div className="inbox-section">
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.75rem' }}>📧 Broadcast Message</h3>
        
        {/* Success/Error Messages */}
        {broadcastSuccess && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#10b981',
            color: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>✓</span>
            <span>{broadcastSuccess}</span>
          </div>
        )}

        {broadcastError && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>⚠️</span>
            <span>{broadcastError}</span>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Message Compose Section */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#1f2937' }}>Compose Message</h4>
            
            <div style={{ display: 'grid', gap: '1rem' }}>
              {/* Title Input */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Message Title *
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Enter message title..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Priority Selection */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Priority Level
                </label>
                <select
                  value={broadcastPriority}
                  onChange={(e) => setBroadcastPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="LOW">🟢 Low Priority</option>
                  <option value="MEDIUM">🟡 Medium Priority</option>
                  <option value="HIGH">🔴 High Priority</option>
                </select>
              </div>

              {/* Message Textarea */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>
                  Message Content *
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recipient Selection Section */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <h4 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: '#1f2937' }}>Select Recipients</h4>
            
            {/* Recipient Type Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                onClick={() => setSelectedRecipientType('STUDENT')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: selectedRecipientType === 'STUDENT' ? '#3b82f6' : '#f3f4f6',
                  color: selectedRecipientType === 'STUDENT' ? 'white' : '#4b5563',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                👨‍🎓 Students Only
              </button>
              <button
                onClick={() => setSelectedRecipientType('TEACHER')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: selectedRecipientType === 'TEACHER' ? '#3b82f6' : '#f3f4f6',
                  color: selectedRecipientType === 'TEACHER' ? 'white' : '#4b5563',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                👨‍🏫 Teachers Only
              </button>
              <button
                onClick={() => setSelectedRecipientType('BOTH')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: selectedRecipientType === 'BOTH' ? '#3b82f6' : '#f3f4f6',
                  color: selectedRecipientType === 'BOTH' ? 'white' : '#4b5563',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                👥 Both
              </button>
            </div>

            {/* Students List */}
            {(selectedRecipientType === 'STUDENT' || selectedRecipientType === 'BOTH') && (
              <div style={{ marginBottom: selectedRecipientType === 'BOTH' ? '1.5rem' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>
                    Students ({selectedStudents.length} selected{studentSearchTerm ? ` • ${filteredStudents.length} found` : ''})
                  </h5>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectAllStudents}
                      onChange={(e) => handleSelectAllStudents(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Select All</span>
                  </label>
                </div>
                
                {/* Student Search Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search by name, PAN, or class..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.5rem'
                }}>
                  {filteredStudents.length === 0 ? (
                    <p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                      {studentSearchTerm ? 'No students found matching your search' : 'No students available'}
                    </p>
                  ) : (
                    filteredStudents.map(student => (
                      <label
                        key={student.panNumber}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'background 0.2s',
                          background: selectedStudents.includes(student.panNumber) ? '#eff6ff' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = selectedStudents.includes(student.panNumber) ? '#eff6ff' : 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.panNumber)}
                          onChange={() => handleStudentToggle(student.panNumber)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{student.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {student.className} • {student.panNumber}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Teachers List */}
            {(selectedRecipientType === 'TEACHER' || selectedRecipientType === 'BOTH') && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h5 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>
                    Teachers ({selectedTeachers.length} selected{teacherSearchTerm ? ` • ${filteredTeachers.length} found` : ''})
                  </h5>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectAllTeachers}
                      onChange={(e) => handleSelectAllTeachers(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Select All</span>
                  </label>
                </div>
                
                {/* Teacher Search Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search by name, email, or designation..."
                    value={teacherSearchTerm}
                    onChange={(e) => setTeacherSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                  />
                </div>
                
                <div style={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '0.5rem'
                }}>
                  {filteredTeachers.length === 0 ? (
                    <p style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                      {teacherSearchTerm ? 'No teachers found matching your search' : 'No teachers available'}
                    </p>
                  ) : (
                    filteredTeachers.map(teacher => (
                      <label
                        key={teacher.email}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          transition: 'background 0.2s',
                          background: selectedTeachers.includes(teacher.email) ? '#eff6ff' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = selectedTeachers.includes(teacher.email) ? '#eff6ff' : 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTeachers.includes(teacher.email)}
                          onChange={() => handleTeacherToggle(teacher.email)}
                          style={{ cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{teacher.name}</div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {teacher.designation} • {teacher.email}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleBroadcast}
            disabled={broadcasting}
            style={{
              padding: '1rem',
              background: broadcasting ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              cursor: broadcasting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => !broadcasting && (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={(e) => !broadcasting && (e.currentTarget.style.background = '#3b82f6')}
          >
            {broadcasting ? '📤 Sending...' : '📤 Send Broadcast Message'}
          </button>
        </div>
      </div>
    );
  };

  // Load teacher queries from admin
  const loadTeacherQueries = async () => {
    try {
      const queries = await QueryService.getTeacherQueriesForAdmin();
      setTeacherQueries(queries);
    } catch (err) {
      console.error('Error loading teacher queries:', err);
      setTeacherQueries([]);
    }
  };

  // Load staff leave requests
  const loadStaffLeaves = async () => {
    try {
      const leaves = await LeaveService.getAllStaffLeavesForAdmin();
      setStaffLeaves(leaves);
    } catch (err) {
      console.error('Error loading staff leaves:', err);
      setStaffLeaves([]);
    }
  };



  // Handle responding to teacher query
  const handleRespondToTeacherQuery = async (queryId: number) => {
    try {
      const response = queryResponseText[queryId];
      if (!response || !response.trim()) {
        alert('Please enter a response');
        return;
      }
      await QueryService.respondToTeacherQuery({ queryId, response });
      alert('Response sent successfully!');
      setQueryResponseText({ ...queryResponseText, [queryId]: '' });
      await loadTeacherQueries();
    } catch (err: any) {
      alert('Failed to send response: ' + err.message);
    }
  };

  // Handle staff leave action
  const handleStaffLeaveAction = async (leaveId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const adminResponse = leaveResponseText[leaveId] || (status === 'APPROVED' ? 'Approved' : 'Rejected');
      await LeaveService.updateStaffLeaveStatus(leaveId, { status, adminResponse });
      alert(`Leave request ${status.toLowerCase()} successfully!`);
      setLeaveResponseText({ ...leaveResponseText, [leaveId]: '' });
      await loadStaffLeaves();
    } catch (err: any) {
      alert('Failed to process leave request: ' + err.message);
    }
  };

  // Render teacher queries
  const renderTeacherQueries = () => (
    <div className="teacher-queries-section">
      {/* Section Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div>
          <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.5rem', fontWeight: '700' }}>
            👨‍🏫 Teacher Queries
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            Review and respond to teacher questions
          </p>
        </div>
        <div style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '20px',
          fontSize: '1rem',
          fontWeight: '700',
          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
        }}>
          {teacherQueries.length} Total
        </div>
      </div>

      {teacherQueries.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: '#1f2937' }}>
            No Teacher Queries
          </h3>
          <p style={{ margin: 0, fontSize: '1rem', color: '#6b7280' }}>
            Teacher questions will appear here when submitted
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {teacherQueries.map((query) => (
            <div key={query.id} style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderLeft: `4px solid ${query.status === 'RESPONDED' ? '#10b981' : '#f59e0b'}`,
              borderRadius: '12px',
              padding: '1.75rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.08)';
            }}>
              {/* Query Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.75rem', color: '#1f2937', fontSize: '1.2rem', fontWeight: '700' }}>
                    {query.subject}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      👤 From Teacher
                    </span>
                    <span style={{ color: '#d1d5db' }}>•</span>
                    <span style={{ 
                      fontSize: '0.9rem', 
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      📅 {query.createdAt ? new Date(query.createdAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <span style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '24px',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  backgroundColor: query.status === 'OPEN' ? '#fef3c7' : '#d1fae5',
                  color: query.status === 'OPEN' ? '#92400e' : '#065f46',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  {query.status === 'OPEN' ? '⏳ Pending' : '✅ Answered'}
                </span>
              </div>
              
              {/* Query Content */}
              <div style={{ 
                padding: '1.25rem', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px',
                marginBottom: query.response ? '1.25rem' : (query.status === 'OPEN' ? '1.25rem' : 0),
                border: '1px solid #f3f4f6'
              }}>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  ❓ Teacher's Question:
                </p>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', lineHeight: '1.7' }}>
                  {query.content}
                </p>
              </div>

              {/* Response Section */}
              {query.response && (
                <div style={{ 
                  backgroundColor: '#ecfdf5', 
                  borderLeft: '4px solid #10b981', 
                  padding: '1.25rem', 
                  borderRadius: '8px',
                  marginBottom: '1.25rem'
                }}>
                  <p style={{ 
                    margin: '0 0 0.75rem', 
                    fontWeight: '700', 
                    color: '#065f46',
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    ✅ Your Response:
                  </p>
                  <p style={{ margin: '0 0 0.75rem', color: '#047857', lineHeight: '1.7', fontSize: '1rem' }}>
                    {query.response}
                  </p>
                  {query.respondedAt && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#059669' }}>
                      📅 Responded on {new Date(query.respondedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Response Form for Open Queries */}
              {query.status === 'OPEN' && (
                <div style={{ 
                  marginTop: '1.25rem',
                  backgroundColor: '#f8fafc',
                  padding: '1.5rem',
                  borderRadius: '10px',
                  border: '2px solid #e2e8f0'
                }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.75rem', 
                    fontWeight: '700',
                    color: '#1f2937',
                    fontSize: '1rem'
                  }}>
                    💬 Provide Your Response:
                  </label>
                  <textarea
                    value={queryResponseText[query.adminId!] || ''}
                    onChange={(e) => {
                      if (query.adminId) {
                        setQueryResponseText({ ...queryResponseText, [query.adminId]: e.target.value });
                      }
                    }}
                    placeholder="Type your detailed response to help the teacher..."
                    rows={5}
                    style={{ 
                      width: '100%', 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      border: '2px solid #e2e8f0',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      marginBottom: '1rem',
                      resize: 'vertical',
                      transition: 'border-color 0.2s',
                      lineHeight: '1.6',
                      pointerEvents: 'auto',
                      userSelect: 'text',
                      cursor: 'text',
                      zIndex: 1,
                      position: 'relative'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                      onClick={() => {
                        if (query.adminId && queryResponseText[query.adminId]?.trim()) {
                          handleRespondToTeacherQuery(query.adminId);
                        }
                      }}
                      disabled={!query.adminId || !queryResponseText[query.adminId]?.trim()}
                      style={{ 
                        backgroundColor: (!query.adminId || !queryResponseText[query.adminId]?.trim()) ? '#9ca3af' : '#10b981',
                        color: 'white', 
                        padding: '0.875rem 2rem', 
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '700',
                        cursor: (!query.adminId || !queryResponseText[query.adminId]?.trim()) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: (!query.adminId || !queryResponseText[query.adminId]?.trim()) ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => {
                        if (query.adminId && queryResponseText[query.adminId]?.trim()) {
                          e.currentTarget.style.backgroundColor = '#059669';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (query.adminId && queryResponseText[query.adminId]?.trim()) {
                          e.currentTarget.style.backgroundColor = '#10b981';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      <span>📤</span>
                      <span>Send Response</span>
                    </button>
                    {queryResponseText[query.adminId!]?.trim() && (
                      <span style={{ 
                        fontSize: '0.85rem', 
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        {queryResponseText[query.adminId!].length} characters
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render staff leave requests
  const renderStaffLeaves = () => (
    <div style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Staff Leave Requests</h2>
      {staffLeaves.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '8px' 
        }}>
          <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>No staff leave requests at the moment</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {staffLeaves.map((leave) => (
            <div key={leave.id} style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1.5rem',
              backgroundColor: leave.status === 'APPROVED' ? '#f0fdf4' : leave.status === 'REJECTED' ? '#fef2f2' : '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>{leave.teacherName || 'Teacher'}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
                    {leave.reason}
                  </p>
                </div>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  height: 'fit-content',
                  backgroundColor: leave.status === 'PENDING' ? '#fef3c7' : leave.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                  color: leave.status === 'PENDING' ? '#92400e' : leave.status === 'APPROVED' ? '#065f46' : '#991b1b',
                  fontWeight: '500'
                }}>
                  {leave.status}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Start Date:</p>
                  <p style={{ color: '#374151' }}>{leave.startDate}</p>
                </div>
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem', fontSize: '0.9rem' }}>End Date:</p>
                  <p style={{ color: '#374151' }}>{leave.endDate}</p>
                </div>
              </div>

              <p style={{ marginBottom: '1rem' }}>
                <strong>Days Requested:</strong> {leave.daysRequested}
              </p>

              {leave.adminResponse && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '6px' 
                }}>
                  <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Your Response:</p>
                  <p style={{ color: '#374151' }}>{leave.adminResponse}</p>
                  {leave.processedBy && (
                    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                      Processed by: {leave.processedBy}
                    </p>
                  )}
                </div>
              )}

              {leave.status === 'PENDING' && (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Remarks (optional):
                  </label>
                  <input
                    type="text"
                    value={leaveResponseText[leave.id] || ''}
                    onChange={(e) => setLeaveResponseText({ ...leaveResponseText, [leave.id]: e.target.value })}
                    placeholder="Add any remarks..."
                    style={{ 
                      width: '100%', 
                      padding: '0.75rem', 
                      borderRadius: '6px', 
                      border: '1px solid #d1d5db',
                      fontSize: '1rem',
                      marginBottom: '0.75rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      onClick={() => handleStaffLeaveAction(leave.id, 'APPROVED')}
                      style={{ 
                        backgroundColor: '#10b981', 
                        color: 'white', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleStaffLeaveAction(leave.id, 'REJECTED')}
                      style={{ 
                        backgroundColor: '#ef4444', 
                        color: 'white', 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSessions = () => (
    <SessionManagement 
      onSessionChange={() => {
        // Refresh students/classes data when sessions change
        fetchAllData();
      }} 
    />
  );

  const renderClasses = () => (
    <ClassManagement 
      onClassChange={() => {
        // Refresh students/classes data when classes change
        fetchAllData();
      }} 
    />
  );

  const renderRegistration = () => (
    <div className="registration-section">
      <UnifiedRegistration onRegistrationSuccess={fetchAllData} />
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
      case 'registration':
        return renderRegistration();
      case 'sessions':
        return renderSessions();
      case 'classes':
        return renderClasses();
      case 'subjects':
        return <SubjectManagement />;
      case 'fees':
        return <FeeManagement key={feeManagementKey} />;
      case 'transfer-certificates':
        return renderTransferCertificates();
      case 'events':
        return <EventManagement />;
      case 'timetable':
        return <TimetableManagement />;
      case 'exams':
        return <ExamManagement />;
      case 'teacher-queries':
        return renderTeacherQueries();
      case 'staff-leaves':
        return renderStaffLeaves();
      case 'marks-upload':
        return <MarksUpload activeSessionId={activeSessionId} />;
      case 'inbox':
        return renderInbox();
      case 'gallery':
        return <GalleryManagement />;
      case 'holidays':
        return <HolidayManagement />;
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
          <button className="nav-btn logout" onClick={handleLogout}>Logout</button>
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
              className={`nav-item ${activeTab === 'registration' ? 'active' : ''}`}
              onClick={() => setActiveTab('registration')}
            >
              ✏️ Registration
            </button>
            <button
              className={`nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
              onClick={() => setActiveTab('sessions')}
            >
              📅 Sessions
            </button>
            <button
              className={`nav-item ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              📚 Classes
            </button>
            <button
              className={`nav-item ${activeTab === 'subjects' ? 'active' : ''}`}
              onClick={() => setActiveTab('subjects')}
            >
              📖 Subjects
            </button>
            <button
              className={`nav-item ${activeTab === 'fees' ? 'active' : ''}`}
              onClick={() => setActiveTab('fees')}
            >
              💰 Fee Management
            </button>
            <button
              className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
              onClick={() => setActiveTab('timetable')}
            >
              📅 Timetable
            </button>
            <button
              className={`nav-item ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => setActiveTab('exams')}
            >
              📝 Exams
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
              className={`nav-item ${activeTab === 'teacher-queries' ? 'active' : ''}`}
              onClick={() => setActiveTab('teacher-queries')}
            >
              ❓ Teacher Queries
            </button>
            <button
              className={`nav-item ${activeTab === 'staff-leaves' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff-leaves')}
            >
              📝 Staff Leaves
            </button>
            <button
              className={`nav-item ${activeTab === 'marks-upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('marks-upload')}
            >
              📊 Upload Marks
            </button>
            <button
              className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`}
              onClick={() => setActiveTab('inbox')}
            >
              📧 Inbox
            </button>
            <button
              className={`nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
            >
              🖼️ Gallery
            </button>
            <button
              className={`nav-item ${activeTab === 'holidays' ? 'active' : ''}`}
              onClick={() => setActiveTab('holidays')}
            >
              📅 Holidays
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
        <StudentDetailViewWrapper
          student={selectedStudent}
          onClose={handleCloseStudentDetail}
          onUpdate={async () => {
            try {
              // Refresh students list after update
              await fetchAllData();
              
              // Fetch fresh student data directly from API
              if (selectedStudent) {
                const freshStudentData = await StudentService.getStudentByPan(selectedStudent.id);
                setSelectedStudent(convertToFrontendStudent(freshStudentData));
              }
            } catch (error) {
              console.error('Failed to refresh student data:', error);
            }
          }}
          getFeeCatalog={getFeeCatalog}
        />
      )}
    </div>
  );
};

export default AdminDashboard; 