import { api } from './api';

export interface ClassExamAssignment {
  classId: number;
  maxMarks: number;
  passingMarks: number;
  examDate?: string; // Optional - format: YYYY-MM-DD
}

export interface ClassExamBulkRequest {
  examTypeId: number;
  classExams: ClassExamAssignment[]; // Changed from 'assignments' to match backend DTO
}

export interface ClassExamResponse {
  id: number;
  classId: number;
  className?: string;
  examTypeId: number;
  examTypeName?: string;
  maxMarks: number;
  passingMarks: number;
  examDate?: string;
}

export interface ClassExamUpdateDto {
  maxMarks: number;
  passingMarks: number;
}

export class ClassExamService {
  // Assign exam type to multiple classes (bulk assignment)
  static async assignExamToClasses(request: ClassExamBulkRequest): Promise<string> {
    try {
      const response = await api.post('/class-exams/assign', request);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.message || 'Exam assigned successfully';
      }
      throw new Error(response.data.message || 'Failed to assign exam to classes');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to assign exam to classes';
      throw new Error(message);
    }
  }

  // Get exams assigned to a class
  static async getExamsByClass(classId: number): Promise<ClassExamResponse[]> {
    try {
      const response = await api.get(`/class-exams/class/${classId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch class exams');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class exams';
      throw new Error(message);
    }
  }

  // Get classes assigned to an exam type
  static async getClassesByExamType(examTypeId: number): Promise<ClassExamResponse[]> {
    try {
      const response = await api.get(`/class-exams/exam-type/${examTypeId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch exam classes');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch exam classes';
      console.error('Error fetching classes for exam:', message);
      return []; // Return empty array on error instead of throwing
    }
  }

  // Update class exam assignment
  static async updateClassExam(
    classId: number,
    examTypeId: number,
    updateData: ClassExamUpdateDto
  ): Promise<string> {
    try {
      const response = await api.put(`/class-exams/${classId}/${examTypeId}`, updateData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.message || 'Class exam updated successfully';
      }
      throw new Error(response.data.message || 'Failed to update class exam');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update class exam';
      throw new Error(message);
    }
  }

  // Delete (unassign) exam from class
  static async deleteClassExam(classId: number, examTypeId: number): Promise<string> {
    try {
      const response = await api.delete(`/class-exams/${classId}/${examTypeId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.message || 'Exam unassigned from class successfully';
      }
      throw new Error(response.data.message || 'Failed to unassign exam from class');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to unassign exam from class';
      throw new Error(message);
    }
  }
}

export default ClassExamService;
