import { api } from './api';

// Interface definitions
interface ExamData {
  [key: string]: any;
}

interface ResultData {
  [key: string]: any;
}

export class ExamService {
  // Create exam
  static async createExam(examData: ExamData) {
    try {
      const response = await api.post('/exams', examData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create exam');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create exam';
      throw new Error(message);
    }
  }

  // Update exam
  static async updateExam(id: string | number, examData: ExamData) {
    try {
      const response = await api.put(`/exams/${id}`, examData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update exam');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update exam';
      throw new Error(message);
    }
  }

  // Get exam by ID
  static async getExamById(id: string | number) {
    try {
      const response = await api.get(`/exams/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch exam');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch exam';
      throw new Error(message);
    }
  }

  // Get all exams
  static async getAllExams() {
    try {
      const response = await api.get('/exams');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch exams');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch exams';
      throw new Error(message);
    }
  }

  // Get exams by class
  static async getExamsByClass(classId: string | number) {
    try {
      const response = await api.get(`/exams/class/${classId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch class exams');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class exams';
      throw new Error(message);
    }
  }

  // Delete exam
  static async deleteExam(id: string | number) {
    try {
      const response = await api.delete(`/exams/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return true;
      }
      throw new Error(response.data.message || 'Failed to delete exam');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete exam';
      throw new Error(message);
    }
  }

  // Submit exam result
  static async submitExamResult(examId: string | number, resultData: ResultData) {
    try {
      const response = await api.post(`/exams/${examId}/results`, resultData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to submit exam result');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to submit exam result';
      throw new Error(message);
    }
  }

  // Get exam results
  static async getExamResults(examId: string | number) {
    try {
      const response = await api.get(`/exams/${examId}/results`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch exam results');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch exam results';
      throw new Error(message);
    }
  }
}

export default ExamService;