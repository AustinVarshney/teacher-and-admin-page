import { useEffect, useRef } from 'react';

interface CloudinaryUploadWidgetProps {
  uwConfig: {
    cloudName: string;
    uploadPreset: string;
    multiple?: boolean;
    folder?: string;
    tags?: string[];
    maxFiles?: number;
    cropping?: boolean;
    showAdvancedOptions?: boolean;
    sources?: string[];
    clientAllowedFormats?: string[];
    maxImageFileSize?: number;
    maxImageWidth?: number;
    theme?: string;
  };
  onUploadSuccess: (results: any[]) => void;
  onUploadError?: (error: any) => void;
  buttonText?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({
  uwConfig,
  onUploadSuccess,
  onUploadError,
  buttonText = 'Upload Images',
  disabled = false,
}) => {
  const widgetRef = useRef<any>(null);
  const uploadedResults = useRef<any[]>([]);

  useEffect(() => {
    // Load Cloudinary widget script
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        initializeWidget();
      };

      return () => {
        document.body.removeChild(script);
      };
    } else {
      initializeWidget();
    }
  }, []);

  const initializeWidget = () => {
    if (window.cloudinary && !widgetRef.current) {
      console.log('Initializing Cloudinary widget with config:', uwConfig);
      widgetRef.current = window.cloudinary.createUploadWidget(
        uwConfig,
        (error: any, result: any) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            if (onUploadError) {
              onUploadError(error);
            }
            return;
          }

          console.log('📡 Cloudinary event:', result.event, result);

          if (result.event === 'success') {
            // Store each successful upload
            const uploadResult = {
              publicId: result.info.public_id,
              secureUrl: result.info.secure_url,
              url: result.info.url,
              format: result.info.format,
              width: result.info.width,
              height: result.info.height,
              originalFilename: result.info.original_filename,
            };
            console.log('✅ Adding upload result:', uploadResult);
            uploadedResults.current.push(uploadResult);
          }

          // Handle widget close event
          if (result.event === 'close') {
            console.log('🚪 Widget closed. Current uploads:', uploadedResults.current.length);
            // If there are pending uploads, send them
            if (uploadedResults.current.length > 0) {
              const resultsToSend = [...uploadedResults.current];
              console.log('📤 Sending results on close:', resultsToSend);
              onUploadSuccess(resultsToSend);
              uploadedResults.current = []; // Reset for next upload
            }
          }

          // When upload queue is complete, return all results
          if (result.event === 'queues-end') {
            console.log('🏁 Upload queue ended. Total uploads:', uploadedResults.current.length);
            if (uploadedResults.current.length > 0) {
              const resultsToSend = [...uploadedResults.current];
              console.log('📤 Sending results to parent:', resultsToSend);
              onUploadSuccess(resultsToSend);
              uploadedResults.current = []; // Reset for next upload
            } else {
              console.warn('⚠️ Queue ended but no uploads recorded');
            }
          }

          // Handle single file upload completion (non-multiple mode)
          if (result.event === 'success' && !uwConfig.multiple) {
            console.log('🎯 Single upload mode - sending immediate result');
            const singleResult = uploadedResults.current[uploadedResults.current.length - 1];
            if (singleResult) {
              onUploadSuccess([singleResult]);
              uploadedResults.current = [];
            }
          }
        }
      );
      console.log('✅ Cloudinary widget initialized');
    }
  };

  const handleClick = () => {
    if (disabled) {
      console.log('Upload button is disabled');
      return;
    }
    
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      console.error('Cloudinary widget not initialized');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      style={{
        padding: '10px 20px',
        backgroundColor: disabled ? '#cccccc' : '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {buttonText}
    </button>
  );
};

export default CloudinaryUploadWidget;
