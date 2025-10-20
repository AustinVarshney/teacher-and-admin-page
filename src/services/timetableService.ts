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
  static async getTimetableByClass(classId: string | number, day?: string) {
    try {
      console.log('TimetableService.getTimetableByClass called with:', classId, 'Type:', typeof classId);
      
      if (!classId || classId === 'undefined' || classId === undefined) {
        throw new Error('Invalid classId provided to getTimetableByClass');
      }
      
      // Backend endpoint is /timetables/class/{classId}/timetable with optional day param
      const dayParam = day ? `?day=${day}` : '';
      const response = await api.get(`/timetables/class/${classId}/timetable${dayParam}`);
      
      if (response.status >= 200 && response.status < 300) {
        const timetableData = response.data.data || [];
        
        // Map the data to ensure all fields are present
        // IMPORTANT: Use the period number from backend, don't recalculate it
        const mappedData = timetableData.map((slot: any) => ({
          ...slot,
          day: slot.day || slot.dayOfWeek, // Use enum value or string fallback
          period: slot.period || 1, // Use period from backend directly
          subjectName: slot.subjectName || 'Unknown Subject',
          teacherName: slot.teacherName || 'Unknown Teacher'
        }));
        
        console.log('📅 Mapped timetable data:', mappedData);
        return mappedData;
      }
      throw new Error(response.data.message || 'Failed to fetch class timetable');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch class timetable';
      console.error('Error fetching timetable:', message);
      throw new Error(message);
    }
  }

  // Helper to calculate period number from start time
  // Assumes school starts at 08:00, each period is ~45-60 mins
  // @ts-ignore - Used for future feature
  private static calculatePeriodNumber(startTime: string): number {
    if (!startTime) return 1;
    
    // Parse time string (format: "HH:mm:ss" or "HH:mm")
    const timeParts = startTime.split(':');
    const hours = parseInt(timeParts[0]);
    const minutes = parseInt(timeParts[1]);
    
    // Convert to minutes from midnight
    const totalMinutes = hours * 60 + minutes;
    
    // Assume school starts at 8 AM (480 minutes)
    const schoolStartMinutes = 8 * 60; // 480
    const minutesFromStart = totalMinutes - schoolStartMinutes;
    
    // Assume ~50 minutes per period (including short breaks)
    const periodDuration = 50;
    
    // Calculate period (1-based)
    const period = Math.floor(minutesFromStart / periodDuration) + 1;
    
    return Math.max(1, Math.min(period, 8)); // Clamp between 1 and 8
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