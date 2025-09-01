import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StudentRegistration.css';

interface StudentRegistrationData {
  pan: string;
  password: string;
  confirmPassword: string;
  class: string;
  section: string;
  session: string;
  contactNumber: string;
  photo: File | null;
}

interface StudentRegistrationErrors {
  pan?: string;
  password?: string;
  confirmPassword?: string;
  class?: string;
  section?: string;
  session?: string;
  contactNumber?: string;
  photo?: string;
}

const StudentRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<StudentRegistrationData>({
    pan: '',
    password: '',
    confirmPassword: '',
    class: '',
    section: '',
    session: '',
    contactNumber: '',
    photo: null
  });
  const [errors, setErrors] = useState<StudentRegistrationErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name as keyof StudentRegistrationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        photo: file
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: StudentRegistrationErrors = {};

    if (!formData.pan.trim()) {
      newErrors.pan = 'PAN is required';
    } else if (formData.pan.length < 10) {
      newErrors.pan = 'PAN must be at least 10 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.class) {
      newErrors.class = 'Class is required';
    }

    if (!formData.section) {
      newErrors.section = 'Section is required';
    }

    if (!formData.session) {
      newErrors.session = 'Session is required';
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
    }

    if (!formData.photo) {
      newErrors.photo = 'Recent photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, you would send the data to your backend
      console.log('Student registration data:', formData);
      
      // Show success message and redirect to login
      alert('Registration successful! Please login with your PAN and password.');
      navigate('/student/login');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="student-registration">
      <div className="registration-container">
        <div className="registration-header">
          <h1>Student Registration</h1>
          <p>Create your SLMS student account</p>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="pan">PAN Number *</label>
            <input
              type="text"
              id="pan"
              name="pan"
              value={formData.pan}
              onChange={handleInputChange}
              placeholder="Enter your PAN number"
              className={errors.pan ? 'error' : ''}
            />
            {errors.pan && <span className="error-message">{errors.pan}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="class">Class *</label>
              <select
                id="class"
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                className={errors.class ? 'error' : ''}
              >
                <option value="">Select Class</option>
                <option value="1">Class 1</option>
                <option value="2">Class 2</option>
                <option value="3">Class 3</option>
                <option value="4">Class 4</option>
                <option value="5">Class 5</option>
                <option value="6">Class 6</option>
                <option value="7">Class 7</option>
                <option value="8">Class 8</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
              {errors.class && <span className="error-message">{errors.class}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="section">Section *</label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className={errors.section ? 'error' : ''}
              >
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              {errors.section && <span className="error-message">{errors.section}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="session">Session *</label>
              <select
                id="session"
                name="session"
                value={formData.session}
                onChange={handleInputChange}
                className={errors.session ? 'error' : ''}
              >
                <option value="">Select Session</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
              {errors.session && <span className="error-message">{errors.session}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number *</label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                placeholder="Enter 10-digit contact number"
                className={errors.contactNumber ? 'error' : ''}
              />
              {errors.contactNumber && <span className="error-message">{errors.contactNumber}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="photo">Recent Photo *</label>
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className={errors.photo ? 'error' : ''}
            />
            {errors.photo && <span className="error-message">{errors.photo}</span>}
            <small>Upload a recent passport-size photo (JPG, PNG, max 2MB)</small>
          </div>

          <button type="submit" className="register-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          <p>Already have an account? <span onClick={() => navigate('/student/login')}>Login here</span></p>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistration;
