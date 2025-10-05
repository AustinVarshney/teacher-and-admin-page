import { api } from './api';

// Interface definitions
interface EventData {
  [key: string]: any;
}

export class EventService {
  // Create event
  static async createEvent(eventData: EventData) {
    try {
      const response = await api.post('/events', eventData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create event');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create event';
      throw new Error(message);
    }
  }

  // Update event
  static async updateEvent(id: string | number, eventData: EventData) {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update event');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update event';
      throw new Error(message);
    }
  }

  // Get event by ID
  static async getEventById(id: string | number) {
    try {
      const response = await api.get(`/events/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch event');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch event';
      throw new Error(message);
    }
  }

  // Get all events
  static async getAllEvents() {
    try {
      const response = await api.get('/events');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch events');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch events';
      throw new Error(message);
    }
  }

  // Get upcoming events
  static async getUpcomingEvents() {
    try {
      const response = await api.get('/events/upcoming');
      
      if (response.status >= 200 && response.status < 300) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch upcoming events');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch upcoming events';
      throw new Error(message);
    }
  }

  // Delete event
  static async deleteEvent(id: string | number) {
    try {
      const response = await api.delete(`/events/${id}`);
      
      if (response.status >= 200 && response.status < 300) {
        return true;
      }
      throw new Error(response.data.message || 'Failed to delete event');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete event';
      throw new Error(message);
    }
  }
}

export default EventService;