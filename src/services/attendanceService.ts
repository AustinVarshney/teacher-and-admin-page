import { api } from './api';

// Interface definitions
interface AttendanceData {
  [key: string]: any;
}

export class AttendanceService {
  // Mark attendance
  static async markAttendance(attendanceData: AttendanceData) {
    try {
      const response = await api.post('/attendance', attendanceData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to mark attendance');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to mark attendance';
      throw new Error(message);
    }
  }

  // Get attendance by class and date
  static async getAttendanceByClassAndDate(classId: string | number, date: string) {
    try {
      const response = await api.get(`/attendance/class/${classId}/date/${date}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch attendance');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch attendance';
      throw new Error(message);
    }
  }

  // Get current student's attendance records
  static async getCurrentStudentAttendance(month?: string) {
    try {
      const params = month ? `?month=${month}` : '';
      const response = await api.get(`/attendance/me${params}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch attendance');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch attendance';
      throw new Error(message);
    }
  }

  // Get student attendance history
  static async getStudentAttendance(studentId: string | number, startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/attendance/student/${studentId}?${params.toString()}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch student attendance');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch student attendance';
      throw new Error(message);
    }
  }

  // Update attendance
  static async updateAttendance(attendanceId: string | number, attendanceData: AttendanceData) {
    try {
      const response = await api.put(`/attendance/${attendanceId}`, attendanceData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update attendance');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update attendance';
      throw new Error(message);
    }
  }

  // Get class attendance summary
  static async getClassAttendanceSummary(classId: string | number, month?: number, year?: number) {
    try {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());

      const response = await api.get(`/attendance/class/${classId}/summary?${params.toString()}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch attendance summary');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch attendance summary';
      throw new Error(message);
    }
  }
}

export default AttendanceService;