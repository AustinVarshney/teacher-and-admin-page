import React, { useMemo, useState, useEffect } from 'react';
import './StudentDashboard.css';
import './TCForm.css';
import StudentService from '../../services/studentService';
import EventService from '../../services/eventService';
import TimetableService from '../../services/timetableService';
import { FeeService } from '../../services/feeService';
import { AttendanceService } from '../../services/attendanceService';
import TransferCertificateService from '../../services/transferCertificateService';
import { TransferCertificateRequest, TCRequest } from '../../types';
import NotificationService, { NotificationDto } from '../../services/notificationService';
import LeaveService, { StudentLeaveResponse } from '../../services/leaveService';
import QueryService, { StudentQueryResponse } from '../../services/queryService';
import resultService, { StudentResultsDTO } from '../../services/resultService';
import VideoLectureService, { VideoLecture as VideoLectureType } from '../../services/videoLectureService';
import galleryService from '../../services/galleryService';

interface StudentDashboardProps {
  onLogout: () => void;
}

type AttendanceSummary = { present: number; absent: number; };
type Holiday = { id: string; date: string; name: string; };
type TimetableEntry = { id: string; day: string; period: number; start: string; end: string; subject: string; teacher: string; };
type EventItem = { id: string; startDate: string; endDate: string; name: string; description?: string; type: 'sports' | 'cultural' | 'academic' | 'meeting'; };
type FeeStatus = { total: number; paid: number; pending: number; status: 'paid' | 'pending' | 'overdue'; };
type EnquiryContact = { id: string; subject: string; teacher: string; phone: string; isClassTeacher?: boolean; };
type GalleryItem = { id: string; title: string; imageUrl: string; };
type VehicleRoute = { id: string; route: string; pickup: string; drop: string; note?: string; };
type PreviousClassRecord = { id: string; classLabel: string; schoolName: string; passingYear: string; percentage: string; grade: string; gallery: GalleryItem[]; resultUrl?: string; certificateUrl?: string; };

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'holidays' | 'timetable' | 'events' | 'results' | 'fees' | 'gallery' | 'lectures' | 'queries' | 'enquiry' | 'leave' | 'transport' | 'tc' | 'history'>('home');
  const [querySubject, setQuerySubject] = useState('Mathematics');
  const [queryText, setQueryText] = useState('');
  const [leaveImage, setLeaveImage] = useState<File | null>(null);
  const [leaveSubject, setLeaveSubject] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [myLeaveRequests, setMyLeaveRequests] = useState<StudentLeaveResponse[]>([]);
  const [myQueries, setMyQueries] = useState<StudentQueryResponse[]>([]);
  const [selectedQueryTeacher, setSelectedQueryTeacher] = useState<number | null>(null);

  // State for real data from API
  const [student, setStudent] = useState<any>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [feeData, setFeeData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [enquiryContacts, setEnquiryContacts] = useState<EnquiryContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [studentResults, setStudentResults] = useState<StudentResultsDTO | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [videoLectures, setVideoLectures] = useState<VideoLectureType[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  // Transfer Certificate state
  const [tcRequests, setTcRequests] = useState<TransferCertificateRequest[]>([]);
  const [showTCForm, setShowTCForm] = useState(false);
  const [tcFormData, setTcFormData] = useState<TCRequest>({
    reason: '',
    additionalDetails: '',
    transferDate: '',
    newSchoolName: '',
    newSchoolAddress: ''
  });
  const [tcLoading, setTcLoading] = useState(false);
  const [tcError, setTcError] = useState<string | null>(null);
  const [tcSuccess, setTcSuccess] = useState<string | null>(null);

  // Load student data, timetable, and events from API
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current logged-in student's details using /api/students/me
        // This endpoint is secured for ROLE_STUDENT and doesn't require PAN parameter
        const studentData = await StudentService.getCurrentStudent();
        console.log('Student data from backend:', studentData);
        console.log('Student classId field:', studentData.classId);
        console.log('Student currentClassId field:', studentData.currentClassId);
        
        // Try multiple possible field names for class ID
        const classId = studentData.classId || studentData.currentClassId || studentData.class_id;
        console.log('Resolved class ID:', classId);
        
        setStudent({
          name: studentData.name || 'Student',
          currentClass: studentData.currentClass || studentData.className || 'N/A',
          pan: studentData.panNumber || 'N/A',
          photo: studentData.photo || 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&q=80&auto=format&fit=crop',
          schoolName: 'Mauritius International School',
          schoolLogo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-8IRdKonj2lw5KF7osJq3GRJSOrjKiKck0g&s',
          classId: classId,
          section: studentData.section || 'A'
        });

        // Fetch timetable for student's class - ONLY if classId is valid
        if (classId && classId !== 'undefined' && !isNaN(Number(classId))) {
          try {
            console.log('Fetching timetable for class ID:', classId);
            console.log('Calling TimetableService.getTimetableByClass with:', classId);
            const timetableData = await TimetableService.getTimetableByClass(classId);
            console.log('Raw timetable data from backend:', timetableData);
            console.log('Timetable entries count:', timetableData?.length || 0);
            
            if (!timetableData || timetableData.length === 0) {
              console.warn('Timetable is empty or null');
              setTimetable([]);
              setEnquiryContacts([]);
            } else {
              // Log first entry to see structure
              console.log('First timetable entry structure:', timetableData[0]);
              
              // Transform timetable data to match component format
              const transformedTimetable = timetableData.map((entry: any, index: number) => ({
                id: entry.id?.toString() || `t${index}`,
                day: entry.day || entry.dayOfWeek || 'Mon',
                period: index + 1,
                start: entry.startTime || '08:00',
                end: entry.endTime || '08:45',
                subject: entry.subjectName || entry.subject || 'Subject',
                teacher: entry.teacherName || entry.teacher || 'Teacher'
              }));
              
              setTimetable(transformedTimetable);

              // Extract unique teachers from timetable and fetch their contact details
              const uniqueTeacherMap = new Map<number, { subjectName: string; teacherName: string; contactNumber: string }>();
              timetableData.forEach((entry: any, idx: number) => {
                console.log(`Processing timetable entry ${idx}:`, {
                  teacherId: entry.teacherId,
                  teacherName: entry.teacherName,
                  subjectName: entry.subjectName,
                  teacherContactNumber: entry.teacherContactNumber,
                  fullEntry: entry
                });
                
                if (entry.teacherId && entry.teacherName && entry.subjectName) {
                  if (!uniqueTeacherMap.has(entry.teacherId)) {
                    uniqueTeacherMap.set(entry.teacherId, {
                      subjectName: entry.subjectName,
                      teacherName: entry.teacherName,
                      contactNumber: entry.teacherContactNumber || 'N/A'
                    });
                    console.log(`Added teacher ${entry.teacherId}: ${entry.teacherName} - ${entry.subjectName} - ${entry.teacherContactNumber || 'N/A'}`);
                  } else {
                    console.log(`Teacher ${entry.teacherId} already exists in map`);
                  }
                } else {
                  console.warn(`Skipping entry ${idx} - missing required fields:`, {
                    hasTeacherId: !!entry.teacherId,
                    hasTeacherName: !!entry.teacherName,
                    hasSubjectName: !!entry.subjectName
                  });
                }
              });

              console.log('Unique teachers found:', Array.from(uniqueTeacherMap.entries()));
              console.log('Total unique teachers:', uniqueTeacherMap.size);

              // Create enquiry contacts directly from timetable data (no need to fetch teacher details separately)
              const teacherContacts = Array.from(uniqueTeacherMap.entries()).map(([teacherId, info]) => ({
                id: teacherId.toString(),
                subject: info.subjectName,
                teacher: info.teacherName,
                phone: info.contactNumber
              }));

              console.log('Final enquiry contacts:', teacherContacts);
              console.log('Total enquiry contacts created:', teacherContacts.length);
              setEnquiryContacts(teacherContacts);
            }
          } catch (timetableError: any) {
            console.error('Error fetching timetable:', timetableError);
            console.error('Error details:', timetableError.message, timetableError.response);
            setTimetable([]);
            setEnquiryContacts([]);
          }
        } else {
          console.error('No class ID available for student!');
          console.error('Student data received:', studentData);
          console.error('Please check if the student has a class assigned in the database');
        }

        // Fetch events from database
        try {
          const eventsData = await EventService.getAllEvents();
          
          // Transform events data to match component format
          const transformedEvents = eventsData.map((event: any) => ({
            id: event.id?.toString() || `e${Math.random()}`,
            startDate: event.startDate || new Date().toISOString().split('T')[0],
            endDate: event.endDate || event.startDate || new Date().toISOString().split('T')[0],
            name: event.title || event.name || 'Event',
            description: event.description || '',
            type: (event.type?.toLowerCase() || 'academic') as 'sports' | 'cultural' | 'academic' | 'meeting'
          }));
          
          setEvents(transformedEvents);
        } catch (eventsError) {
          console.warn('No events data available:', eventsError);
          setEvents([]);
        }

        // Fetch fee catalog for current student
        try {
          const feeCatalogData = await FeeService.getCurrentStudentFeeCatalog();
          setFeeData(feeCatalogData);
        } catch (feeError) {
          console.warn('No fee data available:', feeError);
          setFeeData(null);
        }

        // Fetch attendance data for current student
        try {
          const attendanceRecords = await AttendanceService.getCurrentStudentAttendance();
          setAttendanceData(attendanceRecords || []);
        } catch (attendanceError) {
          console.warn('No attendance data available:', attendanceError);
          setAttendanceData([]);
        }

      } catch (err: any) {
        console.error('Error fetching student data:', err);
        setError(err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
    fetchMyQueries();
    fetchMyLeaveRequests();
    fetchVideoLectures();
  }, []);

  // Fetch video lectures for student's class
  const fetchVideoLectures = async () => {
    try {
      if (student?.currentClass && student?.section) {
        const lectures = await VideoLectureService.getVideoLecturesByClass(
          student.currentClass,
          student.section
        );
        setVideoLectures(lectures || []);
      }
    } catch (err) {
      console.warn('No video lectures available:', err);
      setVideoLectures([]);
    }
  };

  const fetchGalleryImages = async () => {
    try {
      const images = await galleryService.getAllImages();
      setGallery(images.map(img => ({
        id: img.id.toString(),
        title: img.title || 'Untitled',
        imageUrl: img.imageUrl
      })));
    } catch (err) {
      console.warn('No gallery images available:', err);
      setGallery([]);
    }
  };

  // Re-fetch video lectures and gallery when student data is loaded
  useEffect(() => {
    if (student?.currentClass && student?.section) {
      fetchVideoLectures();
    }
    fetchGalleryImages();
  }, [student]);

  // Fetch Transfer Certificate requests
  useEffect(() => {
    const fetchTCRequests = async () => {
      try {
        const requests = await TransferCertificateService.getMyTransferCertificateRequests();
        setTcRequests(requests || []);
      } catch (err) {
        console.warn('No TC requests available:', err);
        setTcRequests([]);
      }
    };
    fetchTCRequests();
  }, []);

  // Handle TC form submission
  const handleSubmitTCRequest = async () => {
    try {
      // Validate required field
      if (!tcFormData.reason || tcFormData.reason.trim() === '') {
        setTcError('Reason is required');
        return;
      }

      setTcLoading(true);
      setTcError(null);
      setTcSuccess(null);

      await TransferCertificateService.requestTransferCertificate(tcFormData);
      
      // Refresh the requests list
      const requests = await TransferCertificateService.getMyTransferCertificateRequests();
      setTcRequests(requests || []);
      
      // Reset form and close modal
      setTcFormData({
        reason: '',
        additionalDetails: '',
        transferDate: '',
        newSchoolName: '',
        newSchoolAddress: ''
      });
      setShowTCForm(false);
      setTcSuccess('Transfer Certificate request submitted successfully!');
      
      // Clear success message after 5 seconds
      setTimeout(() => setTcSuccess(null), 5000);
      
    } catch (err: any) {
      setTcError(err.message || 'Failed to submit TC request');
    } finally {
      setTcLoading(false);
    }
  };

  // Handle TC form field changes
  const handleTCFormChange = (field: keyof TCRequest, value: string) => {
    setTcFormData(prev => ({ ...prev, [field]: value }));
  };

  // Mock student data (COMMENTED OUT - Now using API data)
  // const student = {
  //   name: 'Rahul Kumar',
  //   currentClass: '10th A',
  //   pan: 'PAN123456',
  //   photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&q=80&auto=format&fit=crop',
  //   schoolName: 'Mauritius International School',
  //   schoolLogo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-8IRdKonj2lw5KF7osJq3GRJSOrjKiKck0g&s'
  // };

  // Calculate attendance summary from real data
  const attendance: AttendanceSummary = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) {
      return { present: 0, absent: 0 };
    }
    
    let totalPresent = 0;
    let totalAbsent = 0;
    
    // attendanceData is an array of AttendanceInfoDto objects
    // Each has an 'attendances' array with AttendenceResponse objects
    attendanceData.forEach((attendanceInfo: any) => {
      if (attendanceInfo.attendances && Array.isArray(attendanceInfo.attendances)) {
        attendanceInfo.attendances.forEach((record: any) => {
          if (record.present === true) {
            totalPresent++;
          } else if (record.present === false) {
            totalAbsent++;
          }
        });
      }
    });
    
    console.log('Calculated attendance:', { present: totalPresent, absent: totalAbsent });
    return { present: totalPresent, absent: totalAbsent };
  }, [attendanceData]);

  const holidays: Holiday[] = [
    { id: 'h1', date: '2025-01-26', name: 'Republic Day' },
    { id: 'h2', date: '2025-03-17', name: 'Holi' },
    { id: 'h3', date: '2025-08-15', name: 'Independence Day' },
  ];

  // Mock timetable data (COMMENTED OUT - Now using API data)
  // const timetable: TimetableEntry[] = [
  //   { id: 't1', day: 'Mon', period: 1, start: '08:00', end: '08:45', subject: 'Mathematics', teacher: 'Dr. Verma' },
  //   { id: 't2', day: 'Mon', period: 2, start: '08:50', end: '09:35', subject: 'Science', teacher: 'Mr. Singh' },
  //   { id: 't3', day: 'Mon', period: 3, start: '09:40', end: '10:25', subject: 'English', teacher: 'Ms. Sharma' },
  // ];

  // Mock events data (COMMENTED OUT - Now using API data)
  // const events: EventItem[] = [
  //   { id: 'e1', date: '2025-02-10', name: 'Annual Sports Day', type: 'sports' },
  //   { id: 'e2', date: '2025-03-05', name: 'Cultural Fest', type: 'cultural' },
  // ];

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

  // Mock fee status (COMMENTED OUT - Now using API data from feeData)
  // const feeStatus: FeeStatus = { total: 60000, paid: 55000, pending: 5000, status: 'pending' };

  // Calculate fee status from real data
  const feeStatus: FeeStatus = useMemo(() => {
    if (!feeData) {
      return { total: 0, paid: 0, pending: 0, status: 'pending' as 'paid' | 'pending' | 'overdue' };
    }
    return {
      total: feeData.totalAmount || 0,
      paid: feeData.totalPaid || 0,
      pending: feeData.totalPending || 0,
      status: (feeData.totalPending > 0 ? 'pending' : 'paid') as 'paid' | 'pending' | 'overdue'
    };
  }, [feeData]);

  // Mock attendance (COMMENTED OUT - Now calculated from API data)
  // const attendance: AttendanceSummary = { present: 45, absent: 5 };

  // enquiryNumbers is now replaced by enquiryContacts state (fetched from API based on timetable)

  // Video lectures and gallery are now fetched from backend - removed static data

  const routes: VehicleRoute[] = [
    { id: 'r1', route: 'Route 1 - Sector 21', pickup: '07:10 AM', drop: '02:30 PM', note: 'Expect delay on Mondays' },
    { id: 'r2', route: 'Route 2 - City Center', pickup: '07:25 AM', drop: '02:45 PM' },
  ];

  const previousRecords: PreviousClassRecord[] = [
    {
      id: 'p1',
      classLabel: '9th',
      schoolName: 'Delhi Public School',
      passingYear: '2024',
      percentage: '85%',
      grade: 'A',
      gallery: [
        { id: 'pg1', title: 'Class Photo', imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&q=80&auto=format&fit=crop' },
      ],
      resultUrl: '#',
      certificateUrl: '#',
    },
    {
      id: 'p2',
      classLabel: '8th',
      schoolName: 'Delhi Public School',
      passingYear: '2023',
      percentage: '88%',
      grade: 'A',
      gallery: [
        { id: 'pg2', title: 'Science Project', imageUrl: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400&q=80&auto=format&fit=crop' },
      ],
      resultUrl: '#',
      certificateUrl: '#',
    }
  ];

  const attendancePercent = useMemo(() => {
    const total = attendance.present + attendance.absent;
    return total === 0 ? 0 : Math.round((attendance.present / total) * 100);
  }, [attendance.present, attendance.absent]);

  // Attendance calendar - Use real data from API
  const holidayDates = new Set<string>(holidays.map(h => h.date));
  const formatKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  
  const buildAttendanceSets = () => {
    const present = new Set<string>();
    const absent = new Set<string>();
    
    // Helper function to parse "dd-MM-yyyy HH:mm:ss" format from backend
    const parseBackendDate = (dateStr: string): Date | null => {
      try {
        // Format: "dd-MM-yyyy HH:mm:ss" e.g., "05-10-2025 14:30:00"
        const parts = dateStr.split(' ');
        if (parts.length !== 2) return null;
        
        const dateParts = parts[0].split('-'); // [dd, MM, yyyy]
        if (dateParts.length !== 3) return null;
        
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in JS
        const year = parseInt(dateParts[2], 10);
        
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        
        return new Date(year, month, day);
      } catch (e) {
        console.error('Error parsing date:', dateStr, e);
        return null;
      }
    };
    
    // Process real attendance data from API
    // attendanceData is an array of AttendanceInfoDto objects
    if (attendanceData && attendanceData.length > 0) {
      console.log('Building attendance sets from data:', attendanceData);
      
      attendanceData.forEach((attendanceInfo: any) => {
        if (attendanceInfo.attendances && Array.isArray(attendanceInfo.attendances)) {
          attendanceInfo.attendances.forEach((record: any) => {
            if (record.date) {
              // Parse the date - backend returns format "dd-MM-yyyy HH:mm:ss"
              const dateObj = parseBackendDate(record.date);
              
              if (dateObj && !isNaN(dateObj.getTime())) {
                const dateStr = formatKey(dateObj);
                
                // Check if student was present
                if (record.present === true) {
                  present.add(dateStr);
                  console.log('Added present date:', record.date, '→', dateStr);
                } else if (record.present === false) {
                  absent.add(dateStr);
                  console.log('Added absent date:', record.date, '→', dateStr);
                }
              } else {
                console.warn('Failed to parse date:', record.date);
              }
            }
          });
        }
      });
      
      console.log('Present dates:', Array.from(present));
      console.log('Absent dates:', Array.from(absent));
    }
    
    return { present, absent };
  };
  const { present: presentDates, absent: absentDates } = buildAttendanceSets();

  const buildWeeks = (year: number, monthIndexZeroBased: number) => {
    const firstDay = new Date(year, monthIndexZeroBased, 1);
    const lastDay = new Date(year, monthIndexZeroBased + 1, 0);
    const daysInMonth = lastDay.getDate();
    // Sunday-first calendar: Sun=0 ... Sat=6
    const startWeekdaySundayFirst = firstDay.getDay();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < startWeekdaySundayFirst; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, monthIndexZeroBased, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: Array<Array<Date | null>> = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  };

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim() || !selectedQueryTeacher) {
      alert('Please select a teacher and enter your question.');
      return;
    }
    
    try {
      await QueryService.raiseStudentQuery({
        teacherId: selectedQueryTeacher,
        subject: querySubject,
        content: queryText
      });
      alert('Query sent successfully to the teacher!');
      setQueryText('');
      // Refresh queries list
      fetchMyQueries();
    } catch (error: any) {
      alert('Failed to send query: ' + error.message);
    }
  };

  const handleLeaveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLeaveImage(file);
  };

  const handleSubmitLeave = async () => {
    if (!leaveSubject.trim() || !leaveStartDate || !leaveEndDate) {
      alert('Please fill in all fields: reason, start date, and end date.');
      return;
    }

    try {
      await LeaveService.createStudentLeaveRequest({
        startDate: leaveStartDate,
        endDate: leaveEndDate,
        reason: leaveSubject
      });
      alert('Leave request submitted successfully to your class teacher!');
      setLeaveSubject('');
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveImage(null);
      // Refresh leave requests list
      fetchMyLeaveRequests();
    } catch (error: any) {
      alert('Failed to submit leave request: ' + error.message);
    }
  };

  // Fetch student's own queries
  const fetchMyQueries = async () => {
    try {
      const queries = await QueryService.getMyStudentQueries();
      setMyQueries(queries);
    } catch (error: any) {
      console.error('Error fetching queries:', error);
    }
  };

  // Fetch student's own leave requests
  const fetchMyLeaveRequests = async () => {
    try {
      const leaves = await LeaveService.getMyStudentLeaves();
      setMyLeaveRequests(leaves);
    } catch (error: any) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const SectionHeader: React.FC<{ icon: string; title: string; }> = ({ icon, title }) => (
    <h2><span className="section-icon">{icon}</span>{title}</h2>
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setShowSidebar(true)}>
              <span className="menu-icon">☰</span>
            </button>
            <div className="school-info">
              <div className="school-logo">
                <img src={student?.schoolLogo || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-8IRdKonj2lw5KF7osJq3GRJSOrjKiKck0g&s'} alt="School logo" />
              </div>
              <div>
                <h1 className="school-name">{student?.schoolName || 'Mauritius International School'}</h1>
                <p className="school-motto">Learn • Lead • Succeed</p>
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="notification-wrapper">
              <button 
                className={`notification-button ${showNotifications ? 'open' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
              >
                <span className="notification-icon">🔔</span>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <h3>Notifications ({unreadCount} unread)</h3>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {unreadCount > 0 && (
                          <button 
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
                        <button className="close-notifications" onClick={() => setShowNotifications(false)}>×</button>
                      </div>
                    </div>
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <div className="no-notifications" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                        <span style={{ fontSize: '3rem' }}>📭</span>
                        <p style={{ marginTop: '1rem' }}>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className="notification-item"
                          onClick={() => !notification.isRead && notification.id && markNotificationAsRead(notification.id)}
                          style={{
                            cursor: notification.isRead ? 'default' : 'pointer',
                            background: notification.isRead ? '#f9fafb' : 'white',
                            borderLeft: `4px solid ${
                              notification.priority === 'HIGH' ? '#ef4444' :
                              notification.priority === 'MEDIUM' ? '#f59e0b' : '#10b981'
                            }`,
                            padding: '1rem',
                            marginBottom: '0.5rem',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                            <div style={{ fontSize: '1.5rem' }}>
                              {notification.priority === 'HIGH' && '🔴'}
                              {notification.priority === 'MEDIUM' && '🟡'}
                              {notification.priority === 'LOW' && '🟢'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                                {notification.title}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                                {notification.message}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af' }}>
                                <span>{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A'}</span>
                                {notification.senderName && (
                                  <span style={{ color: '#6b7280' }}>From: {notification.senderName}</span>
                                )}
                              </div>
                            </div>
                            {!notification.isRead && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#3b82f6',
                                flexShrink: 0
                              }} />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="student-profile">
              <div className="student-photo">
                <img src={student?.photo || 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&q=80&auto=format&fit=crop'} alt="Student" />
              </div>
              <div className="student-info">
                <h2>{student?.name || 'Student'}</h2>
                <p>Class: {student?.currentClass || 'N/A'} • PAN: {student?.pan || 'N/A'}</p>
              </div>
            </div>
            <button className="logout-button" onClick={onLogout}>⎋ Logout</button>
          </div>
        </div>
      </header>

      <nav className="tab-navigation">
        <button className={`tab-button ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Home</span>
        </button>
        <button className={`tab-button ${activeTab === 'timetable' ? 'active' : ''}`} onClick={() => setActiveTab('timetable')}>
          <span className="tab-icon">📅</span>
          <span className="tab-label">Timetable</span>
        </button>
        <button className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
          <span className="tab-icon">🗓️</span>
          <span className="tab-label">Attendance</span>
        </button>
        <button className={`tab-button ${activeTab === 'holidays' ? 'active' : ''}`} onClick={() => setActiveTab('holidays')}>
          <span className="tab-icon">🎉</span>
          <span className="tab-label">Holidays</span>
        </button>
        <button className={`tab-button ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <span className="tab-icon">🎈</span>
          <span className="tab-label">Events</span>
        </button>
        <button className={`tab-button ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
          <span className="tab-icon">📊</span>
          <span className="tab-label">Results</span>
        </button>
        <button className={`tab-button ${activeTab === 'fees' ? 'active' : ''}`} onClick={() => setActiveTab('fees')}>
          <span className="tab-icon">💳</span>
          <span className="tab-label">Fees</span>
        </button>
        <button className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
          <span className="tab-icon">🖼️</span>
          <span className="tab-label">Gallery</span>
        </button>
        <button className={`tab-button ${activeTab === 'lectures' ? 'active' : ''}`} onClick={() => setActiveTab('lectures')}>
          <span className="tab-icon">🎥</span>
          <span className="tab-label">Lectures</span>
        </button>
        <button className={`tab-button ${activeTab === 'queries' ? 'active' : ''}`} onClick={() => setActiveTab('queries')}>
          <span className="tab-icon">❓</span>
          <span className="tab-label">Ask Query</span>
        </button>
        <button className={`tab-button ${activeTab === 'enquiry' ? 'active' : ''}`} onClick={() => setActiveTab('enquiry')}>
          <span className="tab-icon">📞</span>
          <span className="tab-label">Enquiry</span>
        </button>
        <button className={`tab-button ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')}>
          <span className="tab-icon">📝</span>
          <span className="tab-label">Leave</span>
        </button>
        <button className={`tab-button ${activeTab === 'transport' ? 'active' : ''}`} onClick={() => setActiveTab('transport')}>
          <span className="tab-icon">🚌</span>
          <span className="tab-label">Transport</span>
        </button>
        <button className={`tab-button ${activeTab === 'tc' ? 'active' : ''}`} onClick={() => setActiveTab('tc')}>
          <span className="tab-icon">📋</span>
          <span className="tab-label">TC Request</span>
        </button>
        <button className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <span className="tab-icon">📚</span>
          <span className="tab-label">Previous Schooling</span>
        </button>
      </nav>

      <div className={`dashboard-sidebar ${showSidebar ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Menu</h3>
          <button className="close-sidebar" onClick={() => setShowSidebar(false)}>×</button>
        </div>
        <ul>
          <li className={activeTab === 'home' ? 'active' : ''} onClick={() => { setActiveTab('home'); setShowSidebar(false); }}>
            <span className="sidebar-icon">🏠</span><span className="sidebar-label">Home</span>
          </li>
          <li className={activeTab === 'timetable' ? 'active' : ''} onClick={() => { setActiveTab('timetable'); setShowSidebar(false); }}>
            <span className="sidebar-icon">📅</span><span className="sidebar-label">Timetable</span>
          </li>
          <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => { setActiveTab('attendance'); setShowSidebar(false); }}>
            <span className="sidebar-icon">🗓️</span><span className="sidebar-label">Attendance</span>
          </li>
          <li className={activeTab === 'holidays' ? 'active' : ''} onClick={() => { setActiveTab('holidays'); setShowSidebar(false); }}>
            <span className="sidebar-icon">🎉</span><span className="sidebar-label">Holidays</span>
          </li>
          <li className={activeTab === 'events' ? 'active' : ''} onClick={() => { setActiveTab('events'); setShowSidebar(false); }}>
            <span className="sidebar-icon">🎈</span><span className="sidebar-label">Events</span>
          </li>
          <li className={activeTab === 'results' ? 'active' : ''} onClick={() => { setActiveTab('results'); setShowSidebar(false); }}>
            <span className="sidebar-icon">📊</span><span className="sidebar-label">Results</span>
          </li>
          <li className={activeTab === 'fees' ? 'active' : ''} onClick={() => { setActiveTab('fees'); setShowSidebar(false); }}>
            <span className="sidebar-icon">💳</span><span className="sidebar-label">Fees</span>
          </li>
          <li className={activeTab === 'gallery' ? 'active' : ''} onClick={() => { setActiveTab('gallery'); setShowSidebar(false); }}>
            <span className="sidebar-icon">🖼️</span><span className="sidebar-label">Gallery</span>
          </li>
          <li className={activeTab === 'queries' ? 'active' : ''} onClick={() => { setActiveTab('queries'); setShowSidebar(false); }}>
            <span className="sidebar-icon">❓</span><span className="sidebar-label">Ask Query</span>
          </li>
          <li className={activeTab === 'enquiry' ? 'active' : ''} onClick={() => { setActiveTab('enquiry'); setShowSidebar(false); }}>
            <span className="sidebar-icon">📞</span><span className="sidebar-label">Enquiry</span>
          </li>
          <li className={activeTab === 'lectures' ? 'active' : ''} onClick={() => { setActiveTab('lectures'); setShowSidebar(false); }}>
            <span className="sidebar-icon">🎥</span><span className="sidebar-label">Lectures</span>
          </li>
          <li className={activeTab === 'leave' ? 'active' : ''} onClick={() => { setActiveTab('leave'); setShowSidebar(false); }}>
            <span className="sidebar-icon">📝</span><span className="sidebar-label">Leave Request</span>
          </li>
          <li className={activeTab === 'transport' ? 'active' : ''} onClick={() => { setActiveTab('transport'); setShowSidebar(false); }}>
            <span className="sidebar-icon">🚌</span><span className="sidebar-label">Transport</span>
          </li>
          <li className={activeTab === 'tc' ? 'active' : ''} onClick={() => { setActiveTab('tc'); setShowSidebar(false); }}>
            <span className="sidebar-icon">📋</span><span className="sidebar-label">Transfer Certificate</span>
          </li>
          <li className={activeTab === 'history' ? 'active' : ''} onClick={() => { setActiveTab('history'); setShowSidebar(false); }}>
            <span className="sidebar-icon">📚</span><span className="sidebar-label">Previous Schooling</span>
          </li>
        </ul>
      </div>
      <div className={`sidebar-overlay ${showSidebar ? 'show' : ''}`} onClick={() => setShowSidebar(false)} />

      <main className="main-content">
        {/* Loading State */}
        {loading && (
          <section className="profile-section">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}>Loading...</div>
              <p>Loading student information...</p>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && !loading && (
          <section className="profile-section">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#dc2626' }}>
              <h3>⚠️ Error Loading Data</h3>
              <p>{error}</p>
              <button 
                className="submit-btn" 
                style={{ marginTop: '1rem' }}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </section>
        )}

        {/* Student Profile - Home Tab */}
        {!loading && !error && student && activeTab === 'home' && (
          <section className="profile-section" style={{marginBottom: '0'}}>
            <SectionHeader icon="👤" title="Student Profile" />
            <div className="profile-info">
              <img className="profile-photo" src={student.photo} alt="Student" />
              <div className="profile-details">
                <p><strong>Name:</strong> {student.name}</p>
                <p><strong>Current Class:</strong> {student.currentClass} - Section {student.section}</p>
                <p><strong>PAN:</strong> {student.pan}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'enquiry' && (
          <section className="query-section">
            <SectionHeader icon="📞" title="Teacher Contacts" />
            {loading ? (
              <div className="loading-message" style={{textAlign: 'center', padding: '2rem'}}>Loading teacher contacts...</div>
            ) : enquiryContacts.length === 0 ? (
              <div className="no-data-message" style={{textAlign: 'center', padding: '2rem'}}>
                <p>No teacher contact information available.</p>
                <p>Teacher contacts will appear here once your timetable is assigned.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {enquiryContacts.map(c => (
                  <div key={c.id} style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: c.isClassTeacher ? '#f0fdf4' : '#fff',
                    borderLeft: c.isClassTeacher ? '4px solid #10b981' : '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '1.1rem', color: '#1f2937' }}>{c.subject}</strong>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280' }}>{c.teacher}</p>
                      </div>
                      {c.isClassTeacher && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          fontWeight: '500'
                        }}>
                          Class Teacher
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'lectures' && (
          <section className="events-section">
            <SectionHeader icon="🎥" title="Live Class & Video Lectures" />
            {loading ? (
              <div className="loading-message" style={{textAlign: 'center', padding: '2rem'}}>
                Loading video lectures...
              </div>
            ) : videoLectures.length === 0 ? (
              <div className="no-data-message" style={{textAlign: 'center', padding: '2rem'}}>
                <p>📹 No video lectures available yet.</p>
                <p style={{fontSize: '0.9rem', color: '#666'}}>
                  Video lectures uploaded by your teachers will appear here.
                </p>
              </div>
            ) : (
              <div className="events-container">
                {videoLectures.map(v => {
                  const thumbnailUrl = VideoLectureService.getYouTubeThumbnail(v.youtubeLink);
                  const embedUrl = VideoLectureService.getYouTubeEmbedUrl(v.youtubeLink);
                  
                  return (
                    <div key={v.id} className="event-card academic" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}>
                      {/* Thumbnail */}
                      <div style={{
                        width: '100%',
                        height: '160px',
                        backgroundImage: `url(${thumbnailUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '8px 8px 0 0',
                        marginBottom: '0.75rem',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: '3rem',
                          color: 'white',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                          cursor: 'pointer'
                        }}>
                          ▶️
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="event-name" style={{fontSize: '1.1rem', fontWeight: '600'}}>
                        {v.title}
                      </div>
                      <div className="event-date" style={{marginTop: '0.5rem'}}>
                        📚 {v.subject}
                      </div>
                      {v.topic && (
                        <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.25rem'}}>
                          Topic: {v.topic}
                        </div>
                      )}
                      {v.teacherName && (
                        <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.25rem'}}>
                          👨‍🏫 {v.teacherName}
                        </div>
                      )}
                      {v.duration && (
                        <div style={{fontSize: '0.85rem', color: '#666', marginTop: '0.25rem'}}>
                          ⏱️ {v.duration}
                        </div>
                      )}
                      
                      <button 
                        className="submit-btn" 
                        style={{marginTop: 'auto', width: '100%'}}
                        onClick={() => window.open(embedUrl, '_blank')}
                      >
                        ▶️ Watch Video
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Timetable Tab - Using API Data */}
        {!loading && !error && activeTab === 'timetable' && (() => {
          const weekDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
          const periods = [1, 2, 3, 4, 'LUNCH', 5, 6, 7, 8];
          const periodTimes = [
            '08:00 - 09:00',
            '09:00 - 10:00',
            '10:00 - 11:00',
            '11:00 - 12:00',
            '12:00 - 01:00',
            '01:00 - 02:00',
            '02:00 - 03:00',
            '03:00 - 04:00',
            '04:00 - 05:00'
          ];

          // Organize timetable data by day and period
          const timetableGrid: {[key: string]: {[key: number]: any}} = {};
          weekDays.forEach(day => {
            timetableGrid[day] = {};
          });

          timetable.forEach(tt => {
            const day = tt.day.toUpperCase();
            if (timetableGrid[day]) {
              timetableGrid[day][tt.period] = tt;
            }
          });

          // Get unique teachers with their subjects
          const teacherSubjectMap = new Map<string, Set<string>>();
          timetable.forEach(tt => {
            if (!teacherSubjectMap.has(tt.teacher)) {
              teacherSubjectMap.set(tt.teacher, new Set());
            }
            teacherSubjectMap.get(tt.teacher)?.add(tt.subject);
          });

          return (
            <section className="profile-section">
              <SectionHeader icon="📅" title="Weekly Class Timetable" />
              {timetable.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  <p>No timetable available for your class yet.</p>
                  <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Please contact your administrator.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    marginBottom: '2rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                        <th style={{ 
                          padding: '1rem', 
                          border: '1px solid #ddd',
                          fontWeight: '600',
                          textAlign: 'center',
                          minWidth: '120px'
                        }}>Day / Period</th>
                        {periods.map((period, idx) => (
                          <th key={idx} style={{ 
                            padding: '1rem', 
                            border: '1px solid #ddd',
                            fontWeight: '600',
                            textAlign: 'center',
                            backgroundColor: period === 'LUNCH' ? '#fbbf24' : period === 8 ? '#8b5cf6' : '#3b82f6',
                            minWidth: '140px'
                          }}>
                            <div>{period === 'LUNCH' ? 'LUNCH' : `Period ${period}`}</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: '400', marginTop: '0.25rem' }}>
                              {periodTimes[idx]}
                            </div>
                            {period === 8 && (
                              <div style={{ fontSize: '0.75rem', fontWeight: '500', marginTop: '0.25rem' }}>
                                (Diary Period)
                              </div>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weekDays.map((day, dayIdx) => (
                        <tr key={day} style={{ 
                          backgroundColor: dayIdx % 2 === 0 ? '#f9fafb' : 'white' 
                        }}>
                          <td style={{ 
                            padding: '1rem', 
                            border: '1px solid #ddd',
                            fontWeight: '600',
                            backgroundColor: '#e5e7eb',
                            textAlign: 'center'
                          }}>
                            {day}
                          </td>
                          {periods.map((period, periodIdx) => {
                            if (period === 'LUNCH') {
                              return (
                                <td key={periodIdx} style={{ 
                                  padding: '1rem', 
                                  border: '1px solid #ddd',
                                  backgroundColor: '#fef3c7',
                                  textAlign: 'center',
                                  fontWeight: '600',
                                  color: '#92400e'
                                }}>
                                  🍽️ LUNCH BREAK
                                </td>
                              );
                            }
                            
                            const slot = timetableGrid[day][period as number];
                            return (
                              <td key={periodIdx} style={{ 
                                padding: '0.75rem', 
                                border: '1px solid #ddd',
                                textAlign: 'center',
                                backgroundColor: period === 8 ? '#f3e8ff' : 'inherit',
                                verticalAlign: 'middle'
                              }}>
                                {slot ? (
                                  <div>
                                    <div style={{ 
                                      fontWeight: '600', 
                                      color: '#1f2937',
                                      marginBottom: '0.25rem'
                                    }}>
                                      {slot.subject}
                                    </div>
                                    <div style={{ 
                                      fontSize: '0.85rem', 
                                      color: '#6b7280'
                                    }}>
                                      {slot.teacher}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Teacher Legend */}
                  <div style={{ 
                    marginTop: '1.5rem',
                    padding: '1.5rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <h3 style={{ 
                      marginBottom: '1rem', 
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: '#1f2937'
                    }}>
                      📚 Teachers & Subjects
                    </h3>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                      gap: '1rem'
                    }}>
                      {Array.from(teacherSubjectMap.entries()).map(([teacher, subjects]) => (
                        <div key={teacher} style={{ 
                          padding: '0.75rem 1rem',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{ 
                            fontWeight: '600', 
                            color: '#3b82f6',
                            marginBottom: '0.5rem'
                          }}>
                            👨‍🏫 {teacher}
                          </div>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            color: '#6b7280'
                          }}>
                            {Array.from(subjects).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legend for special periods */}
                  <div style={{ 
                    marginTop: '1rem',
                    display: 'flex',
                    gap: '1.5rem',
                    flexWrap: 'wrap',
                    padding: '1rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fbbf24',
                        borderRadius: '4px'
                      }}></div>
                      <span style={{ fontSize: '0.9rem' }}>Lunch Break</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: '#f3e8ff',
                        border: '1px solid #8b5cf6',
                        borderRadius: '4px'
                      }}></div>
                      <span style={{ fontSize: '0.9rem' }}>Diary Period (Period 8)</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })()}

        {activeTab === 'attendance' && (() => {
          const now = new Date();
          const year = now.getFullYear();
          const monthIndex = now.getMonth();
          const monthName = now.toLocaleString('default', { month: 'long' });
          const weeks = buildWeeks(year, monthIndex);
          const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
          const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
          return (
            <section className="attendance-section">
              <SectionHeader icon="🗓️" title={`Attendance — ${monthName} ${year}`} />
              <div className="calendar">
                <table className="calendar-table" aria-label="Attendance calendar">
                  <thead>
                    <tr>
                      {dayNames.map((dn) => (
                        <th key={dn}>{dn}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, wi) => (
                      <tr key={wi}>
                        {week.map((date, di) => {
                          if (!date) return <td key={`${wi}-${di}`} className="empty" />;
                          const dateStr = formatDate(date);
                          const status = holidayDates.has(dateStr)
                            ? 'holiday'
                            : presentDates.has(dateStr)
                            ? 'present'
                            : absentDates.has(dateStr)
                            ? 'absent'
                            : '';
                          return (
                            <td key={`${wi}-${di}`} className={status}>
                              <span className="cal-date">{date.getDate()}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="calendar-legend">
                  <span className="legend-item present">Present</span>
                  <span className="legend-item absent">Absent</span>
                  <span className="legend-item holiday">Holiday</span>
                </div>
              </div>
              
              {/* Attendance Summary Cards */}
              <div className="attendance-stats" style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginTop: '1.5rem',
                flexWrap: 'wrap'
              }}>
                <div className="attendance-stat-card" style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{attendance.present}</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', opacity: 0.9 }}>Days Present</div>
                </div>
                
                <div className="attendance-stat-card" style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{attendance.absent}</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', opacity: 0.9 }}>Days Absent</div>
                </div>
                
                <div className="attendance-stat-card" style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{attendancePercent}%</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', opacity: 0.9 }}>Attendance Rate</div>
                </div>
                
                <div className="attendance-stat-card" style={{
                  flex: '1',
                  minWidth: '150px',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  textAlign: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{attendance.present + attendance.absent}</div>
                  <div style={{ fontSize: '0.9rem', marginTop: '0.25rem', opacity: 0.9 }}>Total Days</div>
                </div>
              </div>
            </section>
          );
        })()}

        {activeTab === 'holidays' && (
          <section className="holidays-section">
            <SectionHeader icon="🎉" title="Holiday List" />
            <table className="holidays-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Name</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(h => (
                  <tr key={h.id}>
                    <td>{h.date}</td>
                    <td>{h.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* Events Tab - Using API Data */}
        {!loading && !error && activeTab === 'events' && (
          <section className="events-section">
            <SectionHeader icon="🎈" title="Upcoming Events and Activities" />
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p>No upcoming events scheduled at the moment.</p>
                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Check back later for updates!</p>
              </div>
            ) : (
              <div className="events-container">
                {events.map(ev => (
                  <div key={ev.id} className={`event-card ${ev.type}`}>
                    <div className="event-date">
                      <strong>Start:</strong> {new Date(ev.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      <br />
                      <strong>End:</strong> {new Date(ev.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="event-name">{ev.name}</div>
                    <span className="event-type">{ev.type.charAt(0).toUpperCase() + ev.type.slice(1)}</span>
                    {ev.description && (
                      <div style={{ marginTop: 10, fontSize: '0.9rem', color: '#555', lineHeight: '1.5' }}>
                        {ev.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'results' && (
          <section className="results-section">
            <SectionHeader icon="📊" title="Academic Results" />
            
            {/* Fetch Results Button */}
            {!studentResults && !resultsLoading && student?.pan && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                  View your complete academic performance across all exams
                </p>
                <button 
                  className="download-btn"
                  onClick={async () => {
                    setResultsLoading(true);
                    try {
                      const results = await resultService.getStudentAllResults(student.pan);
                      setStudentResults(results);
                    } catch (err) {
                      console.error('Error fetching results:', err);
                      alert('Failed to load results. Please try again.');
                    } finally {
                      setResultsLoading(false);
                    }
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem'
                  }}
                >
                  📈 Load My Results
                </button>
              </div>
            )}

            {/* Loading State */}
            {resultsLoading && (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <p>Loading your results...</p>
              </div>
            )}

            {/* Results Display */}
            {studentResults && !resultsLoading && (
              <div>
                {/* Student Info Summary */}
                <div style={{
                  backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    {studentResults.studentName}
                  </h3>
                  <p style={{ margin: '0', opacity: 0.9 }}>
                    {studentResults.className} - Section {studentResults.section}
                  </p>
                </div>

                {/* Exam Results */}
                {studentResults.examResults && studentResults.examResults.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {studentResults.examResults.map((examResult, index) => (
                      <div key={index} className="result-card" style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}>
                        {/* Exam Header */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '1rem',
                          paddingBottom: '1rem',
                          borderBottom: '2px solid #f3f4f6'
                        }}>
                          <div>
                            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1f2937' }}>
                              {examResult.examName}
                            </h3>
                            {examResult.examDate && (
                              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
                                📅 {new Date(examResult.examDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '2rem',
                              fontWeight: '700',
                              color: examResult.percentage >= 90 ? '#10b981' : 
                                     examResult.percentage >= 75 ? '#3b82f6' :
                                     examResult.percentage >= 60 ? '#f59e0b' : '#ef4444'
                            }}>
                              {examResult.percentage.toFixed(1)}%
                            </div>
                            <div style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              backgroundColor: examResult.overallGrade === 'A+' || examResult.overallGrade === 'A' ? '#d1fae5' :
                                             examResult.overallGrade === 'B+' || examResult.overallGrade === 'B' ? '#dbeafe' :
                                             examResult.overallGrade === 'C' ? '#fef3c7' : '#fee2e2',
                              color: examResult.overallGrade === 'A+' || examResult.overallGrade === 'A' ? '#065f46' :
                                     examResult.overallGrade === 'B+' || examResult.overallGrade === 'B' ? '#1e40af' :
                                     examResult.overallGrade === 'C' ? '#92400e' : '#991b1b',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              marginTop: '0.5rem'
                            }}>
                              Grade: {examResult.overallGrade}
                            </div>
                          </div>
                        </div>

                        {/* Subject-wise Marks Table */}
                        <table className="results-table" style={{
                          width: '100%',
                          borderCollapse: 'collapse'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', borderBottom: '2px solid #e5e7eb' }}>Subject</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', borderBottom: '2px solid #e5e7eb' }}>Marks Obtained</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', borderBottom: '2px solid #e5e7eb' }}>Total Marks</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', borderBottom: '2px solid #e5e7eb' }}>Percentage</th>
                              <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', borderBottom: '2px solid #e5e7eb' }}>Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examResult.subjectScores && examResult.subjectScores.map((subjectScore, subIndex) => (
                              <tr key={subIndex} style={{ 
                                backgroundColor: subIndex % 2 === 0 ? 'white' : '#f9fafb',
                                borderBottom: '1px solid #e5e7eb'
                              }}>
                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                                  {subjectScore.subjectName}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {subjectScore.marks}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {subjectScore.maxMarks}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {((subjectScore.marks / subjectScore.maxMarks) * 100).toFixed(1)}%
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '6px',
                                    backgroundColor: subjectScore.grade === 'A+' || subjectScore.grade === 'A' ? '#d1fae5' :
                                                   subjectScore.grade === 'B+' || subjectScore.grade === 'B' ? '#dbeafe' :
                                                   subjectScore.grade === 'C' ? '#fef3c7' : '#fee2e2',
                                    color: subjectScore.grade === 'A+' || subjectScore.grade === 'A' ? '#065f46' :
                                           subjectScore.grade === 'B+' || subjectScore.grade === 'B' ? '#1e40af' :
                                           subjectScore.grade === 'C' ? '#92400e' : '#991b1b',
                                    fontWeight: '600',
                                    fontSize: '0.85rem'
                                  }}>
                                    {subjectScore.grade}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Total Summary */}
                        <div style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '1rem'
                        }}>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                              Total Obtained
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                              {examResult.obtainedMarks}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                              Total Marks
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
                              {examResult.totalMarks}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                              Percentage
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
                              {examResult.percentage.toFixed(2)}%
                            </div>
                          </div>
                        </div>

                        {/* Download Button */}
                        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                          <button 
                            className="download-btn"
                            onClick={() => {
                              // In real implementation, generate PDF
                              alert(`Downloading result for ${examResult.examName}...`);
                            }}
                            style={{
                              backgroundColor: '#10b981',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            📄 Download PDF
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Overall Summary Card */}
                    <div style={{
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      backgroundColor: '#eff6ff'
                    }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>
                        📈 Overall Performance Summary
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            Total Exams
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                            {studentResults.examResults.length}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            Average Percentage
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                            {(studentResults.examResults.reduce((sum, exam) => sum + exam.percentage, 0) / 
                              studentResults.examResults.length).toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            Best Performance
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                            {Math.max(...studentResults.examResults.map(e => e.percentage)).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px dashed #d1d5db'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <p style={{ color: '#6b7280', margin: 0 }}>
                      No exam results available yet. Results will appear here once published by your teachers.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab === 'fees' && (
          <section className="fees-section">
            <SectionHeader icon="💳" title="Fees and Status" />
            
            {!feeData ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <p>No fee information available at the moment.</p>
              </div>
            ) : (
              <>
                <div className="fees-info">
                  <p><strong>Total Fees:</strong> ₹{feeStatus.total.toLocaleString('en-IN')}</p>
                  <p><strong>Amount Paid:</strong> ₹{feeStatus.paid.toLocaleString('en-IN')}</p>
                  <p><strong>Amount Pending:</strong> ₹{feeStatus.pending.toLocaleString('en-IN')}</p>
                  <p><strong>Overdue Amount:</strong> ₹{(feeData.totalOverdue || 0).toLocaleString('en-IN')}</p>
                  <p><strong>Payment Status:</strong> <span style={{ 
                    color: feeStatus.status === 'paid' ? 'green' : feeStatus.status === 'overdue' ? 'red' : 'orange',
                    fontWeight: 'bold',
                    textTransform: 'capitalize'
                  }}>{feeStatus.status}</span></p>
                </div>

                {feeData.monthlyFees && feeData.monthlyFees.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Monthly Fee Details</h3>
                    <table className="results-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Year</th>
                          <th>Amount</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th>Payment Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeData.monthlyFees.map((fee: any, index: number) => (
                          <tr key={index}>
                            <td>{fee.month}</td>
                            <td>{fee.year}</td>
                            <td>₹{(fee.amount || 0).toLocaleString('en-IN')}</td>
                            <td>{fee.dueDate || 'N/A'}</td>
                            <td>
                              <span style={{ 
                                color: fee.status === 'PAID' ? 'green' : fee.status === 'OVERDUE' ? 'red' : 'orange',
                                fontWeight: 'bold'
                              }}>
                                {fee.status || 'PENDING'}
                              </span>
                            </td>
                            <td>{fee.paymentDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === 'gallery' && (
          <section className="gallery-section">
            <SectionHeader icon="🖼️" title="Gallery" />
            <div className="gallery-container">
              {gallery.map(img => (
                <div key={img.id} className="gallery-card">
                  <div className="gallery-image-container">
                    <img className="gallery-image" src={img.imageUrl} alt={img.title} />
                  </div>
                  <div className="gallery-title">{img.title}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'transport' && (
          <section className="attendance-section">
            <SectionHeader icon="🚌" title="Vehicle Route Timing" />
            <div className="fees-info">
              {routes.map(r => (
                <p key={r.id}><strong>{r.route}:</strong> Pickup {r.pickup} • Drop {r.drop} {r.note ? `• ${r.note}` : ''}</p>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'queries' && (
          <section className="query-section">
            <SectionHeader icon="❓" title="Ask Query" />
            <form className="query-form" onSubmit={handleSubmitQuery}>
              <div className="form-group">
                <label>Select Teacher & Subject</label>
                <select 
                  value={selectedQueryTeacher || ''} 
                  onChange={(e) => {
                    const selected = enquiryContacts.find(c => c.id === e.target.value);
                    setSelectedQueryTeacher(selected ? Number(selected.id) : null);
                    setQuerySubject(selected?.subject || '');
                  }}
                >
                  <option value="">Select a teacher...</option>
                  {enquiryContacts.map(c => (
                    <option key={c.id} value={c.id}>{c.subject} — {c.teacher}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Your Question</label>
                <textarea value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Type your subject-related question here..." />
              </div>
              <button className="submit-btn" type="submit">Send Query</button>
            </form>

            {/* Display submitted queries */}
            {myQueries.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>My Queries</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {myQueries.map((query) => (
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
                      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        To: {query.teacherName}
                      </p>
                      <p style={{ marginBottom: '0.5rem' }}><strong>Question:</strong> {query.content}</p>
                      {query.response && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                          <p><strong>Teacher's Response:</strong></p>
                          <p style={{ marginTop: '0.25rem' }}>{query.response}</p>
                          {query.respondedAt && (
                            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                              Responded on: {new Date(query.respondedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Sent on: {query.createdAt ? new Date(query.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'leave' && (
          <section className="query-section">
            <SectionHeader icon="📝" title="Leave Request" />
            <div className="query-form">
              <div className="form-group">
                <label>Reason</label>
                <input 
                  type="text"
                  placeholder="Reason (e.g., Medical, Family)"
                  value={leaveSubject}
                  onChange={(e) => setLeaveSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input 
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  min={leaveStartDate}
                />
              </div>
              <div className="form-group">
                <label>Upload supporting image (optional)</label>
                <input type="file" accept="image/*" onChange={handleLeaveUpload} />
                {leaveImage && <p style={{ marginTop: 8, color: '#555' }}>Selected: {leaveImage.name}</p>}
              </div>
              <button 
                className="tc-btn" 
                onClick={handleSubmitLeave}
                type="button"
                disabled={!leaveSubject || !leaveStartDate || !leaveEndDate}
              >
                Submit Leave Request
              </button>
            </div>

            {/* Display submitted leave requests */}
            {myLeaveRequests.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>My Leave Requests</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {myLeaveRequests.map((leave) => (
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
                          backgroundColor: leave.status === 'PENDING' ? '#fef3c7' : leave.status === 'APPROVED' ? '#d1fae5' : leave.status === 'REJECTED' ? '#fee2e2' : '#e5e7eb',
                          color: leave.status === 'PENDING' ? '#92400e' : leave.status === 'APPROVED' ? '#065f46' : leave.status === 'REJECTED' ? '#991b1b' : '#1f2937'
                        }}>
                          {leave.status}
                        </span>
                      </div>
                      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        Class Teacher: {leave.classTeacherName || 'Not assigned'}
                      </p>
                      <p><strong>Duration:</strong> {leave.startDate} to {leave.endDate} ({leave.daysRequested} days)</p>
                      {leave.classTeacherResponse && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                          <p><strong>Teacher's Response:</strong></p>
                          <p style={{ marginTop: '0.25rem' }}>{leave.classTeacherResponse}</p>
                        </div>
                      )}
                      <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Submitted on: {leave.createdAt ? new Date(leave.createdAt).toLocaleString() : 'N/A'}
                      </p>
                      {leave.processedAt && (
                        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          Processed on: {new Date(leave.processedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'tc' && (
          <section className="transfer-section">
            <SectionHeader icon="📋" title="Transfer Certificate" />
            
            {/* Success/Error Messages */}
            {tcSuccess && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#d4edda',
                color: '#155724',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #c3e6cb'
              }}>
                {tcSuccess}
              </div>
            )}
            
            {tcError && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid #f5c6cb'
              }}>
                {tcError}
              </div>
            )}

            <div className="transfer-info">
              <p>You can apply for a Transfer Certificate. Your request will be sent to the Principal for approval.</p>
              <ul>
                <li>Make sure your fees are cleared.</li>
                <li>Provide a valid reason for the transfer.</li>
                <li>Once submitted, you can track the status of your request below.</li>
              </ul>
              <button 
                className="tc-btn" 
                onClick={() => setShowTCForm(true)}
                disabled={tcLoading}
              >
                {tcLoading ? 'Processing...' : 'Request Transfer Certificate'}
              </button>
            </div>

            {/* TC Request Form Modal */}
            {showTCForm && (
              <div className="tc-modal-overlay">
                <div className="tc-modal-content">
                  <h2 className="tc-modal-title">📋 Transfer Certificate Request</h2>
                  
                  {tcError && (
                    <div className="tc-error-message">{tcError}</div>
                  )}
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitTCRequest();
                  }}>
                    <div className="tc-form-group">
                      <label className="tc-form-label">
                        Reason for Transfer <span className="tc-required">*</span>
                      </label>
                      <textarea
                        className="tc-form-textarea"
                        value={tcFormData.reason}
                        onChange={(e) => handleTCFormChange('reason', e.target.value)}
                        placeholder="Enter the reason for requesting transfer certificate"
                        rows={5}
                        required
                      />
                    </div>

                    <div className="tc-form-group">
                      <label className="tc-form-label">Expected Transfer Date</label>
                      <input
                        className="tc-form-input"
                        type="date"
                        value={tcFormData.transferDate}
                        onChange={(e) => handleTCFormChange('transferDate', e.target.value)}
                      />
                    </div>

                    <div className="tc-form-group">
                      <label className="tc-form-label">New School Name</label>
                      <input
                        className="tc-form-input"
                        type="text"
                        value={tcFormData.newSchoolName}
                        onChange={(e) => handleTCFormChange('newSchoolName', e.target.value)}
                        placeholder="Enter new school name"
                      />
                    </div>

                    <div className="tc-form-group">
                      <label className="tc-form-label">New School Address</label>
                      <textarea
                        className="tc-form-textarea"
                        value={tcFormData.newSchoolAddress}
                        onChange={(e) => handleTCFormChange('newSchoolAddress', e.target.value)}
                        placeholder="Enter new school address"
                        rows={4}
                      />
                    </div>

                    <div className="tc-form-group">
                      <label className="tc-form-label">Additional Details</label>
                      <textarea
                        className="tc-form-textarea"
                        value={tcFormData.additionalDetails}
                        onChange={(e) => handleTCFormChange('additionalDetails', e.target.value)}
                        placeholder="Any additional information"
                        rows={4}
                      />
                    </div>

                    <div className="tc-form-actions">
                      <button
                        type="button"
                        className="tc-btn-cancel"
                        onClick={() => {
                          setShowTCForm(false);
                          setTcError(null);
                        }}
                        disabled={tcLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="tc-btn-submit"
                        disabled={tcLoading || !tcFormData.reason}
                      >
                        {tcLoading ? 'Submitting...' : 'Submit Request'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* TC Requests List */}
            {tcRequests.length > 0 && (
              <div style={{ marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px', color: '#333' }}>Your Transfer Certificate Requests</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Request Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Reason</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tcRequests.map((req) => {
                        const getStatusBadge = (status: string) => {
                          const styles: Record<string, React.CSSProperties> = {
                            PENDING_ADMIN: { backgroundColor: '#fff3cd', color: '#856404', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
                            PENDING_TEACHER: { backgroundColor: '#cce5ff', color: '#004085', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
                            APPROVED: { backgroundColor: '#d4edda', color: '#155724', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' },
                            REJECTED: { backgroundColor: '#f8d7da', color: '#721c24', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }
                          };
                          return <span style={styles[status] || styles.PENDING_ADMIN}>{status.replace('_', ' ')}</span>;
                        };

                        return (
                          <tr key={req.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                            <td style={{ padding: '12px' }}>
                              {req.requestDate ? new Date(req.requestDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td style={{ padding: '12px' }}>{req.reason}</td>
                            <td style={{ padding: '12px' }}>{getStatusBadge(req.status)}</td>
                            <td style={{ padding: '12px' }}>
                              {req.adminRemarks && (
                                <div style={{ marginBottom: '4px' }}>
                                  <strong>Admin:</strong> {req.adminRemarks}
                                </div>
                              )}
                              {req.teacherRemarks && (
                                <div>
                                  <strong>Teacher:</strong> {req.teacherRemarks}
                                </div>
                              )}
                              {!req.adminRemarks && !req.teacherRemarks && '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'history' && (
          <section className="previous-schools-section">
            <SectionHeader icon="📚" title="Previous Schooling Records" />
            <div className="school-records">
              {previousRecords.map(rec => (
                <div key={rec.id} className="school-card">
                  <h3>{rec.classLabel}</h3>
                  <p><strong>School:</strong> {rec.schoolName}</p>
                  <p><strong>Passing Year:</strong> {rec.passingYear}</p>
                  <p><strong>Percentage:</strong> {rec.percentage} • <strong>Grade:</strong> {rec.grade}</p>
                  {rec.gallery.map(g => (
                    <div key={g.id} style={{ marginTop: 10 }}>
                      <img src={g.imageUrl} alt={g.title} style={{ width: '100%', borderRadius: 8 }} />
                      <div style={{ marginTop: 6, color: '#333', fontWeight: 600 }}>{g.title}</div>
                    </div>
                  ))}
                  <div className="button-row">
                    {rec.resultUrl && (
                      <button 
                        type="button"
                        className="download-btn"
                        onClick={() => window.open(rec.resultUrl!, '_blank')}
                        aria-label={`Download ${rec.classLabel} result`}
                      >
                        ⬇️ Download Result
                      </button>
                    )}
                    {rec.certificateUrl && (
                      <button 
                        type="button"
                        className="download-btn"
                        onClick={() => window.open(rec.certificateUrl!, '_blank')}
                        aria-label={`Download ${rec.classLabel} certificate`}
                      >
                        ⬇️ Download Certificate
                      </button>
                    )}
          </div>
        </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;