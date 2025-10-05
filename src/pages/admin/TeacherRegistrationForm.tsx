import React, { useState } from 'react';
import './StudentRegistrationForm.css';

interface TeacherRegistrationFormProps {
  onRegistrationSuccess: () => void;
}

interface TeacherFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  qualification: string;
  designation: string;
  salaryGrade: string;
  contactNumber: string;
  joiningDate: string;
}

interface FormErrors {
  [key: string]: string;
}

const TeacherRegistrationForm: React.FC<TeacherRegistrationFormProps> = ({ onRegistrationSuccess }) => {
  const [formData, setFormData] = useState<TeacherFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    qualification: '',
    designation: '',
    salaryGrade: '',
    contactNumber: '',
    joiningDate: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const salaryGrades = ['A', 'B', 'C', 'D', 'E'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    if (!formData.salaryGrade) newErrors.salaryGrade = 'Salary grade is required';
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
    }
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!validateForm()) {
      setSubmitError('Please fix all errors before submitting');
      return;
    }

    setLoading(true);

    try {
      const requestBody = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        qualification: formData.qualification.trim(),
        designation: formData.designation.trim(),
        salaryGrade: formData.salaryGrade,
        contactNumber: formData.contactNumber.trim(),
        joiningDate: formData.joiningDate,
        roles: ['ROLE_TEACHER']
      };

      const response = await fetch('http://localhost:8080/api/auth/register/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess('Teacher registered successfully!');
        // Reset form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          qualification: '',
          designation: '',
          salaryGrade: '',
          contactNumber: '',
          joiningDate: ''
        });
        onRegistrationSuccess();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSubmitSuccess(''), 3000);
      } else {
        setSubmitError(data.message || 'Failed to register teacher');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setSubmitError('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      qualification: '',
      designation: '',
      salaryGrade: '',
      contactNumber: '',
      joiningDate: ''
    });
    setErrors({});
    setSubmitError('');
    setSubmitSuccess('');
  };

  return (
    <div className="student-registration-form">
      <div className="form-header">
        <h2>👨‍🏫 Teacher Registration</h2>
        <p>Register a new teacher in the system</p>
      </div>

      {submitSuccess && (
        <div className="success-message">
          <span>✓</span> {submitSuccess}
        </div>
      )}

      {submitError && (
        <div className="error-message">
          <span>✗</span> {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="registration-form">
        <div className="form-grid">
          {/* Personal Information */}
          <div className="form-section">
            <h3>Personal Information</h3>
            
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="teacher@example.com"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Contact Number <span className="required">*</span></label>
              <input
                type="tel"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                className={errors.contactNumber ? 'error' : ''}
              />
              {errors.contactNumber && <span className="error-text">{errors.contactNumber}</span>}
            </div>
          </div>

          {/* Professional Information */}
          <div className="form-section">
            <h3>Professional Information</h3>
            
            <div className="form-group">
              <label>Qualification <span className="required">*</span></label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g., M.Ed., B.Ed., M.Sc."
                className={errors.qualification ? 'error' : ''}
              />
              {errors.qualification && <span className="error-text">{errors.qualification}</span>}
            </div>

            <div className="form-group">
              <label>Designation <span className="required">*</span></label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="e.g., Senior Teacher, Assistant Teacher"
                className={errors.designation ? 'error' : ''}
              />
              {errors.designation && <span className="error-text">{errors.designation}</span>}
            </div>

            <div className="form-group">
              <label>Salary Grade <span className="required">*</span></label>
              <select
                name="salaryGrade"
                value={formData.salaryGrade}
                onChange={handleChange}
                className={errors.salaryGrade ? 'error' : ''}
              >
                <option value="">Select Grade</option>
                {salaryGrades.map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
              {errors.salaryGrade && <span className="error-text">{errors.salaryGrade}</span>}
            </div>

            <div className="form-group">
              <label>Joining Date <span className="required">*</span></label>
              <input
                type="date"
                name="joiningDate"
                value={formData.joiningDate}
                onChange={handleChange}
                className={errors.joiningDate ? 'error' : ''}
              />
              {errors.joiningDate && <span className="error-text">{errors.joiningDate}</span>}
            </div>
          </div>

          {/* Security Information */}
          <div className="form-section">
            <h3>Security Information</h3>
            
            <div className="form-group">
              <label>Password <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password <span className="required">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-reset" 
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </button>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherRegistrationForm;
