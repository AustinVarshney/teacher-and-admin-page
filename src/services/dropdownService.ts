import { api } from './api';

// Interface definitions for dropdown data
export interface ClassOption {
  id: number;
  className: string;
  section?: string;
}

export interface SessionOption {
  id: number;
  name: string;  // Backend returns 'name' not 'sessionName'
  sessionName?: string;  // Optional for backwards compatibility
  startDate: string;
  endDate: string;
  active: boolean;  // Backend returns 'active' not 'isActive'
  isActive?: boolean;  // Optional for backwards compatibility
}

export interface ClassInfoResponse {
  id: number;
  className: string;
  feeAmount: number;
  studentCount: number;
  sessionId: number;
  sessionName: string;
}

export class DropdownService {
  // Get all classes (now with public endpoint access)
  static async getAllClasses(): Promise<ClassInfoResponse[]> {
    try {
      const response = await api.get('/classes');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch classes');
    } catch (error: any) {
      console.error('Failed to fetch classes from API:', error);
      // Return empty array - no fallback data to avoid mismatched IDs
      return [];
    }
  }

  // Get all sessions (now with public endpoint access)
  static async getAllSessions(): Promise<SessionOption[]> {
    try {
      const response = await api.get('/sessions');
      
      if (response.status >= 200 && response.status < 300) {
        const sessions = response.data.data || [];
        // Transform backend fields to match frontend expectations
        return sessions.map((session: any) => ({
          ...session,
          sessionName: session.name,  // Map 'name' to 'sessionName'
          isActive: session.active     // Map 'active' to 'isActive'
        }));
      }
      throw new Error(response.data.message || 'Failed to fetch sessions');
    } catch (error: any) {
      console.error('Failed to fetch sessions from API:', error);
      // Return empty array - no fallback data to avoid mismatched IDs
      return [];
    }
  }

  // Get active session
  static async getActiveSession(): Promise<SessionOption | null> {
    try {
      const sessions = await this.getAllSessions();
      // Check both 'isActive' and 'active' for compatibility
      return sessions.find(session => session.isActive || session.active) || null;
    } catch (error: any) {
      console.error('Failed to fetch active session:', error);
      return null;
    }
  }

  // Transform classes for dropdown usage
  static transformClassesForDropdown(classes: ClassInfoResponse[]): ClassOption[] {
    return classes.map(cls => ({
      id: cls.id,
      className: cls.className,
      section: undefined // Add section if available in backend
    }));
  }

  // Transform sessions for dropdown usage  
  static transformSessionsForDropdown(sessions: SessionOption[]): Array<{id: number; name: string; isActive: boolean}> {
    return sessions.map(session => ({
      id: session.id,
      name: session.sessionName || session.name || '',
      isActive: session.isActive || session.active || false
    }));
  }
}

export default DropdownService;
