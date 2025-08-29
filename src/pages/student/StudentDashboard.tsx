import React, { useMemo, useState } from 'react';
import './StudentDashboard.css';

interface StudentDashboardProps {
  onLogout: () => void;
}

type AttendanceSummary = { present: number; absent: number; };
type Holiday = { id: string; date: string; name: string; };
type TimetableEntry = { id: string; day: string; period: number; start: string; end: string; subject: string; teacher: string; };
type EventItem = { id: string; date: string; name: string; type: 'sports' | 'cultural' | 'academic' | 'meeting'; };
type NotificationItem = { id: string; title: string; message: string; date: string; };
type FeeStatus = { total: number; paid: number; pending: number; status: 'paid' | 'pending' | 'overdue'; };
type EnquiryContact = { id: string; subject: string; teacher: string; phone: string; };
type VideoLecture = { id: string; title: string; subject: string; className: string; url: string; };
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

  // Mock student data
  const student = {
    name: 'Rahul Kumar',
    currentClass: '10th A',
    pan: 'PAN123456',
    photo: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=256&q=80&auto=format&fit=crop',
    schoolName: 'Mauritius International School',
    schoolLogo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-8IRdKonj2lw5KF7osJq3GRJSOrjKiKck0g&s'
  };

  const attendance: AttendanceSummary = { present: 45, absent: 5 };

  const holidays: Holiday[] = [
    { id: 'h1', date: '2025-01-26', name: 'Republic Day' },
    { id: 'h2', date: '2025-03-17', name: 'Holi' },
    { id: 'h3', date: '2025-08-15', name: 'Independence Day' },
  ];

  const timetable: TimetableEntry[] = [
    { id: 't1', day: 'Mon', period: 1, start: '08:00', end: '08:45', subject: 'Mathematics', teacher: 'Dr. Verma' },
    { id: 't2', day: 'Mon', period: 2, start: '08:50', end: '09:35', subject: 'Science', teacher: 'Mr. Singh' },
    { id: 't3', day: 'Mon', period: 3, start: '09:40', end: '10:25', subject: 'English', teacher: 'Ms. Sharma' },
  ];

  const events: EventItem[] = [
    { id: 'e1', date: '2025-02-10', name: 'Annual Sports Day', type: 'sports' },
    { id: 'e2', date: '2025-03-05', name: 'Cultural Fest', type: 'cultural' },
  ];

  const notifications: NotificationItem[] = [
    { id: 'n1', title: 'Fee Reminder', message: 'Please pay term 2 fees before 25th.', date: '2025-01-15' },
    { id: 'n2', title: 'PTM', message: 'Parent-Teacher Meeting on 20th Jan.', date: '2025-01-12' },
  ];

  const unreadNotificationsCount = notifications.length;

  const feeStatus: FeeStatus = { total: 60000, paid: 55000, pending: 5000, status: 'pending' };

  const enquiryNumbers: EnquiryContact[] = [
    { id: 'c1', subject: 'Mathematics', teacher: 'Dr. Verma', phone: '98765 43210' },
    { id: 'c2', subject: 'Science', teacher: 'Mr. Singh', phone: '98765 43211' },
    { id: 'c3', subject: 'English', teacher: 'Ms. Sharma', phone: '98765 43212' },
  ];

  const lectures: VideoLecture[] = [
    { id: 'v1', title: 'Quadratic Equations', subject: 'Mathematics', className: '10th A', url: '#' },
    { id: 'v2', title: 'Chemical Reactions', subject: 'Science', className: '10th A', url: '#' },
  ];

  const gallery: GalleryItem[] = [
    { id: 'g1', title: 'School Building', imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&q=80&auto=format&fit=crop' },
    { id: 'g2', title: 'Annual Day', imageUrl: 'https://images.unsplash.com/photo-1515165562835-c3b8c2b2a831?w=600&q=80&auto=format&fit=crop' },
    { id: 'g3', title: 'Science Fair', imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop' },
  ];

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

  // Attendance calendar (auto for current month)
  const holidayDates = new Set<string>(holidays.map(h => h.date));
  const formatKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const buildAttendanceSets = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const present = new Set<string>();
    const absent = new Set<string>();
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      const key = formatKey(date);
      const day = date.getDay();
      if (holidayDates.has(key) || day === 0) continue;
      if (d % 11 === 0 || d % 17 === 0) absent.add(key); else present.add(key);
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

  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    alert(`Query sent to ${querySubject} teacher.`);
    setQueryText('');
  };

  const handleLeaveUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLeaveImage(file);
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
                <img src={student.schoolLogo} alt="School logo" />
              </div>
              <div>
                <h1 className="school-name">{student.schoolName}</h1>
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
                {unreadNotificationsCount > 0 && (
                  <span className="notification-badge">{unreadNotificationsCount}</span>
                )}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button className="close-notifications" onClick={() => setShowNotifications(false)}>×</button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 && (
                      <div className="no-notifications">No notifications</div>
                    )}
                    {notifications.map(n => (
                      <div key={n.id} className="notification-item">
                        <div className="notification-date">{n.date}</div>
                        <div className="notification-message"><strong>{n.title}:</strong> {n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="student-profile">
              <div className="student-photo">
                <img src={student.photo} alt="Student" />
              </div>
              <div className="student-info">
                <h2>{student.name}</h2>
                <p>Class: {student.currentClass} • PAN: {student.pan}</p>
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
        {activeTab === 'home' && (
          <section className="profile-section">
            <SectionHeader icon="👤" title="Student Profile" />
            <div className="profile-info">
              <img className="profile-photo" src={student.photo} alt="Student" />
              <div className="profile-details">
                <p><strong>Name:</strong> {student.name}</p>
                <p><strong>Current Class:</strong> {student.currentClass}</p>
                <p><strong>PAN:</strong> {student.pan}</p>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'enquiry' && (
          <section className="query-section">
            <SectionHeader icon="📞" title="Enquiry Numbers" />
            <div className="attendance-info">
              {enquiryNumbers.map(c => (
                <p key={c.id}><strong>{c.subject}:</strong> {c.teacher} — {c.phone}</p>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'lectures' && (
          <section className="events-section">
            <SectionHeader icon="🎥" title="Live Class & Video Lectures" />
            <div className="events-container">
              {lectures.map(v => (
                <div key={v.id} className="event-card academic">
                  <div className="event-name">{v.title}</div>
                  <div className="event-date">{v.subject} • {v.className}</div>
                  <button className="submit-btn" onClick={() => window.open(v.url, '_blank')}>Watch</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'timetable' && (
          <section className="profile-section">
            <SectionHeader icon="📅" title="Current Class Timetable" />
            <table className="holidays-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Period</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Teacher</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map(tt => (
                  <tr key={tt.id}>
                    <td>{tt.day}</td>
                    <td>{tt.period}</td>
                    <td>{tt.start} - {tt.end}</td>
                    <td>{tt.subject}</td>
                    <td>{tt.teacher}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

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
              <div className="attendance-info" style={{ marginTop: 16 }}>
                <p><strong>Present:</strong> {attendance.present} • <strong>Absent:</strong> {attendance.absent} • <strong>Percent:</strong> {attendancePercent}%</p>
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

        {activeTab === 'events' && (
          <section className="events-section">
            <SectionHeader icon="🎈" title="Upcoming Events and Activities" />
            <div className="events-container">
              {events.map(ev => (
                <div key={ev.id} className={`event-card ${ev.type}`}>
                  <div className="event-date">{ev.date}</div>
                  <div className="event-name">{ev.name}</div>
                  <span className="event-type">{ev.type}</span>
                  <div style={{ marginTop: 10 }}>
                    <button className="submit-btn" onClick={() => alert(`Details for ${ev.name}`)}>Details</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'results' && (
          <section className="results-section">
            <SectionHeader icon="📊" title="Academic Results" />
            <div className="result-card">
              <h3>Mid Term - 2025</h3>
              <table className="results-table" aria-label="Marks Breakdown">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { subject: 'Mathematics', marks: 85, total: 100, grade: 'A' },
                    { subject: 'Science', marks: 88, total: 100, grade: 'A' },
                    { subject: 'English', marks: 78, total: 100, grade: 'B+' },
                    { subject: 'Social Science', marks: 82, total: 100, grade: 'A' },
                    { subject: 'Hindi', marks: 80, total: 100, grade: 'A' },
                  ].map(row => (
                    <tr key={row.subject}>
                      <td>{row.subject}</td>
                      <td>{row.marks}</td>
                      <td>{row.total}</td>
                      <td>{Math.round((row.marks / row.total) * 100)}%</td>
                      <td>{row.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 12 }}>
                <strong>Current Percentage:</strong> {Math.round(((85+88+78+82+80) / (5*100)) * 100)}%
              </div>
              <div style={{ marginTop: 16 }}>
                <button className="download-btn" onClick={() => alert('Downloading current result PDF...')}>Download Result PDF</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'fees' && (
          <section className="fees-section">
            <SectionHeader icon="💳" title="Fees and Status" />
            <div className="fees-info">
              <p><strong>Total:</strong> ₹{feeStatus.total.toLocaleString('en-IN')}</p>
              <p><strong>Paid:</strong> ₹{feeStatus.paid.toLocaleString('en-IN')}</p>
              <p><strong>Pending:</strong> ₹{feeStatus.pending.toLocaleString('en-IN')}</p>
              <p><strong>Status:</strong> {feeStatus.status}</p>
            </div>
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
                <label>Subject</label>
                <select value={querySubject} onChange={(e) => setQuerySubject(e.target.value)}>
                  {enquiryNumbers.map(c => (
                    <option key={c.id} value={c.subject}>{c.subject} — {c.teacher}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Your Question</label>
                <textarea value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Type your subject-related question here..." />
              </div>
              <button className="submit-btn" type="submit">Send Query</button>
            </form>
          </section>
        )}

        {activeTab === 'leave' && (
          <section className="query-section">
            <SectionHeader icon="📝" title="Leave Request" />
            <div className="query-form">
              <div className="form-group">
                <label>Subject</label>
                <input 
                  type="text"
                  placeholder="Reason (e.g., Medical, Family)"
                  value={leaveSubject}
                  onChange={(e) => setLeaveSubject(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Upload supporting image</label>
                <input type="file" accept="image/*" onChange={handleLeaveUpload} />
                {leaveImage && <p style={{ marginTop: 8, color: '#555' }}>Selected: {leaveImage.name}</p>}
              </div>
              <button 
                className="tc-btn" 
                onClick={() => alert(`Leave request submitted${leaveSubject ? `: ${leaveSubject}` : ''}.`)}
                type="button"
                disabled={!leaveSubject}
              >
                Submit Leave Request
              </button>
            </div>
          </section>
        )}

        {activeTab === 'tc' && (
          <section className="transfer-section">
            <SectionHeader icon="📋" title="Transfer Certificate" />
            <div className="transfer-info">
              <p>You can apply for a Transfer Certificate. Your request will be sent to the Principal.</p>
              <ul>
                <li>Make sure your fees are cleared.</li>
                <li>Provide a valid reason in the remarks.</li>
              </ul>
              <button className="tc-btn" onClick={() => alert('Transfer Certificate request sent to Principal.')}>Send TC Request</button>
          </div>
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