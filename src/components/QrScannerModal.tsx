import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  Image as ImageIcon,
  HelpCircle,
  FileText,
  Smartphone,
  Copy
} from 'lucide-react';
import { parseVietnameseCCCDQr } from '../utils/qrParser';
import { QrParsedCCCD } from '../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: QrParsedCCCD) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<'permission' | 'notfound' | 'unsupported' | 'general' | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<QrParsedCCCD | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualQrText, setManualQrText] = useState<string>('');
  const [manualError, setManualError] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
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
    setIsScanning(false);
  }, []);

  const tick = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameId.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        const parsed = parseVietnameseCCCDQr(code.data);
        if (parsed && parsed.citizenId) {
          setScanResult(parsed);
          stopCamera();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(100);
            } catch {
              // ignore
            }
          }
          return;
        }
      }
    } catch (e) {
      // ignore frame processing error
    }

    animationFrameId.current = requestAnimationFrame(tick);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    stopCamera();
    setErrorMessage('');
    setErrorType(null);

    // Kiểm tra hỗ trợ WebRTC mediaDevices
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      setHasPermission(false);
      setErrorType('unsupported');
      setErrorMessage('Trình duyệt hiện tại không hỗ trợ truy cập Camera trực tiếp hoặc đang chạy trong môi trường bảo mật hạn chế. Bạn có thể chụp ảnh hoặc tải ảnh CCCD để quét.');
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
        setHasPermission(true);
        setIsScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = (err?.message || '').toLowerCase();
      
      setHasPermission(false);

      if (
        errName === 'NotAllowedError' || 
        errName === 'PermissionDeniedError' || 
        errMsg.includes('permission dismissed') || 
        errMsg.includes('permission denied') ||
        errMsg.includes('dismissed') ||
        errMsg.includes('denied')
      ) {
        setErrorType('permission');
        setErrorMessage(
          'Quyền truy cập Camera chưa được cho phép (hoặc hộp thoại bị đóng/từ chối). Hãy bấm vào biểu tượng Ổ khóa / Camera trên thanh địa chỉ để cấp quyền, hoặc sử dụng tính năng tải/chụp ảnh bên dưới.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setErrorType('notfound');
        setErrorMessage('Không tìm thấy thiết bị Camera trên máy tính/điện thoại này.');
      } else {
        setErrorType('general');
        setErrorMessage('Không thể khởi động Camera trực tiếp. Vui lòng sử dụng tính năng tải ảnh CCCD hoặc chụp ảnh trực tiếp.');
      }
    }
  }, [facingMode, stopCamera, tick]);

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setErrorMessage('');
      setErrorType(null);
      setShowManualInput(false);
      setManualQrText('');
      setManualError('');
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Xử lý đọc mã QR từ đối tượng file ảnh (Blob / File)
  const processImageFile = useCallback((file: File | Blob) => {
    setIsProcessingImage(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsProcessingImage(false);
          setErrorMessage('Không thể khởi tạo bộ xử lý hình ảnh trên trình duyệt.');
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingImage(false);

        if (code && code.data) {
          const parsed = parseVietnameseCCCDQr(code.data);
          if (parsed && parsed.citizenId) {
            setScanResult(parsed);
            stopCamera();
          } else {
            setErrorMessage('Không nhận diện được định dạng CCCD từ mã QR này. Mã thô đọc được: ' + code.data);
          }
        } else {
          setErrorMessage('Không tìm thấy mã QR trong ảnh vừa tải. Vui lòng chọn ảnh chụp rõ nét góc trên bên phải của thẻ CCCD gắn chip.');
        }
      };

      img.onerror = () => {
        setIsProcessingImage(false);
        setErrorMessage('Không thể tải tệp hình ảnh. Vui lòng thử lại với định dạng PNG, JPG hoặc JPEG.');
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      setIsProcessingImage(false);
      setErrorMessage('Lỗi khi đọc file ảnh từ thiết bị.');
    };

    reader.readAsDataURL(file);
  }, [stopCamera]);

  // Quét ảnh tải lên từ thư viện
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input để có thể chọn lại cùng 1 file nếu muốn
    e.target.value = '';
  };

  // Hỗ trợ Paste ảnh từ Clipboard (Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processImageFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen, processImageFile]);

  // Hỗ trợ Drag & Drop ảnh
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmResult = () => {
    if (scanResult) {
      onScanSuccess(scanResult);
      onClose();
    }
  };

  const handleSwitchCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQrText.trim()) {
      setManualError('Vui lòng nhập chuỗi dữ liệu mã QR hoặc số CCCD');
      return;
    }

    const parsed = parseVietnameseCCCDQr(manualQrText.trim());
    if (parsed && parsed.citizenId) {
      setScanResult(parsed);
      setManualError('');
    } else {
      setManualError('Dữ liệu không khớp định dạng thẻ CCCD (VD: 038096001234|...|NGUYEN VAN A|...)');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div 
        id="modal-qr-cccd-scanner"
        className="bg-slate-900 text-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Quét Mã QR Căn Cước Công Dân (CCCD)
              </h3>
              <p className="text-xs text-slate-400">
                Tự động trích xuất Họ tên, Số CCCD, Ngày sinh, Quê quán
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
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {scanResult ? (
            /* Khi đã quét thành công */
            <div className="bg-slate-800 rounded-2xl p-4 border border-emerald-500/50 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Đã quét thành công thông tin thẻ CCCD!</span>
              </div>

              <div className="bg-slate-900/90 rounded-xl p-3.5 space-y-2 text-xs text-slate-300 font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-sans">Số CCCD:</span>
                  <span className="font-bold text-emerald-300 text-sm">{scanResult.citizenId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-sans">Họ và tên:</span>
                  <span className="font-bold text-white text-sm font-sans">{scanResult.fullName || '---'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-sans">Giới tính:</span>
                  <span className="text-white font-sans">{scanResult.gender}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400 font-sans">Ngày sinh:</span>
                  <span className="text-white">{scanResult.birthDate || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-sans block mb-0.5">Địa chỉ / Quê quán:</span>
                  <span className="text-white font-sans block bg-slate-800 p-2 rounded-lg text-[11px] leading-relaxed">
                    {scanResult.address || '---'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setScanResult(null);
                    startCamera();
                  }}
                  className="flex-1 py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Quét lại</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResult}
                  className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Áp dụng vào hồ sơ</span>
                </button>
              </div>
            </div>
          ) : showManualInput ? (
            /* Giao diện nhập mã / dán chuỗi QR thủ công */
            <form onSubmit={handleManualSubmit} className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>Dán chuỗi mã QR CCCD hoặc Số CCCD</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Quay lại quét
                </button>
              </div>

              <textarea
                value={manualQrText}
                onChange={e => setManualQrText(e.target.value)}
                rows={4}
                placeholder="Dán chuỗi mã QR tại đây (VD: 038096001234|...|NGUYEN VAN A|15031996|Nam|...)"
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
              />

              {manualError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{manualError}</span>
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Phân tích dữ liệu
                </button>
              </div>
            </form>
          ) : (
            /* Khi đang mở camera quét hoặc gặp lỗi quyền truy cập */
            <div className="space-y-3">
              <div className="relative aspect-4/3 bg-black rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${!isScanning ? 'hidden' : ''}`}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Khung ngắm quét QR hoạt động khi camera mở */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    <div className="w-52 h-52 sm:w-60 sm:h-60 border-2 border-emerald-400 rounded-2xl relative shadow-lg shadow-emerald-500/20">
                      {/* 4 góc điểm nhấn */}
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                      
                      {/* Đường quét laser chạy lên xuống */}
                      <div className="w-full h-0.5 bg-emerald-400 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-md shadow-emerald-400"></div>
                    </div>
                    <p className="text-[11px] text-emerald-300 font-medium mt-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                      Hướng camera vào mã QR góc trên thẻ CCCD
                    </p>
                  </div>
                )}

                {/* Loading state khi xử lý ảnh tải lên */}
                {isProcessingImage && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-2" />
                    <p className="text-xs font-semibold text-white">Đang giải mã QR từ ảnh tải lên...</p>
                  </div>
                )}

                {/* Khi quyền camera bị từ chối hoặc lỗi */}
                {hasPermission === false && !isProcessingImage && (
                  <div className="p-4 sm:p-6 text-center space-y-3 bg-slate-800/95 w-full h-full flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>

                    <div className="max-w-xs space-y-1">
                      <h4 className="text-sm font-bold text-white">
                        {errorType === 'permission' ? 'Cần cấp quyền truy cập Camera' : 'Không thể mở Camera'}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {errorMessage}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center pt-1">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-600"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Thử bật lại Camera</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => nativeCameraInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Chụp ảnh thẻ CCCD</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Thông báo lỗi nếu có khi tải ảnh */}
              {errorMessage && hasPermission !== false && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Hướng dẫn thao tác nhanh */}
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span>Có thể kéo thả hoặc dán ảnh CCCD (Ctrl+V)</span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                >
                  Nhập mã thủ công
                </button>
              </div>

              {/* Controls bar: Đổi Camera / Chụp ảnh / Tải ảnh CCCD */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {isScanning && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Đổi Camera</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chụp ảnh mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh CCCD</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs text-slate-400">
          <span>Chuẩn thẻ CCCD 12 số gắn chip Bộ Công An</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

