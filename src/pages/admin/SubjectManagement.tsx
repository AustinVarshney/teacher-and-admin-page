import React, { useState, useEffect } from 'react';
import SubjectService, { SubjectResponse } from '../../services/subjectService';
import AdminService, { ClassInfoResponse, TeacherResponse } from '../../services/adminService';
import './SubjectManagement.css';

interface SubjectFormData {
  id?: number;
  subjectName: string;
  classId: number;
  teacherId: number;
}

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [classes, setClasses] = useState<ClassInfoResponse[]>([]);
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectResponse | null>(null);

  const [formData, setFormData] = useState<SubjectFormData>({
    subjectName: '',
    classId: 0,
    teacherId: 0
  });

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const data = await SubjectService.getAllSubjects();
      setSubjects(data);
    } catch (err: any) {
      console.error('Error fetching subjects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await AdminService.getAllClasses();
      setClasses(data);
    } catch (err: any) {
      console.error('Error fetching classes:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await AdminService.getAllTeachers();
      setTeachers(data);
    } catch (err: any) {
      console.error('Error fetching teachers:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'classId' || name === 'teacherId') 
        ? (value === '0' || value === '' ? undefined : Number(value))
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.subjectName.trim()) {
      setError('Subject name is required');
      return;
    }

    if (!formData.classId || formData.classId === 0) {
      setError('Please select a class');
      return;
    }

    if (!formData.teacherId || formData.teacherId === 0) {
      setError('Please select a teacher');
      return;
    }

    try {
      setLoading(true);

      if (editingSubject) {
        await SubjectService.updateSubject(editingSubject.id!, formData);
        setSuccess('Subject updated successfully!');
      } else {
        await SubjectService.createSubject(formData);
        setSuccess('Subject created successfully!');
      }

      // Reset form
      setFormData({
        subjectName: '',
        classId: 0,
        teacherId: 0
      });
      setShowForm(false);
      setEditingSubject(null);

      // Refresh subjects list
      await fetchSubjects();
    } catch (err: any) {
      setError(err.message || 'Failed to save subject');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject: SubjectResponse) => {
    setEditingSubject(subject);
    setFormData({
      subjectName: subject.subjectName,
      classId: subject.classId,
      teacherId: subject.teacherId || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (subjectId: number, classId: number) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      setLoading(true);
      await SubjectService.deleteSubject(subjectId, classId);
      setSuccess('Subject deleted successfully!');
      await fetchSubjects();
    } catch (err: any) {
      setError(err.message || 'Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSubject(null);
    setFormData({
      subjectName: '',
      classId: 0,
      teacherId: 0
    });
  };

  const getClassName = (classId: number) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.className : 'Unknown';
  };

  return (
    <div className="subject-management">
      <div className="subject-header">
        <h2>Subject Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add New Subject'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showForm && (
        <div className="subject-form-container">
          <h3>{editingSubject ? 'Edit Subject' : 'Create New Subject'}</h3>
          <form onSubmit={handleSubmit} className="subject-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subjectName">Subject Name *</label>
                <input
                  type="text"
                  id="subjectName"
                  name="subjectName"
                  value={formData.subjectName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter subject name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="classId">Select Class *</label>
                <select
                  id="classId"
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="0">-- Select a Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} ({cls.sessionName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="teacherId">Assign Teacher *</label>
              <select
                id="teacherId"
                name="teacherId"
                value={formData.teacherId}
                required
                onChange={handleInputChange}
              >
                <option value="0">-- No Teacher Assigned --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="subjects-list">
        <h3>All Subjects</h3>
        {loading && !showForm && <div className="loading">Loading subjects...</div>}
        
        {!loading && subjects.length === 0 && (
          <div className="no-data">No subjects found. Create your first subject!</div>
        )}

        <div className="subjects-table-container">
          {subjects.length > 0 && (
            <table className="subjects-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Class</th>
                  <th>Teacher</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="subject-name">{subject.subjectName}</td>
                    <td>{subject.className || getClassName(subject.classId)}</td>
                    <td>{subject.teacherName || 'Not Assigned'}</td>
                    <td className="subject-actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(subject)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(subject.id, subject.classId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectManagement;
