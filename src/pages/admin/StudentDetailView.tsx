import React, { useState, useEffect } from 'react';
import { Student, FeeCatalog } from '../../types/admin';
import './StudentDetailView.css';
import { StudentService } from '../../services/studentService';
import FeeService from '../../services/feeService';

interface StudentDetailViewProps {
  student: Student;
  feeCatalog: FeeCatalog;
  onClose: () => void;
  onUpdate?: () => void; // Callback after successful update
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, feeCatalog: initialFeeCatalog, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feeCatalog, setFeeCatalog] = useState<FeeCatalog>(initialFeeCatalog);
  const [isGeneratingFees, setIsGeneratingFees] = useState(false);
  
  // Editable student data
  const [editedStudent, setEditedStudent] = useState<Student>({ ...student });

  // Sync editedStudent when student prop changes (after successful update)
  useEffect(() => {
    setEditedStudent({ ...student });
  }, [student]);

  // Check if fees need to be generated
  useEffect(() => {
    console.log('Initial fee catalog check:', {
      monthlyFeesLength: feeCatalog.monthlyFees.length,
      totalAmount: feeCatalog.totalAmount,
      monthlyFees: feeCatalog.monthlyFees
    });
    
    // Check if fees are truly empty (length 0) OR all items are empty objects
    const hasValidFees = feeCatalog.monthlyFees.length > 0 && 
                         feeCatalog.monthlyFees.some(fee => fee.month && fee.amount);
    
    if (!hasValidFees && !isGeneratingFees) {
      console.log('No valid fees found, generating...');
      generateFeesForStudent();
    }
  }, []);

  // Generate fees for student
  const generateFeesForStudent = async () => {
    try {
      setIsGeneratingFees(true);
      await FeeService.generateFeesForStudent(student.id);
      
      // Refresh fee catalog
      const updatedCatalog = await FeeService.getFeeCatalogByPan(student.id);
      setFeeCatalog(updatedCatalog);
      setSuccess('Fees generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Failed to generate fees:', error);
      setError(error.message || 'Failed to generate fees');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGeneratingFees(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof Student, value: any) => {
    setEditedStudent(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Save changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate required fields
      if (!editedStudent.name || !editedStudent.currentClass || !editedStudent.section) {
        setError('Please fill in all required fields');
        setIsSaving(false);
        return;
      }

      // Clean up currentClass - remove "Class " prefix if present
      const cleanClass = editedStudent.currentClass.replace(/^Class\s+/i, '').trim();
      const cleanSection = editedStudent.section.trim();

      // Prepare data for backend - combine currentClass and section into className format
      const updateData = {
        ...editedStudent,
        className: `${cleanClass}-${cleanSection}`, // Backend expects "1-A" format (not "Class 1-A")
        gender: editedStudent.gender?.toUpperCase(), // Backend expects MALE, FEMALE, OTHER (uppercase)
        // Remove frontend-only fields that backend doesn't recognize
        currentClass: undefined,
        section: undefined,
        feeStatus: undefined,
        feeCatalogStatus: undefined,
      };

      // Call update API
      const updatedStudentData = await StudentService.updateStudent(editedStudent.id, updateData);
      
      // Check if class/section changed
      const classChanged = cleanClass !== student.currentClass || cleanSection !== student.section;
      
      // Refresh fee catalog if class/section changed
      if (classChanged) {
        try {
          // Wait for backend to complete fee regeneration (delete old + generate new)
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Retry logic: Try up to 3 times to get updated fee catalog
          let updatedCatalog = null;
          let retries = 3;
          
          while (retries > 0 && !updatedCatalog) {
            try {
              const catalog = await FeeService.getFeeCatalogByPan(editedStudent.id);
              // Verify the catalog has fees (not empty/old data)
              if (catalog && catalog.monthlyFees && catalog.monthlyFees.length > 0) {
                updatedCatalog = catalog;
                setFeeCatalog(updatedCatalog);
                console.log('Fee catalog refreshed after class change:', updatedCatalog);
                break;
              } else {
                console.log('Fee catalog empty, retrying...', retries - 1, 'attempts left');
                retries--;
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }
            } catch (retryErr) {
              console.error('Retry failed:', retryErr);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }
          
          if (!updatedCatalog) {
            console.warn('Could not fetch updated fee catalog after class change');
            // Trigger manual refresh by calling generate fees
            await FeeService.generateFeesForStudent(editedStudent.id);
            await new Promise(resolve => setTimeout(resolve, 500));
            const finalCatalog = await FeeService.getFeeCatalogByPan(editedStudent.id);
            setFeeCatalog(finalCatalog);
          }
        } catch (err) {
          console.error('Failed to refresh fee catalog:', err);
        }
      }
      
      // Update editedStudent with fresh data from backend
      const updatedStudent = {
        ...editedStudent,
        currentClass: updatedStudentData.currentClass,
        section: updatedStudentData.section,
        classRollNumber: updatedStudentData.classRollNumber
      };
      setEditedStudent(updatedStudent);
      
      setSuccess('Student information updated successfully!' + (classChanged ? ' Fee structure has been updated for the new class.' : ''));
      setIsEditing(false);
      
      // Call onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update student information');
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditedStudent({ ...student });
    setIsEditing(false);
    setError(null);
  };

  // Enter edit mode
  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  // Get the year from the fee data, or use current year as fallback
  const getFeeYear = () => {
    if (feeCatalog.monthlyFees && feeCatalog.monthlyFees.length > 0) {
      const firstFeeWithYear = feeCatalog.monthlyFees.find(fee => fee.year);
      return firstFeeWithYear ? firstFeeWithYear.year : new Date().getFullYear();
    }
    return new Date().getFullYear();
  };

  const currentYear = getFeeYear();

  // Determine session start month from fee data
  const getSessionStartMonth = () => {
    if (feeCatalog.monthlyFees && feeCatalog.monthlyFees.length > 0) {
      // Find the first fee entry (should be session start)
      const sortedFees = [...feeCatalog.monthlyFees].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return months.indexOf(a.month?.toUpperCase()) - months.indexOf(b.month?.toUpperCase());
      });
      return sortedFees[0]?.month?.toUpperCase() || 'APRIL';
    }
    return 'APRIL'; // Default to April
  };

  const sessionStartMonth = getSessionStartMonth();
  const sessionStartIndex = months.indexOf(sessionStartMonth);

  // Reorder months to start from session start month
  const getSessionMonths = () => {
    if (sessionStartIndex === -1 || sessionStartIndex === 0) {
      return months.map(month => ({ month, year: currentYear }));
    }
    
    // Create array starting from session start month
    const reorderedMonths: Array<{ month: string; year: number }> = [];
    
    // Add months from session start to end of year
    for (let i = sessionStartIndex; i < months.length; i++) {
      reorderedMonths.push({ month: months[i], year: currentYear });
    }
    
    // Add months from start of next year to session start
    for (let i = 0; i < sessionStartIndex; i++) {
      reorderedMonths.push({ month: months[i], year: currentYear + 1 });
    }
    
    return reorderedMonths;
  };

  const sessionMonths = getSessionMonths();

  const renderPersonalInfo = () => {
    const displayStudent = isEditing ? editedStudent : student;
    
    return (
      <div className="personal-info">
        <div className="info-section">
          <h3 className="section-title">Personal Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Full Name: <span style={{color: 'red'}}>*</span></label>
              {isEditing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={displayStudent.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              ) : (
                <span>{displayStudent.name}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Class: <span style={{color: 'red'}}>*</span></label>
              {isEditing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={displayStudent.currentClass || ''}
                  onChange={(e) => handleInputChange('currentClass', e.target.value)}
                  required
                />
              ) : (
                <span className="badge-class">{displayStudent.currentClass}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Section: <span style={{color: 'red'}}>*</span></label>
              {isEditing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={displayStudent.section || ''}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  required
                />
              ) : (
                <span>{displayStudent.section}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Roll Number:</label>
              {isEditing ? (
                <input
                  type="number"
                  className="edit-input"
                  value={displayStudent.classRollNumber || ''}
                  onChange={(e) => handleInputChange('classRollNumber', parseInt(e.target.value) || 0)}
                />
              ) : (
                <span className="badge-primary">{displayStudent.classRollNumber}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Date of Birth:</label>
              {isEditing ? (
                <input
                  type="date"
                  className="edit-input"
                  value={displayStudent.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                />
              ) : (
                <span>{displayStudent.dateOfBirth}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Gender:</label>
              {isEditing ? (
                <select
                  className="edit-input"
                  value={displayStudent.gender || 'male'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              ) : (
                <span style={{textTransform: 'capitalize'}}>{displayStudent.gender}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Blood Group:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={displayStudent.bloodGroup || ''}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                />
              ) : (
                <span className="badge-blood">{displayStudent.bloodGroup}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Admission Date:</label>
              {isEditing ? (
                <input
                  type="date"
                  className="edit-input"
                  value={displayStudent.admissionDate || ''}
                  onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                />
              ) : (
                <span>{displayStudent.admissionDate}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Previous School:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={displayStudent.previousSchool || ''}
                  onChange={(e) => handleInputChange('previousSchool', e.target.value)}
                  placeholder="Enter previous school (optional)"
                />
              ) : (
                <span>{displayStudent.previousSchool || 'N/A'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3 className="section-title">Contact Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Parent Name:</label>
              {isEditing ? (
                <input
                  type="text"
                  className="edit-input"
                  value={displayStudent.parentName || ''}
                  onChange={(e) => handleInputChange('parentName', e.target.value)}
                />
              ) : (
                <span>{displayStudent.parentName}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Mobile Number:</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="edit-input"
                  value={displayStudent.mobileNumber || ''}
                  onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                />
              ) : (
                <span>{displayStudent.mobileNumber}</span>
              )}
            </div>
            
            <div className="info-item">
              <label>Emergency Contact:</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="edit-input"
                  value={displayStudent.emergencyContact || ''}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                />
              ) : (
                <span>{displayStudent.emergencyContact}</span>
              )}
            </div>
            
            <div className="info-item full-width">
              <label>Address:</label>
              {isEditing ? (
                <textarea
                  className="edit-textarea"
                  value={displayStudent.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                />
              ) : (
                <span>{displayStudent.address}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFeeCatalog = () => {
    console.log('Fee Catalog Data:', feeCatalog);
    console.log('Monthly Fees:', feeCatalog.monthlyFees);
    console.log('Monthly Fees detailed:', JSON.stringify(feeCatalog.monthlyFees, null, 2));
    
    // Check if fees are valid (not just empty objects)
    const hasValidFees = feeCatalog.monthlyFees.length > 0 && 
                         feeCatalog.monthlyFees.some(fee => fee.month && fee.amount !== undefined);
    
    // Check if fees need to be generated
    if (!hasValidFees && !isGeneratingFees) {
      return (
        <div className="fee-catalog">
          <div className="no-fees-message">
            <h3>No Fee Records Found</h3>
            <p>This student doesn't have any fee records yet.</p>
            <button 
              className="generate-fees-btn"
              onClick={generateFeesForStudent}
              disabled={isGeneratingFees}
            >
              {isGeneratingFees ? 'Generating Fees...' : 'Generate Fee Records'}
            </button>
          </div>
        </div>
      );
    }

    if (isGeneratingFees) {
      return (
        <div className="fee-catalog">
          <div className="loading-message">
            <p>Generating fee records...</p>
          </div>
        </div>
      );
    }
    
    return (
    <div className="fee-catalog">
      <div className="fee-summary">
        <div className="fee-summary-card">
          <h4>Total Fee Amount</h4>
          <span className="amount">₹{feeCatalog.totalAmount.toLocaleString()}</span>
        </div>
        <div className="fee-summary-card paid">
          <h4>Total Paid</h4>
          <span className="amount">₹{feeCatalog.totalPaid.toLocaleString()}</span>
        </div>
        <div className="fee-summary-card pending">
          <h4>Total Pending</h4>
          <span className="amount">₹{feeCatalog.totalPending.toLocaleString()}</span>
        </div>
        <div className="fee-summary-card overdue">
          <h4>Total Overdue</h4>
          <span className="amount">₹{feeCatalog.totalOverdue.toLocaleString()}</span>
        </div>
      </div>

      <div className="fee-calendar">
        <h4>Monthly Fee Calendar - Session {currentYear}-{currentYear + 1}</h4>
        <div className="calendar-grid">
          {sessionMonths.map(({ month, year }) => {
            const monthFee = feeCatalog.monthlyFees.find(
              fee => fee && fee.month && fee.month.toUpperCase() === month.toUpperCase() && fee.year === year
            );
            
            // Safely get status with fallback
            let status = 'pending';
            if (monthFee && monthFee.status) {
              status = monthFee.status.toLowerCase();
            }

            // Safely get amount with fallback
            const amount = monthFee && monthFee.amount !== undefined ? monthFee.amount : 0;

            return (
              <div key={`${month}-${year}`} className={`calendar-month ${status}`}>
                <div className="month-name">{month}</div>
                <div className="month-year">{year}</div>
                <div className="month-status">
                  {status === 'paid' && <span className="status-paid">✓</span>}
                  {status === 'overdue' && <span className="status-overdue">⚠</span>}
                  {status === 'pending' && <span className="status-pending">○</span>}
                  {status === 'unpaid' && <span className="status-pending">○</span>}
                </div>
                <div className="month-amount">
                  ₹{amount.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fee-details">
        <h4>Detailed Fee Records</h4>
        <div className="fee-table">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Payment Date</th>
                <th>Receipt No.</th>
              </tr>
            </thead>
            <tbody>
              {feeCatalog.monthlyFees.length > 0 ? (
                feeCatalog.monthlyFees.map((fee, index) => (
                  <tr key={index} className={`fee-row ${fee.status || 'pending'}`}>
                    <td>{fee.month || 'N/A'} {fee.year || ''}</td>
                    <td>₹{fee.amount !== undefined ? fee.amount.toLocaleString() : '0'}</td>
                    <td>{fee.dueDate || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${fee.status || 'pending'}`}>
                        {fee.status || 'N/A'}
                      </span>
                    </td>
                    <td>{fee.paymentDate || '-'}</td>
                    <td>{fee.receiptNumber || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    No fee records available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    );
  };

  const renderAcademicInfo = () => (
    <div className="academic-info">
      <h4>Academic Information</h4>
      <div className="info-grid">
        <div className="info-item">
          <label>Current Class:</label>
          <span>{student.currentClass}</span>
        </div>
        <div className="info-item">
          <label>Section:</label>
          <span>{student.section}</span>
        </div>
        <div className="info-item">
          <label>Roll Number:</label>
          <span>{student.classRollNumber}</span>
        </div>
        <div className="info-item">
          <label>Admission Date:</label>
          <span>{student.admissionDate}</span>
        </div>
      </div>
      
      <div className="academic-actions">
        <button className="action-btn">View Results</button>
        <button className="action-btn">Update Academic Record</button>
        <button className="action-btn">Generate Report Card</button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'fees':
        return renderFeeCatalog();
      case 'academic':
        return renderAcademicInfo();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="student-detail-overlay">
      <div className="student-detail-modal">
        <div className="modal-header">
          <h2>Student Details - {student.name}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Info
          </button>
          <button
            className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            Fee Catalog
          </button>
          <button
            className={`tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => setActiveTab('academic')}
          >
            Academic Info
          </button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: '#d1fae5',
              color: '#065f46',
              padding: '1rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              borderLeft: '4px solid #10b981',
              fontWeight: '500'
            }}>
              {success}
            </div>
          )}
          {renderContent()}
        </div>

        <div className="modal-footer">
          <div className="footer-buttons">
            {isEditing ? (
              <>
                <button 
                  type="button"
                  className="action-btn secondary" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  className="action-btn primary"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button 
                  type="button"
                  className="action-btn secondary" 
                  onClick={onClose}
                >
                  Close
                </button>
                <button 
                  type="button"
                  className="action-btn"
                  onClick={handleEdit}
                >
                  Edit Student
                </button>
                <button 
                  type="button"
                  className="action-btn"
                  onClick={() => window.print()}
                >
                  Print Details
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailView; 