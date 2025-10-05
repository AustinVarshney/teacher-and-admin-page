import { api } from './api';

// Interface definitions
export interface LeaveRequestData {
  id?: number;
  studentPan?: string;
  studentName?: string;
  studentClass?: string;
  section?: string;
  reason: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  requestDate?: string;
  status?: 'pending' | 'approved' | 'rejected';
  imageUrl?: string;
  teacherRemarks?: string;
  classId?: number;
}

export interface LeaveRequestFilter {
  page?: number;
  size?: number;
  status?: string;
  classId?: number;
  startDate?: string;
  endDate?: string;
}

export class LeaveService {
  // Get all leave requests for teacher's classes
  static async getLeaveRequestsForTeacher(filter: LeaveRequestFilter = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filter.page !== undefined) params.append('page', filter.page.toString());
      if (filter.size !== undefined) params.append('size', filter.size.toString());
      if (filter.status) params.append('status', filter.status);
      if (filter.classId) params.append('classId', filter.classId.toString());
      if (filter.startDate) params.append('startDate', filter.startDate);
      if (filter.endDate) params.append('endDate', filter.endDate);

      const response = await api.get(`/leave-requests/teacher?${params.toString()}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch leave requests');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave requests';
      throw new Error(message);
    }
  }

  // Get leave request by ID
  static async getLeaveRequestById(id: number) {
    try {
      const response = await api.get(`/leave-requests/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave request';
      throw new Error(message);
    }
  }

  // Get leave requests by class
  static async getLeaveRequestsByClass(classId: number, status?: string) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await api.get(`/leave-requests/class/${classId}?${params.toString()}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch leave requests');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave requests';
      throw new Error(message);
    }
  }

  // Get leave requests by student PAN
  static async getLeaveRequestsByStudent(panNumber: string) {
    try {
      const response = await api.get(`/leave-requests/student/${panNumber}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch leave requests');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch leave requests';
      throw new Error(message);
    }
  }

  // Approve leave request
  static async approveLeaveRequest(id: number, teacherRemarks?: string) {
    try {
      const response = await api.put(`/leave-requests/${id}/approve`, {
        teacherRemarks: teacherRemarks || 'Approved'
      });
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to approve leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to approve leave request';
      throw new Error(message);
    }
  }

  // Reject leave request
  static async rejectLeaveRequest(id: number, teacherRemarks?: string) {
    try {
      const response = await api.put(`/leave-requests/${id}/reject`, {
        teacherRemarks: teacherRemarks || 'Rejected'
      });
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to reject leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to reject leave request';
      throw new Error(message);
    }
  }

  // Create leave request (for admin or teacher creating on behalf of student)
  static async createLeaveRequest(leaveData: LeaveRequestData) {
    try {
      const response = await api.post('/leave-requests', leaveData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create leave request';
      throw new Error(message);
    }
  }

  // Update leave request
  static async updateLeaveRequest(id: number, leaveData: LeaveRequestData) {
    try {
      const response = await api.put(`/leave-requests/${id}`, leaveData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update leave request';
      throw new Error(message);
    }
  }

  // Delete leave request
  static async deleteLeaveRequest(id: number) {
    try {
      const response = await api.delete(`/leave-requests/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to delete leave request');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete leave request';
      throw new Error(message);
    }
  }

  // Get pending leave requests count for teacher
  static async getPendingLeaveRequestsCount() {
    try {
      const response = await api.get('/leave-requests/teacher/pending-count');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || 0;
      }
      throw new Error(response.data.message || 'Failed to fetch pending count');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch pending count';
      throw new Error(message);
    }
  }
}

export default LeaveService;
