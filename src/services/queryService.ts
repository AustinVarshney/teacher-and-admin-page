import { api } from './api';

// ============ STUDENT QUERY INTERFACES ============
export interface StudentQueryRequest {
  teacherId: number;
  subject: string;
  content: string;
}

export interface StudentQueryResponse {
  id: number;
  studentId?: number;
  studentName?: string;
  teacherId: number;
  teacherName?: string;
  subject: string;
  content: string;
  response?: string;
  status: 'OPEN' | 'RESPONDED' | 'CLOSED';
  createdAt?: string;
  respondedAt?: string;
}

export interface TeacherResponseDto {
  queryId: number;
  response: string;
}

// ============ TEACHER QUERY INTERFACES ============
export interface TeacherQueryRequest {
  subject: string;
  content: string;
}

export interface TeacherQueryResponse {
  id: number;
  teacherId?: number;
  teacherName?: string;
  adminId?: number;
  adminName?: string;
  subject: string;
  content: string;
  response?: string;
  status: 'OPEN' | 'RESPONDED' | 'CLOSED';
  createdAt?: string;
  respondedAt?: string;
}

export interface AdminResponseDto {
  queryId: number;
  response: string;
}

export class QueryService {
  // ============ STUDENT QUERY METHODS ============
  
  // Student: Raise a query to a teacher
  static async raiseStudentQuery(queryData: StudentQueryRequest): Promise<StudentQueryResponse> {
    try {
      const response = await api.post('/student-query/me', queryData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to raise query');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to raise query';
      throw new Error(message);
    }
  }

  // Student: Get all my queries
  static async getMyStudentQueries(status?: string): Promise<StudentQueryResponse[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/student-query/me${params}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch queries');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch queries';
      throw new Error(message);
    }
  }

  // Teacher: Get all student queries assigned to me
  static async getStudentQueriesForTeacher(status?: string): Promise<StudentQueryResponse[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/student-query/teacher/queries${params}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch queries');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch queries';
      throw new Error(message);
    }
  }

  // Teacher: Respond to a student query
  static async respondToStudentQuery(responseData: TeacherResponseDto): Promise<StudentQueryResponse> {
    try {
      const response = await api.put('/student-query/respond', responseData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to respond to query');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to respond to query';
      throw new Error(message);
    }
  }

  // ============ TEACHER QUERY METHODS ============
  
  // Teacher: Raise a query to admin
  static async raiseTeacherQuery(queryData: TeacherQueryRequest): Promise<TeacherQueryResponse> {
    try {
      const response = await api.post('/teacher-query/me', queryData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to raise query');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to raise query';
      throw new Error(message);
    }
  }

  // Teacher: Get all my queries to admin
  static async getMyTeacherQueries(status?: string): Promise<TeacherQueryResponse[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/teacher-query/me${params}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch queries');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch queries';
      throw new Error(message);
    }
  }

  // Admin: Get all teacher queries assigned to me
  static async getTeacherQueriesForAdmin(status?: string): Promise<TeacherQueryResponse[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/teacher-query/admin/queries${params}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch queries');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch queries';
      throw new Error(message);
    }
  }

  // Admin: Respond to a teacher query
  static async respondToTeacherQuery(responseData: AdminResponseDto): Promise<TeacherQueryResponse> {
    try {
      const response = await api.put('/teacher-query/respond', responseData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to respond to query');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to respond to query';
      throw new Error(message);
    }
  }
}

export default QueryService;
