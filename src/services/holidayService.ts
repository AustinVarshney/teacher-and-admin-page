import { api } from './api';

export interface Holiday {
  id?: number;
  occasion?: string;     // Backend field name
  startDate?: string;    // Backend field name
  endDate?: string;      // Backend field name
  title?: string;        // Frontend display
  date?: string;         // Frontend display
  description?: string;
  sessionId?: number;
}

export class HolidayService {
  // Get all holidays
  static async getAllHolidays() {
    try {
      const response = await api.get('/calendar');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data || [];
      }
      throw new Error(response.data.message || 'Failed to fetch holidays');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch holidays';
      throw new Error(message);
    }
  }

  // Get holiday by ID
  static async getHolidayById(id: number | string) {
    try {
      const response = await api.get(`/calendar/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch holiday');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch holiday';
      throw new Error(message);
    }
  }

  // Create holiday
  static async createHoliday(holidayData: Holiday) {
    try {
      // Transform frontend format to backend format
      const backendData = {
        occasion: holidayData.title || holidayData.occasion,
        startDate: holidayData.startDate || holidayData.date,
        endDate: holidayData.endDate || holidayData.startDate || holidayData.date,
        sessionId: holidayData.sessionId
      };
      
      const response = await api.post('/calendar', backendData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create holiday');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create holiday';
      throw new Error(message);
    }
  }

  // Update holiday
  static async updateHoliday(id: number | string, holidayData: Holiday) {
    try {
      // Transform frontend format to backend format
      const backendData = {
        occasion: holidayData.title || holidayData.occasion,
        startDate: holidayData.startDate || holidayData.date,
        endDate: holidayData.endDate || holidayData.startDate || holidayData.date,
        sessionId: holidayData.sessionId
      };
      
      const response = await api.put(`/calendar/${id}`, backendData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update holiday');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update holiday';
      throw new Error(message);
    }
  }

  // Delete holiday
  static async deleteHoliday(id: number | string) {
    try {
      const response = await api.delete(`/calendar/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return true;
      }
      throw new Error(response.data.message || 'Failed to delete holiday');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete holiday';
      throw new Error(message);
    }
  }
}

export default HolidayService;
