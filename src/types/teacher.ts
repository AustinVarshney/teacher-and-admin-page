export interface Teacher {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  qualification: string;
  designation: string;
  currentSchool: string;
  profilePhoto?: string;
  personalInfo: {
    address: string;
    emergencyContact: string;
    bloodGroup: string;
    dateOfBirth: string;
    joiningDate: string;
  };
}

export interface Notification {
  id: string;
  type: 'tc_approval' | 'admin_message' | 'system_update' | 'student_query';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedData?: {
    studentId?: string;
    studentName?: string;
    tcRequestId?: string;
    adminId?: string;
    adminName?: string;
  };
}

export interface TCApprovalRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  section: string;
  reason: string;
  requestDate: string;
  adminMessage: string;
  adminName: string;
  status: 'pending' | 'approved' | 'rejected';
  teacherResponse?: string;
  responseDate?: string;
}

export interface AssignedClass {
  id: string;
  className: string;
  section: string;
  subject: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  totalStudents: number;
}

export interface StudentQuery {
  id: string;
  studentName: string;
  studentClass: string;
  section: string;
  subject: string;
  question: string;
  timestamp: string;
  status: 'pending' | 'replied';
  reply?: string;
  replyTimestamp?: string;
}

export interface VideoLecture {
  id: string;
  title: string;
  className: string;
  section: string;
  subject: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  uploadDate: string;
  duration: string;
  views: number;
}

export interface LeaveRequest {
  id: string;
  studentName: string;
  studentClass: string;
  section: string;
  reason: string;
  startDate: string;
  endDate: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  imageUrl?: string;
  teacherRemarks?: string;
}

export interface StudentResult {
  id: string;
  studentName: string;
  studentClass: string;
  section: string;
  subject: string;
  examType: string;
  examDate: string;
  marks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
}

export interface ClassStudent {
  id: string;
  name: string;
  parentName: string;
  mobileNumber: string;
  currentClass: string;
  section: string;
  feeStatus: 'paid' | 'pending' | 'overdue';
  attendance: {
    present: number;
    absent: number;
    total: number;
  };
  performance: {
    averageScore: number;
    grade: string;
  };
} 