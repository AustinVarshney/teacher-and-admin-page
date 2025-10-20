import { api } from './api';

// Student Leave Request Interfaces
export interface StudentLeaveRequestData {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  reason: string;
}

export interface StudentLeaveResponse {
  id: number;
  studentPan: string;
  studentName?: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  classTeacherName?: string;
  classTeacherResponse?: string;
  sessionName?: string;
  processedAt?: string;
  createdAt?: string;
}

export interface LeaveActionRequest {
  status: 'APPROVED' | 'REJECTED';
  responseMessage: string;
}

// Staff Leave Request Interfaces
export interface StaffLeaveRequestData {
  teacherId: number;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface StaffLeaveResponse {
  id: number;
  teacherId: number;
  teacherName?: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminResponse?: string;
  processedBy?: string;
  processedAt?: string;
  sessionId?: number;
  sessionName?: string;
  totalLeavesAllowed?: number;
  remainingLeavesBalance?: number;
}

export interface StaffLeaveStatusUpdate {
  status: 'APPROVED' | 'REJECTED';
  adminResponse: string;
}

export class LeaveService {
  // ============ STUDENT LEAVE REQUESTS ============
  
  // Student: Request leave
  static async createStudentLeaveRequest(leaveData: StudentLeaveRequestData): Promise<void> {
    try {
      const response = await api.post('/leave/request', leaveData);
      
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      throw new Error(response.data.message || 'Failed to create leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create leave request';
      throw new Error(message);
    }
  }

  // Student: Get my leave requests
  static async getMyStudentLeaves(): Promise<StudentLeaveResponse[]> {
    try {
      const response = await api.get('/leave/my');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch leave requests');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave requests';
      throw new Error(message);
    }
  }

  // Teacher: Get student leave requests assigned to me
  static async getStudentLeavesForTeacher(status?: string): Promise<StudentLeaveResponse[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/leave/teacher${params}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch leave requests');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave requests';
      throw new Error(message);
    }
  }

  // Teacher: Take action on student leave request
  static async takeActionOnStudentLeave(leaveId: number, action: LeaveActionRequest): Promise<void> {
    try {
      const response = await api.put(`/leave/action/${leaveId}`, action);
      
      if (response.status >= 200 && response.status < 300) {
        return;
      }
      throw new Error(response.data.message || 'Failed to update leave status');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update leave status';
      throw new Error(message);
    }
  }

  // ============ STAFF/TEACHER LEAVE REQUESTS ============
  
  // Teacher: Request leave
  static async createStaffLeaveRequest(leaveData: StaffLeaveRequestData): Promise<string> {
    try {
      const response = await api.post('/staff-leaves/request', leaveData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || 'Leave request submitted successfully';
      }
      throw new Error(response.data.message || 'Failed to create leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create leave request';
      throw new Error(message);
    }
  }

  // Teacher: Get my leave requests
  static async getMyStaffLeaves(status?: string): Promise<StaffLeaveResponse[]> {
    try {
      const params = status ? `?status=${status}` : '';
      const response = await api.get(`/staff-leaves/my-leaves${params}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch leave requests');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave requests';
      throw new Error(message);
    }
  }

  // Admin: Get all staff leave requests
  static async getAllStaffLeavesForAdmin(
    status?: string, 
    sessionId?: number, 
    teacherId?: number
  ): Promise<StaffLeaveResponse[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (sessionId) params.append('sessionId', sessionId.toString());
      if (teacherId) params.append('teacherId', teacherId.toString());

      const queryString = params.toString();
      const response = await api.get(`/staff-leaves${queryString ? '?' + queryString : ''}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch leave requests');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave requests';
      throw new Error(message);
    }
  }

  // Admin: Update staff leave status
  static async updateStaffLeaveStatus(leaveId: number, statusUpdate: StaffLeaveStatusUpdate): Promise<string> {
    try {
      const response = await api.put(`/staff-leaves/${leaveId}/status`, statusUpdate);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || 'Leave status updated successfully';
      }
      throw new Error(response.data.message || 'Failed to update leave status');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update leave status';
      throw new Error(message);
    }
  }

  // ============ LEAVE ALLOWANCE ============
  
  // Get my leave allowance (for teachers/staff)
  static async getMyLeaveAllowance(): Promise<LeaveAllowanceInfo> {
    try {
      const response = await api.get('/staff-leave-allowances/me');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch leave allowance');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave allowance';
      throw new Error(message);
    }
  }
}

// Leave Allowance Interface
export interface LeaveAllowanceInfo {
  id: number;
  staffId: number;
  staffName?: string;
  sessionId: number;
  sessionName?: string;
  allowedLeaves: number;
  leavesUsed: number;
  remainingLeaves: number;
}

export default LeaveService;
