// frontend/src/services/uploadService.js
import api from './api';

// 上傳單張圖片
export const uploadSingleImage = async (file) => {
    try {
        console.log('uploadService: Uploading single image:', file.name);

        const formData = new FormData();
        formData.append('image', file);

        const response = await api.post('/upload/image', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('uploadService: Single image uploaded successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('uploadService: Upload single image error:', error);
        console.error('Error response:', error.response?.data);
        return {
            success: false,
            error: error.response?.data?.error || '圖片上傳失敗'
        };
    }
};

// 上傳多張圖片
export const uploadMultipleImages = async (files) => {
    try {
        console.log('uploadService: Uploading multiple images:', files.length);

        const formData = new FormData();
        files.forEach((file) => {
            formData.append('images', file);
        });

        const response = await api.post('/upload/images', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        console.log('uploadService: Multiple images uploaded successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('uploadService: Upload multiple images error:', error);
        console.error('Error response:', error.response?.data);
        return {
            success: false,
            error: error.response?.data?.error || '圖片上傳失敗'
        };
    }
};

// 刪除圖片
export const deleteImage = async (filename) => {
    try {
        console.log('uploadService: Deleting image:', filename);

        const response = await api.delete(`/upload/${filename}`);

        console.log('uploadService: Image deleted successfully:', response.data);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('uploadService: Delete image error:', error);
        console.error('Error response:', error.response?.data);
        return {
            success: false,
            error: error.response?.data?.error || '刪除圖片失敗'
        };
    }
};