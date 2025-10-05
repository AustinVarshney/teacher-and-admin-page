import { api } from './api';

// Interface definitions
interface TimetableEntryData {
  [key: string]: any;
}

export class TimetableService {
  // Create timetable entry
  static async createTimetableEntry(entryData: TimetableEntryData) {
    try {
      const response = await api.post('/timetables', entryData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create timetable entry');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create timetable entry';
      throw new Error(message);
    }
  }

  // Update timetable entry
  static async updateTimetableEntry(id: string | number, entryData: TimetableEntryData) {
    try {
      const response = await api.put(`/timetables/${id}`, entryData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update timetable entry');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update timetable entry';
      throw new Error(message);
    }
  }

  // Get timetable entry by ID
  static async getTimetableEntryById(id: string | number) {
    try {
      const response = await api.get(`/timetables/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch timetable entry');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch timetable entry';
      throw new Error(message);
    }
  }

  // Delete timetable entry
  static async deleteTimetableEntry(id: string | number) {
    try {
      const response = await api.delete(`/timetables/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return true;
      }
      throw new Error(response.data.message || 'Failed to delete timetable entry');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete timetable entry';
      throw new Error(message);
    }
  }

  // Get timetable by class
  static async getTimetableByClass(classId: string | number) {
    try {
      console.log('TimetableService.getTimetableByClass called with:', classId, 'Type:', typeof classId);
      
      if (!classId || classId === 'undefined' || classId === undefined) {
        throw new Error('Invalid classId provided to getTimetableByClass');
      }
      
      const response = await api.get(`/timetables/class/${classId}/timetable`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch class timetable');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class timetable';
      throw new Error(message);
    }
  }

  // Get timetable by teacher
  static async getTimetableByTeacher(teacherId: string | number) {
    try {
      const response = await api.get(`/timetables/teacher/${teacherId}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch teacher timetable');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch teacher timetable';
      throw new Error(message);
    }
  }
}

export default TimetableService;