import React, { useState, useEffect } from 'react';
import TimetableService from '../../services/timetableService';
import SubjectService from '../../services/subjectService';
import AdminService, { TeacherResponse, ClassInfoResponse } from '../../services/adminService';
import './TeacherAssignment.css';

interface Subject {
  id: number;
  subjectName: string;
  classId: number;
  className?: string;
  teacherId?: number;
  teacherName?: string;
}

interface DaySchedule {
  day: string;
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const TeacherAssignment: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [classes, setClasses] = useState<ClassInfoResponse[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Basic info
  const [selectedTeacherId, setSelectedTeacherId] = useState<number>(0);
  const [selectedClassId, setSelectedClassId] = useState<number>(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(0);
  const [roomNumber, setRoomNumber] = useState('');
  
  // Step 2: Day selection
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  
  // Step 3: Schedule for each day
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>([]);
  
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [teachersData, classesData, subjectsData] = await Promise.all([
        AdminService.getAllTeachers(),
        AdminService.getAllClasses(),
        SubjectService.getAllSubjects()
      ]);
      setTeachers(teachersData);
      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        // Remove day and its schedule
        setDaySchedules(prevSchedules => prevSchedules.filter(s => s.day !== day));
        return prev.filter(d => d !== day);
      } else {
        // Add day with default time
        setDaySchedules(prevSchedules => [
          ...prevSchedules,
          { day, startTime: '09:00', endTime: '10:00' }
        ]);
        return [...prev, day];
      }
    });
  };

  const handleScheduleChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setDaySchedules(prev => prev.map(schedule => 
      schedule.day === day ? { ...schedule, [field]: value } : schedule
    ));
  };

  const handleNextStep = () => {
    setError('');
    
    if (currentStep === 1) {
      if (!selectedTeacherId || !selectedClassId || !selectedSubjectId) {
        setError('Please select teacher, class, and subject');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedDays.length === 0) {
        setError('Please select at least one day');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePreviousStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validate all schedules have proper times
    for (const schedule of daySchedules) {
      if (!schedule.startTime || !schedule.endTime) {
        setError(`Please provide times for ${schedule.day}`);
        return;
      }
      if (schedule.startTime >= schedule.endTime) {
        setError(`End time must be after start time for ${schedule.day}`);
        return;
      }
    }

    try {
      setLoading(true);
      
      // Create timetable entries for each selected day
      const createPromises = daySchedules.map(schedule => 
        TimetableService.createTimetableEntry({
          teacherId: selectedTeacherId,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          roomNumber: roomNumber || undefined
        })
      );

      await Promise.all(createPromises);
      
      setSuccess(`Successfully assigned teacher to ${daySchedules.length} time slot(s)!`);
      
      // Reset form
      setTimeout(() => {
        handleReset();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to assign teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedTeacherId(0);
    setSelectedClassId(0);
    setSelectedSubjectId(0);
    setRoomNumber('');
    setSelectedDays([]);
    setDaySchedules([]);
    setCurrentStep(1);
    setError('');
    setSuccess('');
  };

  const getSelectedTeacher = () => teachers.find(t => t.id === selectedTeacherId);
  const getSelectedClass = () => classes.find(c => c.id === selectedClassId);
  const getSelectedSubject = () => subjects.find(s => s.id === selectedSubjectId);

  const renderStep1 = () => (
    <div className="step-content">
      <h3>Step 1: Select Teacher, Class & Subject</h3>
      
      <div className="form-section">
        <div className="form-group">
          <label htmlFor="teacherId">Select Teacher *</label>
          <select
            id="teacherId"
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(Number(e.target.value))}
            required
          >
            <option value="0">-- Select a Teacher --</option>
            {teachers.filter(t => t.status === 'ACTIVE').map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>
          {getSelectedTeacher() && (
            <div className="selected-info">
              <strong>Qualification:</strong> {getSelectedTeacher()?.qualification} | 
              <strong> Designation:</strong> {getSelectedTeacher()?.designation}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="classId">Select Class *</label>
          <select
            id="classId"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(Number(e.target.value))}
            required
          >
            <option value="0">-- Select a Class --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.className} ({cls.sessionName})
              </option>
            ))}
          </select>
          {getSelectedClass() && (
            <div className="selected-info">
              <strong>Students:</strong> {getSelectedClass()?.studentCount}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="subjectId">Select Subject *</label>
          <select
            id="subjectId"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
            required
          >
            <option value="0">-- Select a Subject --</option>
            {subjects
              .filter(s => !selectedClassId || s.classId === selectedClassId)
              .map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.subjectName} {subject.className ? `(${subject.className})` : ''}
                </option>
              ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="roomNumber">Room Number (Optional)</label>
          <input
            type="text"
            id="roomNumber"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g., Room 101"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h3>Step 2: Select Days</h3>
      <p className="step-subtitle">Choose the days when this class will be held</p>
      
      <div className="days-selection">
        {DAYS_OF_WEEK.map(day => (
          <div
            key={day}
            className={`day-card ${selectedDays.includes(day) ? 'selected' : ''}`}
            onClick={() => handleDayToggle(day)}
          >
            <div className="day-checkbox">
              {selectedDays.includes(day) && '✓'}
            </div>
            <div className="day-name">{day}</div>
          </div>
        ))}
      </div>

      {selectedDays.length > 0 && (
        <div className="selected-days-info">
          <strong>Selected Days:</strong> {selectedDays.join(', ')}
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h3>Step 3: Set Time Schedules</h3>
      <p className="step-subtitle">Configure start and end times for each selected day</p>
      
      <div className="schedules-list">
        {daySchedules.map(schedule => (
          <div key={schedule.day} className="schedule-item">
            <div className="schedule-day">{schedule.day}</div>
            <div className="schedule-times">
              <div className="time-input-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) => handleScheduleChange(schedule.day, 'startTime', e.target.value)}
                  required
                />
              </div>
              <span className="time-separator">to</span>
              <div className="time-input-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) => handleScheduleChange(schedule.day, 'endTime', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="teacher-assignment">
      <div className="assignment-header">
        <h2>Teacher Assignment</h2>
        <p className="assignment-subtitle">Assign teachers to classes and subjects with flexible scheduling</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Progress Indicator */}
      <div className="progress-steps">
        <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Basic Info</div>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Select Days</div>
        </div>
        <div className="progress-line"></div>
        <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Set Schedules</div>
        </div>
      </div>

      <div className="assignment-form-container">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="form-actions">
          {currentStep > 1 && (
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handlePreviousStep}
              disabled={loading}
            >
              ← Previous
            </button>
          )}
          
          {currentStep < 3 ? (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleNextStep}
              disabled={loading}
            >
              Next →
            </button>
          ) : (
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Complete Assignment'}
            </button>
          )}
          
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Summary Box */}
      {selectedTeacherId > 0 && selectedClassId > 0 && selectedSubjectId > 0 && (
        <div className="assignment-summary">
          <h3>Assignment Summary</h3>
          <div className="summary-content">
            <div className="summary-item">
              <span className="summary-label">Teacher:</span>
              <span className="summary-value">{getSelectedTeacher()?.name}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Class:</span>
              <span className="summary-value">{getSelectedClass()?.className}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Subject:</span>
              <span className="summary-value">{getSelectedSubject()?.subjectName}</span>
            </div>
            {roomNumber && (
              <div className="summary-item">
                <span className="summary-label">Room:</span>
                <span className="summary-value">{roomNumber}</span>
              </div>
            )}
            {daySchedules.length > 0 && (
              <div className="summary-item">
                <span className="summary-label">Schedule:</span>
                <div className="summary-schedules">
                  {daySchedules.map(s => (
                    <div key={s.day} className="summary-schedule">
                      {s.day}: {s.startTime} - {s.endTime}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="info-box">
        <h4>📋 Assignment Guidelines</h4>
        <ul>
          <li>Step 1: Select teacher, class, subject, and optionally room number</li>
          <li>Step 2: Choose multiple days for the class (e.g., Monday, Wednesday, Friday)</li>
          <li>Step 3: Set specific start and end times for each selected day</li>
          <li>Review the summary to ensure all details are correct</li>
          <li>Click "Complete Assignment" to create all timetable entries</li>
        </ul>
      </div>
    </div>
  );
};

export default TeacherAssignment;
