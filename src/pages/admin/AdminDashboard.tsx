import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import StudentDetailView from './StudentDetailView';
import UnifiedRegistration from './UnifiedRegistration';
import SessionManagement from './SessionManagement';
import ClassManagement from './ClassManagement';
import EventManagement from './EventManagement';
import SubjectManagement from './SubjectManagement';
import FeeManagement from './FeeManagement';
import { FeeService } from '../../services/feeService';
import AdminService, { StudentResponse, TeacherResponse, NonTeachingStaffResponse, ClassInfoResponse } from '../../services/adminService';
import StudentService from '../../services/studentService';
import TransferCertificateService from '../../services/transferCertificateService';
import TeacherAssignment from './TeacherAssignment.tsx';
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
  
  // Load TC requests when switching to TC tab
  useEffect(() => {
    if (activeTab === 'tc-requests') {
      loadTCRequests();
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
  const loadTCRequests = async () => {
    try {
      setTcLoading(true);
      const requests = await TransferCertificateService.getAllRequests('PENDING');
      setTcRequests(requests || []);
    } catch (error: any) {
      console.error('Error loading TC requests:', error);
      alert(error.message || 'Failed to load TC requests');
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
      await StudentService.updateStudentStatus(panNumber, { status: newStatus });
      
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Transfer Certificate Requests</h3>
          <button 
            className="action-btn"
            onClick={loadTCRequests}
            style={{ padding: '8px 16px' }}
          >
            🔄 Refresh
          </button>
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
        return <TeacherAssignment />;
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