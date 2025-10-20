import { api, RestResponse } from './api';

// ExamType interfaces
export interface ExamType {
  id: number;
  name: string;
  description?: string;
}

export interface ExamTypeRequest {
  name: string;
  description?: string;
}

// ClassExam interfaces
export interface ClassExam {
  id: number;
  classId: number;
  className?: string;
  examTypeId: number;
  examTypeName?: string;
  examDate?: string;
}

export interface ClassExamBulkRequest {
  examTypeId: number;
  classIds: number[];
  examDate?: string;
}

export class ExamTypeService {
  // ========== EXAM TYPE CRUD ==========
  
  // Create exam type
  static async createExamType(examType: ExamTypeRequest): Promise<ExamType> {
    try {
      const response = await api.post<RestResponse<ExamType>>('/exam-types', examType);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create exam type');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create exam type';
      throw new Error(message);
    }
  }

  // Get all exam types
  static async getAllExamTypes(): Promise<ExamType[]> {
    try {
      const response = await api.get<RestResponse<ExamType[]>>('/exam-types');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch exam types');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch exam types';
      throw new Error(message);
    }
  }

  // Get exam type by ID
  static async getExamTypeById(id: number): Promise<ExamType> {
    try {
      const response = await api.get<RestResponse<ExamType>>(`/exam-types/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch exam type');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch exam type';
      throw new Error(message);
    }
  }

  // Update exam type
  static async updateExamType(id: number, examType: ExamTypeRequest): Promise<ExamType> {
    try {
      const response = await api.put<RestResponse<ExamType>>(`/exam-types/${id}`, examType);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update exam type');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update exam type';
      throw new Error(message);
    }
  }

  // Delete exam type
  static async deleteExamType(id: number): Promise<void> {
    try {
      const response = await api.delete(`/exam-types/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      throw new Error(response.data.message || 'Failed to delete exam type');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete exam type';
      throw new Error(message);
    }
  }

  // ========== CLASS EXAM ASSIGNMENT ==========

  // Assign exam type to multiple classes (bulk)
  static async assignExamTypeToClasses(request: ClassExamBulkRequest): Promise<ClassExam[]> {
    try {
      const response = await api.post<RestResponse<ClassExam[]>>('/class-exams/bulk', request);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to assign exam type to classes');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to assign exam type to classes';
      throw new Error(message);
    }
  }

  // Get all class exams
  static async getAllClassExams(): Promise<ClassExam[]> {
    try {
      const response = await api.get<RestResponse<ClassExam[]>>('/class-exams');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch class exams');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class exams';
      throw new Error(message);
    }
  }

  // Get class exams by exam type
  static async getClassExamsByExamType(examTypeId: number): Promise<ClassExam[]> {
    try {
      const response = await api.get<RestResponse<ClassExam[]>>(`/class-exams/exam-type/${examTypeId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch class exams');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class exams';
      throw new Error(message);
    }
  }

  // Get class exams by class
  static async getClassExamsByClass(classId: number): Promise<ClassExam[]> {
    try {
      const response = await api.get<RestResponse<ClassExam[]>>(`/class-exams/class/${classId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch class exams');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class exams';
      throw new Error(message);
    }
  }

  // Delete class exam assignment
  static async deleteClassExam(classExamId: number): Promise<void> {
    try {
      const response = await api.delete(`/class-exams/${classExamId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      throw new Error(response.data.message || 'Failed to delete class exam assignment');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete class exam assignment';
      throw new Error(message);
    }
  }
}

export default ExamTypeService;
