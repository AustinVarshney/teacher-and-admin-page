import api from './api';

export interface GalleryImage {
  id: number;
  title?: string;
  description?: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  uploadedByType: string;
  uploadedById: number;
  uploadedByName: string;
  sessionId: number;
  sessionName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadGalleryRequest {
  file: File;
  title?: string;
  description?: string;
  uploadedByType: 'TEACHER' | 'ADMIN';
  uploadedById: number;
  uploadedByName: string;
  sessionId: number;
}

class GalleryService {
  /**
   * Upload a new image to the gallery via Cloudinary
   */
  async uploadImage(request: UploadGalleryRequest): Promise<GalleryImage> {
    const formData = new FormData();
    formData.append('file', request.file);
    if (request.title) formData.append('title', request.title);
    if (request.description) formData.append('description', request.description);
    formData.append('uploadedByType', request.uploadedByType);
    formData.append('uploadedById', request.uploadedById.toString());
    formData.append('uploadedByName', request.uploadedByName);
    formData.append('sessionId', request.sessionId.toString());

    const response = await api.post<{ data: GalleryImage }>('/gallery/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  /**
   * Get all gallery images
   */
  async getAllImages(sessionId?: number): Promise<GalleryImage[]> {
    const url = sessionId ? `/gallery?sessionId=${sessionId}` : '/gallery';
    const response = await api.get<{ data: GalleryImage[] }>(url);
    return response.data.data;
  }

  /**
   * Get gallery image by ID
   */
  async getImageById(id: number): Promise<GalleryImage> {
    const response = await api.get<{ data: GalleryImage }>(`/gallery/${id}`);
    return response.data.data;
  }

  /**
   * Delete gallery image
   */
  async deleteImage(id: number): Promise<void> {
    await api.delete(`/gallery/${id}`);
  }
}

export default new GalleryService();
