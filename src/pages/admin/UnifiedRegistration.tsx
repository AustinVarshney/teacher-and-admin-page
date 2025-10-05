import React, { useState } from 'react';
import StudentRegistrationForm from './StudentRegistrationForm.tsx';
import TeacherRegistrationForm from './TeacherRegistrationForm.tsx';
import NonTeachingStaffRegistrationForm from './NonTeachingStaffRegistrationForm.tsx';
import './UnifiedRegistration.css';

// Unified registration component for student, teacher, and staff

interface UnifiedRegistrationProps {
  onRegistrationSuccess: () => void;
}

type RegistrationType = 'student' | 'teacher' | 'non-teaching-staff';

const UnifiedRegistration: React.FC<UnifiedRegistrationProps> = ({ onRegistrationSuccess }) => {
  const [registrationType, setRegistrationType] = useState<RegistrationType>('student');

  return (
    <div className="unified-registration">
      <div className="registration-header">
        <h2>Registration</h2>
        <p>Select the type of registration you want to perform</p>
      </div>

      <div className="registration-type-selector">
        <button
          className={`type-btn ${registrationType === 'student' ? 'active' : ''}`}
          onClick={() => setRegistrationType('student')}
        >
          <span className="type-icon">👨‍🎓</span>
          <span className="type-label">Student Registration</span>
        </button>
        <button
          className={`type-btn ${registrationType === 'teacher' ? 'active' : ''}`}
          onClick={() => setRegistrationType('teacher')}
        >
          <span className="type-icon">👨‍🏫</span>
          <span className="type-label">Teacher Registration</span>
        </button>
        <button
          className={`type-btn ${registrationType === 'non-teaching-staff' ? 'active' : ''}`}
          onClick={() => setRegistrationType('non-teaching-staff')}
        >
          <span className="type-icon">👷</span>
          <span className="type-label">Non-Teaching Staff</span>
        </button>
      </div>

      <div className="registration-form-container">
        {registrationType === 'student' && (
          <StudentRegistrationForm onRegistrationSuccess={onRegistrationSuccess} />
        )}
        {registrationType === 'teacher' && (
          <TeacherRegistrationForm onRegistrationSuccess={onRegistrationSuccess} />
        )}
        {registrationType === 'non-teaching-staff' && (
          <NonTeachingStaffRegistrationForm onRegistrationSuccess={onRegistrationSuccess} />
        )}
      </div>
    </div>
  );
};

export default UnifiedRegistration;
