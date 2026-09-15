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

/**
 * Nén và tối ưu hóa ảnh thẻ Căn cước công dân (CCCD)
 * Giữ tỷ lệ thẻ hình chữ nhật tiêu chuẩn (khoảng 85.6mm x 54mm ~ 1.58:1)
 * Giúp số và thông tin chữ trên thẻ sắc nét, rõ ràng và dung lượng nhẹ lưu Firestore.
 */
export const compressCardImage = (
  dataUrl: string,
  targetWidth = 850,
  targetHeight = 540,
  quality = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        // Nếu ảnh chụp đã là tỷ lệ ngang, giữ tỷ lệ phù hợp
        let outWidth = targetWidth;
        let outHeight = targetHeight;

        const imgRatio = imgWidth / imgHeight;
        const targetRatio = targetWidth / targetHeight;

        canvas.width = outWidth;
        canvas.height = outHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Lấy vùng trung tâm theo tỷ lệ thẻ CCCD
        let sWidth = imgWidth;
        let sHeight = imgHeight;
        let sx = 0;
        let sy = 0;

        if (imgRatio > targetRatio) {
          // Ảnh rộng hơn tỷ lệ thẻ
          sWidth = imgHeight * targetRatio;
          sx = (imgWidth - sWidth) / 2;
        } else {
          // Ảnh cao hơn tỷ lệ thẻ
          sHeight = imgWidth / targetRatio;
          sy = (imgHeight - sHeight) / 2;
        }

        ctx.drawImage(
          img,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          outWidth,
          outHeight
        );

        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      } catch (err) {
        console.warn('Error compressing card image:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = dataUrl;
  });
};

/**
 * Chụp khung hình trực tiếp từ video luồng camera với tỷ lệ thẻ Căn cước công dân
 */
export const captureVideoFrameToCardDataUrl = (
  video: HTMLVideoElement,
  targetWidth = 850,
  targetHeight = 540,
  quality = 0.85
): string | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    const videoRatio = videoWidth / videoHeight;
    const targetRatio = targetWidth / targetHeight;

    let sWidth = videoWidth;
    let sHeight = videoHeight;
    let sx = 0;
    let sy = 0;

    if (videoRatio > targetRatio) {
      sWidth = videoHeight * targetRatio;
      sx = (videoWidth - sWidth) / 2;
    } else {
      sHeight = videoWidth / targetRatio;
      sy = (videoHeight - sHeight) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      video,
      sx,
      sy,
      sWidth,
      sHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.error('Failed to capture card frame from video:', err);
    return null;
  }
};

