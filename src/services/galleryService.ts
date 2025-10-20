import api, { RestResponse } from './api';

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
  // Frontend will upload file to Cloudinary and provide the resulting URL and public id.
  file?: File; // optional — kept for compatibility if direct upload is used
  imageUrl?: string; // Cloudinary secure_url or equivalent (optional - required if no file)
  cloudinaryPublicId?: string;
  title?: string;
  description?: string;
  uploadedByType: 'TEACHER' | 'ADMIN';
  uploadedById: number;
  uploadedByName: string;
  sessionId: number;
}

export interface BulkUploadGalleryRequest {
  sessionId: number;
  images: {
    imageUrl: string;
    cloudinaryPublicId: string;
    title?: string;
    description?: string;
  }[];
  uploadedByType: 'TEACHER' | 'ADMIN';
  uploadedById: number;
  uploadedByName: string;
}

class GalleryService {
  /**
   * Upload a new image to the gallery via Cloudinary
   */
  async uploadImage(request: UploadGalleryRequest): Promise<GalleryImage> {
    // If frontend already uploaded to Cloudinary and provided imageUrl, send JSON payload to backend
    if (request.imageUrl) {
      const payload = {
        title: request.title || '',
        description: request.description || '',
        imageUrl: request.imageUrl,
        cloudinaryPublicId: request.cloudinaryPublicId || '',
        uploadedByType: request.uploadedByType,
        uploadedById: Number(request.uploadedById), // Ensure it's a number for Long conversion
        uploadedByName: request.uploadedByName,
        sessionId: Number(request.sessionId), // Ensure it's a number for Long conversion
      };

      console.log('GalleryService - Sending payload to backend:', payload);
      const response = await api.post<RestResponse<GalleryImage>>('/gallery', payload);
      console.log('GalleryService - Backend response:', response.data);
      return response.data.data;
    }

  // Otherwise, fall back to sending multipart/form-data to backend so backend can accept and upload the file
  if (request.file) {
      const formData = new FormData();
      formData.append('file', request.file);
      if (request.title) formData.append('title', request.title);
      if (request.description) formData.append('description', request.description);
      formData.append('uploadedByType', request.uploadedByType);
      formData.append('uploadedById', request.uploadedById.toString());
      formData.append('uploadedByName', request.uploadedByName);
      formData.append('sessionId', request.sessionId.toString());

      const response = await api.post<{ data: GalleryImage }>('/gallery', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    }

    throw new Error('uploadImage: either imageUrl or file must be provided');
  }

  /**
   * Get all gallery images
   */
  async getAllImages(sessionId?: number): Promise<GalleryImage[]> {
    const url = sessionId ? `/gallery?sessionId=${sessionId}` : '/gallery';
    const response = await api.get<RestResponse<GalleryImage[]>>(url);
    return response.data.data;
  }

  /**
   * Get gallery image by ID
   */
  async getImageById(id: number): Promise<GalleryImage> {
    const response = await api.get<RestResponse<GalleryImage>>(`/gallery/${id}`);
    return response.data.data;
  }

  /**
   * Update gallery image (title and description)
   */
  async updateImage(id: number, title: string, description: string): Promise<GalleryImage> {
    const payload = {
      title,
      description,
    };
    const response = await api.put<RestResponse<GalleryImage>>(`/gallery/${id}`, payload);
    return response.data.data;
  }

  /**
   * Delete gallery image
   */
  async deleteImage(id: number): Promise<void> {
    await api.delete(`/gallery/${id}`);
  }

  /**
   * Upload multiple images to the gallery via Cloudinary
   */
  async uploadBulkImages(request: BulkUploadGalleryRequest): Promise<GalleryImage[]> {
    const payload = {
      sessionId: Number(request.sessionId), // Ensure it's a number for Long conversion
      images: request.images,
      uploadedByType: request.uploadedByType,
      uploadedById: Number(request.uploadedById), // Ensure it's a number for Long conversion
      uploadedByName: request.uploadedByName,
    };

    console.log('GalleryService - Sending bulk payload to backend:', payload);
    const response = await api.post<RestResponse<GalleryImage[]>>('/gallery/bulk', payload);
    console.log('GalleryService - Bulk backend response:', response.data);
    return response.data.data;
  }
}

export default new GalleryService();
