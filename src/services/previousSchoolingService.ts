import { api } from './api';

export interface ExamResultSummary {
  examName: string;
  examDate: string | null;
  percentage: number;
  grade: string;
  obtainedMarks: number;
  totalMarks: number;
}

export interface PreviousSchoolingRecord {
  sessionId: number;
  sessionName: string;
  className: string;
  section: string;
  passingYear: number;
  status: 'COMPLETED' | 'TRANSFERRED' | 'CURRENT';
  overallPercentage: number;
  overallGrade: string;
  totalPresent: number;
  totalAbsent: number;
  attendancePercentage: number;
  examResults: ExamResultSummary[];
}

export class PreviousSchoolingService {
  /**
   * Get previous schooling records for the currently logged-in student
   */
  static async getMyPreviousSchoolingRecords(): Promise<PreviousSchoolingRecord[]> {
    try {
      const response = await api.get('/students/me/previous-schooling');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      
      throw new Error(response.data.message || 'Failed to fetch previous schooling records');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch previous schooling records';
      console.error('Error fetching previous schooling records:', message);
      throw new Error(message);
    }
  }
}

export default PreviousSchoolingService;
