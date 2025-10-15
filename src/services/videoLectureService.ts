import api from './api';

export interface VideoLecture {
  id?: number;
  title: string;
  description?: string;
  youtubeLink: string;
  subject: string;
  className: string;
  section: string;
  teacherId: number;
  teacherName?: string;
  duration?: string;
  topic?: string;
  uploadedAt?: string;
  isActive?: boolean;
}

const VideoLectureService = {
  // Create a new video lecture
  createVideoLecture: async (data: VideoLecture): Promise<VideoLecture> => {
    const response = await api.post('/video-lectures', data);
    return response.data;
  },

  // Update an existing video lecture
  updateVideoLecture: async (id: number, data: VideoLecture): Promise<VideoLecture> => {
    const response = await api.put(`/video-lectures/${id}`, data);
    return response.data;
  },

  // Delete (soft delete) a video lecture
  deleteVideoLecture: async (id: number): Promise<void> => {
    await api.delete(`/video-lectures/${id}`);
  },

  // Get a video lecture by ID
  getVideoLectureById: async (id: number): Promise<VideoLecture> => {
    const response = await api.get(`/video-lectures/${id}`);
    return response.data;
  },

  // Get all video lectures by teacher
  getVideoLecturesByTeacher: async (teacherId: number): Promise<VideoLecture[]> => {
    const response = await api.get(`/video-lectures/teacher/${teacherId}`);
    return response.data;
  },

  // Get video lectures by class and section
  getVideoLecturesByClass: async (className: string, section: string): Promise<VideoLecture[]> => {
    const response = await api.get(`/video-lectures/class/${className}/section/${section}`);
    return response.data;
  },

  // Get video lectures by class, section and subject
  getVideoLecturesByClassAndSubject: async (
    className: string,
    section: string,
    subject: string
  ): Promise<VideoLecture[]> => {
    const response = await api.get(`/video-lectures/class/${className}/section/${section}/subject/${subject}`);
    return response.data;
  },

  // Get all active video lectures
  getAllActiveVideoLectures: async (): Promise<VideoLecture[]> => {
    const response = await api.get('/video-lectures/all');
    return response.data;
  },

  // Helper to extract YouTube video ID from URL
  extractYouTubeId: (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  },

  // Helper to get YouTube thumbnail URL
  getYouTubeThumbnail: (url: string): string => {
    const videoId = VideoLectureService.extractYouTubeId(url);
    return videoId 
      ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      : '/default-video-thumbnail.jpg';
  },

  // Helper to get YouTube embed URL
  getYouTubeEmbedUrl: (url: string): string => {
    const videoId = VideoLectureService.extractYouTubeId(url);
    return videoId 
      ? `https://www.youtube.com/embed/${videoId}`
      : '';
  }
};

export default VideoLectureService;
