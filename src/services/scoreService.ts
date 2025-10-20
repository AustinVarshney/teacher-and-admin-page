import { api } from './api';

// Interface definitions matching backend DTOs
export interface StudentScoreEntry {
  studentPanNumber: string;
  studentName: string;
  marks: number | null;
  grade: string;
}

export interface BulkScoreUpdateDTO {
  examId: number | null; // Nullable to support ClassExam-based scores
  classId: number;
  subjectId: number;
  scores: StudentScoreEntry[];
}

export interface ScoreResponseDTO {
  id: number;
  studentPanNumber: string;
  studentName: string;
  subjectId: number;
  subjectName: string;
  examId: number;
  examType: string;
  marks: number;
  maxMarks: number;
  grade: string;
  percentage: number;
}

export interface SubjectResult {
  subjectName: string;
  marks: number;
  maxMarks: number;
  grade: string;
  percentage: number;
}

export interface ExamResults {
  examType: string;
  examId: number;
  subjects: SubjectResult[];
  totalMarks: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
}

export interface StudentResultsDTO {
  studentPanNumber: string;
  studentName: string;
  className: string;
  examResults: ExamResults[];
}

export interface ClassStudentResult {
  studentPanNumber: string;
  studentName: string;
  subjects: SubjectResult[];
  totalMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  rank: number;
}

export interface ClassResultsDTO {
  classId: number;
  className: string;
  examId: number;
  examType: string;
  studentResults: ClassStudentResult[];
}

export class ScoreService {
  /**
   * Bulk update scores for multiple students in a class for a specific exam and subject
   */
  static async bulkUpdateScores(bulkScoreData: BulkScoreUpdateDTO): Promise<ScoreResponseDTO[]> {
    try {
      const response = await api.post('/results/bulk-update', bulkScoreData);
      
      if (response.status >= 200 && response.status < 300) {
        // Extract from RestResponse wrapper
        return response.data.data || response.data || [];
      }
      throw new Error('Failed to update scores');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update scores';
      throw new Error(message);
    }
  }

  /**
   * Get all results for a specific class and exam
   */
  static async getClassResultsForExam(classId: number, examId: number): Promise<ClassResultsDTO> {
    try {
      const response = await api.get(`/results/class/${classId}/exam/${examId}`);
      
      if (response.status >= 200 && response.status < 300) {
        // Extract from RestResponse wrapper
        return response.data.data || response.data;
      }
      throw new Error('Failed to fetch class results');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class results';
      throw new Error(message);
    }
  }

  /**
   * Get all exam results for a specific student across all exams
   */
  static async getStudentAllResults(panNumber: string): Promise<StudentResultsDTO> {
    try {
      const response = await api.get(`/results/student/${panNumber}`);
      
      if (response.status >= 200 && response.status < 300) {
        // Extract from RestResponse wrapper
        return response.data.data || response.data;
      }
      throw new Error('Failed to fetch student results');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch student results';
      throw new Error(message);
    }
  }

  /**
   * Get scores filtered by class, subject, and exam
   * Useful for viewing/editing scores for a specific subject in a specific exam
   */
  static async getScoresByClassSubjectAndExam(
    classId: number,
    subjectId: number,
    examId: number
  ): Promise<ScoreResponseDTO[]> {
    try {
      const response = await api.get(
        `/results/class/${classId}/subject/${subjectId}/exam/${examId}`
      );
      
      if (response.status >= 200 && response.status < 300) {
        // Extract from RestResponse wrapper
        return response.data.data || response.data || [];
      }
      throw new Error('Failed to fetch scores');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch scores';
      throw new Error(message);
    }
  }

  /**
   * Calculate grade based on percentage
   */
  static calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  /**
   * Calculate percentage
   */
  static calculatePercentage(marks: number, maxMarks: number): number {
    if (maxMarks === 0) return 0;
    return (marks / maxMarks) * 100;
  }
}

export default ScoreService;
