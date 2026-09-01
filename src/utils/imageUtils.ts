/**
 * Tiện ích nén và xử lý ảnh chân dung công nhân
 * Đảm bảo kích thước nhẹ (< 60KB), tối ưu lưu trữ Firestore và hiển thị mượt mà.
 */

export const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const compressAndCropImage = (
  dataUrl: string,
  targetWidth = 400,
  targetHeight = 400,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Cắt vuông từ tâm ảnh (Center crop)
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;
        const minDim = Math.min(imgWidth, imgHeight);

        const sx = (imgWidth - minDim) / 2;
        const sy = (imgHeight - minDim) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          sx,
          sy,
          minDim,
          minDim,
          0,
          0,
          targetWidth,
          targetHeight
        );

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        console.warn('Error compressing image:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
};

export const captureVideoFrameToDataUrl = (
  video: HTMLVideoElement,
  targetSize = 400,
  quality = 0.85
): string | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const videoWidth = video.videoWidth || 640;
    const videoHeight = video.videoHeight || 480;
    const minDim = Math.min(videoWidth, videoHeight);

    const sx = (videoWidth - minDim) / 2;
    const sy = (videoHeight - minDim) / 2;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      video,
      sx,
      sy,
      minDim,
      minDim,
      0,
      0,
      targetSize,
      targetSize
    );

    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.error('Failed to capture frame from video:', err);
    return null;
  }
};
