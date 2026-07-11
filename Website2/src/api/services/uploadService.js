/**
 * Upload Service
 *
 * File upload operations for images and documents.
 */

import { httpClient } from '@api/client/HttpClient';
import { config } from '@api/config';

export const uploadService = {
  /**
   * Upload a single file via base64.
   *
   * @param {File} file
   * @returns {Promise<string|null>} The uploaded image URL, or null on failure
   */
  async uploadFile(file) {
    if (!file) return null;

    try {
      const base64 = await this._fileToBase64(file);
      const response = await httpClient.post('/api/admin/upload-image', {
        base64,
        fileName: file.name,
      });
      return response.data?.imageUrl || null;
    } catch {
      return null;
    }
  },

  /**
   * Upload a file with progress tracking.
   *
   * @param {File} file
   * @param {Function} [onProgress] - Callback(percent: number)
   * @returns {Promise<string|null>}
   */
  async uploadFileWithProgress(file, onProgress) {
    if (!file) return null;

    try {
      const base64 = await this._fileToBase64(file);
      const response = await httpClient.post(
        '/api/admin/upload-image',
        { base64, fileName: file.name },
        {
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onProgress(percent);
            }
          },
        },
      );
      return response.data?.imageUrl || null;
    } catch {
      return null;
    }
  },

  /**
   * Validate a file before upload.
   *
   * @param {File} file
   * @returns {{valid: boolean, error?: string}}
   */
  validateFile(file) {
    if (!file) return { valid: false, error: 'No file provided' };

    if (!config.upload.allowedImageTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${config.upload.allowedImageTypes.join(', ')}`,
      };
    }

    if (file.size > config.upload.maxFileSize) {
      const maxMB = Math.round(config.upload.maxFileSize / (1024 * 1024));
      return {
        valid: false,
        error: `File too large. Maximum size: ${maxMB}MB`,
      };
    }

    return { valid: true };
  },

  /**
   * Convert a File object to base64 string.
   *
   * @param {File} file
   * @returns {Promise<string>}
   */
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

export default uploadService;
