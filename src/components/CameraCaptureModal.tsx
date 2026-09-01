import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  RotateCcw, 
  Upload, 
  Smartphone, 
  AlertCircle, 
  Sparkles,
  Zap
} from 'lucide-react';
import { captureVideoFrameToDataUrl, compressAndCropImage, fileToDataUrl } from '../utils/imageUtils';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
  workerName?: string;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  workerName = 'công nhân'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<'permission' | 'unsupported' | 'general' | null>(null);
  
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [flashEffect, setFlashEffect] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage('');
    setErrorType(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setErrorType('unsupported');
      setErrorMessage('Trình duyệt hiện tại không hỗ trợ chụp ảnh trực tiếp qua WebRTC. Bạn có thể sử dụng nút Chụp ảnh hoặc Tải ảnh bên dưới.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = (err?.message || '').toLowerCase();
      setIsCameraActive(false);

      if (
        errName === 'NotAllowedError' || 
        errName === 'PermissionDeniedError' || 
        errMsg.includes('permission dismissed') || 
        errMsg.includes('permission denied')
      ) {
        setErrorType('permission');
        setErrorMessage('Quyền truy cập Camera chưa được cho phép. Bạn có thể bấm biểu tượng Ổ khóa trên thanh địa chỉ để bật hoặc chọn Chụp ảnh / Tải ảnh bên dưới.');
      } else {
        setErrorType('general');
        setErrorMessage('Không thể khởi động camera trực tiếp. Vui lòng bấm vào nút Chụp ảnh từ điện thoại hoặc Tải ảnh từ máy.');
      }
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (isOpen) {
      setPreviewPhoto(null);
      setErrorMessage('');
      setErrorType(null);
      setCountdown(null);
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Chụp ảnh từ luồng video trực tiếp
  const takeSnapshot = useCallback(async () => {
    if (!videoRef.current) return;

    // Flash animation
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 200);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(60);
      } catch {
        // ignore
      }
    }

    setIsProcessing(true);
    const rawDataUrl = captureVideoFrameToDataUrl(videoRef.current, 400, 0.85);

    if (rawDataUrl) {
      const compressed = await compressAndCropImage(rawDataUrl, 400, 400, 0.85);
      setPreviewPhoto(compressed);
      stopCamera();
    } else {
      setErrorMessage('Không thể chụp hình từ camera. Vui lòng thử lại hoặc tải ảnh.');
    }
    setIsProcessing(false);
  }, [stopCamera]);

  // Bắt đầu đếm ngược 3 giây rồi chụp
  const handleStartCountdown = () => {
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          takeSnapshot();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Đổi camera trước/sau
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Chụp lại
  const handleRetake = () => {
    setPreviewPhoto(null);
    setErrorMessage('');
    startCamera();
  };

  // Xác nhận lưu ảnh
  const handleConfirmPhoto = () => {
    if (previewPhoto) {
      onCapture(previewPhoto);
      onClose();
    }
  };

  // Xử lý khi chọn file ảnh tải lên / chụp từ input file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');
    try {
      const rawData = await fileToDataUrl(file);
      const compressed = await compressAndCropImage(rawData, 400, 400, 0.85);
      setPreviewPhoto(compressed);
      stopCamera();
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      setErrorMessage('Không thể xử lý tệp hình ảnh vừa chọn. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div 
        id="modal-camera-capture"
        className="bg-slate-900 text-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Chụp Ảnh Chân Dung
              </h3>
              <p className="text-xs text-slate-400">
                Hồ sơ: {workerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Body Viewport */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="relative aspect-square w-full max-w-xs mx-auto bg-black rounded-3xl overflow-hidden border-2 border-slate-700 shadow-inner flex items-center justify-center">
            {/* Flash Effect overlay */}
            {flashEffect && (
              <div className="absolute inset-0 bg-white z-20 animate-out fade-out duration-200 pointer-events-none" />
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center pointer-events-none">
                <span className="text-7xl font-extrabold text-amber-400 animate-ping">
                  {countdown}
                </span>
              </div>
            )}

            {/* Case 1: Preview Captured Photo */}
            {previewPhoto ? (
              <div className="relative w-full h-full">
                <img
                  src={previewPhoto}
                  alt="Ảnh chân dung đã chụp"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 backdrop-blur-xs">
                  <Check className="w-3.5 h-3.5" />
                  <span>Ảnh đã chụp</span>
                </div>
              </div>
            ) : (
              /* Case 2: Live Video Stream or Fallback */
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
                />

                {/* Khung hướng dẫn khuôn mặt (Portrait Guide Frame) */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    {/* Vòng oval canh khuôn mặt */}
                    <div className="w-48 h-60 sm:w-56 sm:h-64 border-2 border-dashed border-blue-400/80 rounded-[45%] shadow-[0_0_20px_rgba(59,130,246,0.3)] relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs">
                        Khuôn mặt
                      </div>
                    </div>
                  </div>
                )}

                {/* Khi Camera không mở được / Quyền bị từ chối */}
                {!isCameraActive && !isProcessing && (
                  <div className="p-4 text-center space-y-3 bg-slate-800/95 w-full h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        {errorType === 'permission' ? 'Cần cấp quyền Camera' : 'Chụp qua trình chụp ảnh'}
                      </h4>
                      <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                        {errorMessage || 'Không thể hiển thị luồng video trực tiếp. Bạn có thể sử dụng nút bên dưới.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 w-full max-w-xs pt-1">
                      <button
                        type="button"
                        onClick={() => nativeCameraInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Mở Camera điện thoại / máy tính</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-600"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh có sẵn từ máy</span>
                      </button>

                      <button
                        type="button"
                        onClick={startCamera}
                        className="text-[11px] text-blue-400 hover:underline pt-1"
                      >
                        Thử kết nối lại Camera
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Controls Bar */}
          {previewPhoto ? (
            /* Khi đã chụp ảnh: Nút Chụp lại & Xác nhận */
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleRetake}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Chụp lại</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Dùng ảnh này & Lưu</span>
              </button>
            </div>
          ) : isCameraActive ? (
            /* Khi đang phát camera trực tiếp */
            <div className="space-y-3">
              {/* Nút chụp chính to tròn ở giữa */}
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleSwitchCamera}
                  title="Đổi camera trước / sau"
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                {/* Nút chụp tức thì */}
                <button
                  type="button"
                  onClick={takeSnapshot}
                  disabled={isProcessing}
                  title="Bấm để chụp ảnh ngay"
                  className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-bold flex items-center justify-center shadow-xl ring-4 ring-blue-500/40 transition-all cursor-pointer"
                >
                  <div className="w-13 h-13 rounded-full border-2 border-slate-900 flex items-center justify-center bg-blue-600 text-white">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>

                {/* Nút đếm ngược 3s */}
                <button
                  type="button"
                  onClick={handleStartCountdown}
                  title="Hẹn giờ 3s chụp"
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <Zap className="w-5 h-5" />
                </button>
              </div>

              {/* Các tùy chọn phụ: Tải ảnh hoặc Chụp qua ứng dụng máy */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-xl border border-slate-700/80 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Camera điện thoại</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-xl border border-slate-700/80 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Tải ảnh từ máy</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Tự động nén & căn chỉnh chân dung
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
