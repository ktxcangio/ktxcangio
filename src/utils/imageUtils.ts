/**
 * Tiện ích nén và xử lý ảnh thẻ Căn Cước Công Dân (CCCD) và ảnh chân dung công nhân
 * Chuẩn chất lượng HD sắc nét (1536 x 970px, Quality 0.90)
 * Tối ưu hóa cho phép nhìn rõ nét từng chữ số CCCD, ngày sinh, quê quán, con dấu
 * đồng thời dung lượng gọn gàng (~120-180KB) tối ưu hạn mức lưu trữ Firestore.
 */

// Kích thước chuẩn HD cho thẻ Căn cước công dân (Tỷ lệ 85.6mm x 53.98mm ~ 1.586)
export const HD_CARD_WIDTH = 1536;
export const HD_CARD_HEIGHT = 970;
export const HD_CARD_QUALITY = 0.90;

// Kích thước chuẩn HD cho ảnh vuông / chân dung
export const HD_PORTRAIT_SIZE = 800;
export const HD_PORTRAIT_QUALITY = 0.90;

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
  targetWidth = HD_PORTRAIT_SIZE,
  targetHeight = HD_PORTRAIT_SIZE,
  quality = HD_PORTRAIT_QUALITY
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
  targetSize = HD_PORTRAIT_SIZE,
  quality = HD_PORTRAIT_QUALITY
): string | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
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
 * Nén và xử lý ảnh thẻ Căn cước công dân (CCCD) đạt chuẩn HD Sắc Nét
 * Giữ tỷ lệ thẻ hình chữ nhật tiêu chuẩn (khoảng 85.6mm x 54mm ~ 1.58:1)
 * Mặc định kích thước 1536x970 px, chất lượng 0.90 cho phép đọc rõ từng chi tiết nhỏ
 */
export const compressCardImage = (
  dataUrl: string,
  targetWidth = HD_CARD_WIDTH,
  targetHeight = HD_CARD_HEIGHT,
  quality = HD_CARD_QUALITY
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
 * Chụp khung hình trực tiếp từ video luồng camera với độ phân giải HD chuẩn thẻ CCCD
 */
export const captureVideoFrameToCardDataUrl = (
  video: HTMLVideoElement,
  targetWidth = HD_CARD_WIDTH,
  targetHeight = HD_CARD_HEIGHT,
  quality = HD_CARD_QUALITY
): string | null => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const videoWidth = video.videoWidth || 1920;
    const videoHeight = video.videoHeight || 1080;
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

