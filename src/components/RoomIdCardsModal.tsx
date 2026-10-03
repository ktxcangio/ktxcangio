import React, { useState, useRef } from 'react';
import { Room, Worker, Zone, Block } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  FileArchive, 
  Sparkles, 
  ZoomIn, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  CreditCard, 
  Users, 
  Building2, 
  Check, 
  Eye, 
  RefreshCw,
  FileImage,
  Layers,
  ChevronDown
} from 'lucide-react';
import JSZip from 'jszip';
import { 
  getWorkerFrontCard, 
  getWorkerBackCard, 
  triggerFileDownload, 
  createCompositeCardImage,
  getCleanDate 
} from '../utils/idCardGenerator';

interface RoomIdCardsModalProps {
  room: Room;
  zone?: Zone;
  block?: Block;
  workers: Worker[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateWorkerPhotos?: (workerId: string, frontUrl?: string, backUrl?: string) => void;
}

export const RoomIdCardsModal: React.FC<RoomIdCardsModalProps> = ({
  room,
  zone,
  block,
  workers = [],
  isOpen,
  onClose,
  onUpdateWorkerPhotos,
}) => {
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>(() => workers.map(w => w.id));
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isGeneratingComposite, setIsGeneratingComposite] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'real_only'>('all');

  // Hidden inputs for quick uploading
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadTarget, setPendingUploadTarget] = useState<{ workerId: string; side: 'front' | 'back' } | null>(null);

  if (!isOpen) return null;

  // Filter workers based on filterMode
  const displayedWorkers = workers.filter((w) => {
    if (filterMode === 'real_only') {
      return !!(w.idCardFrontUrl || w.idCardBackUrl || w.idCardUrl);
    }
    return true;
  });

  const selectedWorkers = displayedWorkers.filter((w) => selectedWorkerIds.includes(w.id));

  // Toggle selection
  const handleToggleSelectWorker = (id: string) => {
    setSelectedWorkerIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedWorkers.length === displayedWorkers.length) {
      setSelectedWorkerIds([]);
    } else {
      setSelectedWorkerIds(displayedWorkers.map(w => w.id));
    }
  };

  // Browser Print trigger
  const handlePrint = () => {
    window.print();
  };

  // Export all selected workers' ID card images to a structured ZIP file
  const handleDownloadZip = async () => {
    if (selectedWorkers.length === 0) return;
    setIsExportingZip(true);
    try {
      const zip = new JSZip();
      const folderName = `${room.name.replace(/\s+/g, '_')}_Anh_CCCD_2_Mat`;
      const rootFolder = zip.folder(folderName);

      for (let i = 0; i < selectedWorkers.length; i++) {
        const worker = selectedWorkers[i];
        const frontInfo = getWorkerFrontCard(worker);
        const backInfo = getWorkerBackCard(worker);
        
        const cleanName = worker.fullName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_');
        const prefix = `G${worker.bedNumber}_${cleanName}_CCCD_${worker.citizenId}`;

        // Helper to add data URL or fetch blob into zip
        const addImageToZip = async (dataUrl: string, fileName: string) => {
          if (dataUrl.startsWith('data:image/svg+xml')) {
            const svgContent = decodeURIComponent(dataUrl.split(',')[1]);
            rootFolder?.file(`${fileName}.svg`, svgContent);
          } else if (dataUrl.startsWith('data:image/')) {
            const base64Data = dataUrl.split(',')[1];
            const mimeMatch = dataUrl.match(/data:image\/([a-zA-Z]+);/);
            const ext = mimeMatch ? mimeMatch[1] : 'jpg';
            rootFolder?.file(`${fileName}.${ext}`, base64Data, { base64: true });
          } else {
            // URL from web/cloud
            try {
              const res = await fetch(dataUrl);
              const blob = await res.blob();
              rootFolder?.file(`${fileName}.jpg`, blob);
            } catch {
              // Ignore failed fetch
            }
          }
        };

        await addImageToZip(frontInfo.url, `${prefix}_MatTruoc`);
        await addImageToZip(backInfo.url, `${prefix}_MatSau`);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      triggerFileDownload(url, `${folderName}.zip`);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Generate & download composite 2-sided image for one worker
  const handleDownloadComposite = async (worker: Worker) => {
    setIsGeneratingComposite(worker.id);
    try {
      const frontInfo = getWorkerFrontCard(worker);
      const backInfo = getWorkerBackCard(worker);
      const compositeUrl = await createCompositeCardImage(
        worker,
        frontInfo.url,
        backInfo.url,
        room.name
      );
      const cleanName = worker.fullName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '_');
      triggerFileDownload(
        compositeUrl,
        `CCCD_2_Mat_${room.name.replace(/\s+/g, '_')}_G${worker.bedNumber}_${cleanName}.png`
      );
    } catch (err) {
      console.error('Composite generation error:', err);
    } finally {
      setIsGeneratingComposite(null);
    }
  };

  // Quick upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadTarget || !onUpdateWorkerPhotos) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const worker = workers.find(w => w.id === pendingUploadTarget.workerId);
      if (!worker) return;

      if (pendingUploadTarget.side === 'front') {
        onUpdateWorkerPhotos(worker.id, base64, worker.idCardBackUrl);
      } else {
        onUpdateWorkerPhotos(worker.id, worker.idCardFrontUrl || worker.idCardUrl, base64);
      }
      setPendingUploadTarget(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const hasAnyWorker = workers.length > 0;
  const workersWithPhotosCount = workers.filter(w => w.idCardFrontUrl || w.idCardBackUrl || w.idCardUrl).length;

  return (
    <>
      {/* Hidden file input for quick upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main Dialog Backdrop */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 lg:p-6 print:p-0">
        <div 
          className="bg-white sm:rounded-3xl w-full max-w-5xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden h-full sm:h-auto sm:max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-0 print:max-h-none print:h-auto print:rounded-none"
        >
          {/* 1. Modal Top Bar (Hidden during printing) */}
          <div className="bg-[#182538] text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    Xuất &amp; In Ảnh Căn Cước Công Dân (2 Mặt)
                  </h3>
                  <span className="text-xs bg-blue-900 text-blue-200 border border-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                    {room.name}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate mt-0.5">
                  {zone?.name || 'Khu'} • {block?.name || 'Dãy'} • {workers.length} công nhân đang lưu trú
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Control Toolbar (Hidden during printing) */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0 print:hidden">
            {/* Left: Filters & Selection count */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] text-white ${
                  selectedWorkers.length === displayedWorkers.length && displayedWorkers.length > 0
                    ? 'bg-blue-600'
                    : selectedWorkers.length > 0
                    ? 'bg-blue-400'
                    : 'border border-slate-300'
                }`}>
                  {selectedWorkers.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>
                  {selectedWorkers.length === displayedWorkers.length && displayedWorkers.length > 0
                    ? `Bỏ chọn tất cả (${displayedWorkers.length})`
                    : `Chọn tất cả (${displayedWorkers.length})`}
                </span>
              </button>

              <div className="h-5 w-px bg-slate-200 hidden sm:block" />

              {/* Filter Tabs */}
              <div className="inline-flex rounded-xl bg-slate-200/80 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterMode === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({workers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('real_only')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    filterMode === 'real_only'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Có ảnh chụp ({workersWithPhotosCount})
                </button>
              </div>
            </div>

            {/* Right: Print & Export buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* Button: Print / PDF */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={selectedWorkers.length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs touch-manipulation min-h-[40px]"
                title="In ra giấy hoặc Lưu dưới dạng file PDF chuẩn A4"
              >
                <Printer className="w-4 h-4" />
                <span>In A4 / Xuất PDF ({selectedWorkers.length})</span>
              </button>

              {/* Button: Download ZIP */}
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={selectedWorkers.length === 0 || isExportingZip}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs touch-manipulation min-h-[40px]"
                title="Tải về trọn bộ ảnh CCCD của phòng dưới dạng file ZIP"
              >
                {isExportingZip ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang nén ZIP...</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-4 h-4" />
                    <span>Tải trọn bộ ZIP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Helper Banner (Screen only) */}
          <div className="px-4 py-2.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 print:hidden">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Bố cục in chuẩn 2 mặt A4:</strong> Mặt trước và mặt sau được căn chỉnh chuẩn tỷ lệ Căn cước công dân gắn chip. Bấm <strong>In A4 / Xuất PDF</strong> để in ra máy in hoặc chọn mục "Lưu dưới dạng PDF" (Save as PDF).
              </span>
            </div>
          </div>

          {/* 4. MAIN CONTENT & PRINT CONTAINER */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 print:p-0 print:overflow-visible">
            {/* A4 PRINT OFFICIAL DOCUMENT HEADER (Only visible in Print view) */}
            <div className="hidden print:block mb-6 text-center border-b-2 border-slate-900 pb-4">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="font-bold text-xs text-slate-900">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="w-24 h-0.5 bg-slate-900 mx-auto my-1.5" />
              <h1 className="text-lg font-black uppercase text-slate-950 mt-3 tracking-wide">
                BẢN CHỤP ẢNH CĂN CƯỚC CÔNG DÂN (2 MẶT) - LƯU TRÚ KÝ TÚC XÁ
              </h1>
              <div className="text-xs text-slate-700 font-semibold mt-1">
                Phòng: {room.name.toUpperCase()} • {zone?.name || 'Khu'} • {block?.name || 'Dãy'} • Tổng số: {selectedWorkers.length} công nhân
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Thời gian xuất: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}
              </div>
            </div>

            {/* Workers Cards List */}
            {displayedWorkers.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <Users className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">
                  {filterMode === 'real_only'
                    ? 'Phòng này chưa có công nhân nào được chụp tải ảnh CCCD thực tế.'
                    : 'Phòng này hiện chưa có công nhân nào đang lưu trú.'}
                </p>
                {filterMode === 'real_only' && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Xem tất cả công nhân với mẫu CCCD điện tử
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {displayedWorkers.map((worker) => {
                  const isSelected = selectedWorkerIds.includes(worker.id);
                  const frontInfo = getWorkerFrontCard(worker);
                  const backInfo = getWorkerBackCard(worker);

                  return (
                    <div
                      key={worker.id}
                      className={`rounded-2xl border transition-all print:break-inside-avoid print:page-break-inside-avoid print:border-slate-400 print:mb-6 print:p-3 ${
                        isSelected
                          ? 'border-blue-200 bg-white shadow-sm'
                          : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      {/* Worker Card Top Info Bar */}
                      <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-slate-50/70 rounded-t-2xl print:bg-transparent print:p-1 print:border-b">
                        <div className="flex items-center gap-3">
                          {/* Checkbox (Hidden in print) */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectWorker(worker.id)}
                            className="print:hidden p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                            title={isSelected ? 'Bỏ chọn người này khi in' : 'Chọn người này để in'}
                          >
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-blue-600 text-white' : 'border-2 border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </button>

                          {/* Bed number badge */}
                          <span className="font-extrabold text-xs px-2.5 py-1 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 print:border-slate-800 print:bg-slate-100">
                            Giường #{worker.bedNumber}
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                                {worker.fullName}
                              </h4>
                              <span className="text-xs text-slate-500 font-mono font-bold">
                                ({worker.gender}, {getCleanDate(worker.birthDate)})
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 font-mono">
                              Số CCCD: <strong className="text-slate-900 font-bold">{worker.citizenId}</strong>
                              {worker.address && <span className="text-slate-500 hidden sm:inline"> • {worker.address}</span>}
                            </div>
                          </div>
                        </div>

                        {/* Actions for this worker (Hidden in print) */}
                        <div className="flex items-center gap-1.5 self-end sm:self-auto print:hidden">
                          {/* Composite Download */}
                          <button
                            type="button"
                            onClick={() => handleDownloadComposite(worker)}
                            disabled={isGeneratingComposite === worker.id}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Tải ảnh ghép thẻ đôi (mặt trước + mặt sau) dạng PNG"
                          >
                            {isGeneratingComposite === worker.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileImage className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span className="hidden sm:inline">Ảnh ghép đôi</span>
                          </button>

                          {/* Front photo direct download */}
                          <button
                            type="button"
                            onClick={() => triggerFileDownload(frontInfo.url, `CCCD_${worker.citizenId}_MatTruoc.jpg`)}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Tải ảnh mặt trước"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* 2-Sided Cards Display Grid */}
                      <div className="p-3 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 print:grid-cols-2 print:gap-4 print:p-2">
                        {/* 1. MẶT TRƯỚC */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 print:text-[10px]">
                            <span className="flex items-center gap-1.5 text-blue-700">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                              1. MẶT TRƯỚC (CÓ ẢNH CHÂN DUNG)
                            </span>
                            {frontInfo.isRealPhoto ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 print:hidden">
                                <Check className="w-3 h-3" />
                                Ảnh chụp HD
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full print:hidden">
                                Mẫu số hóa CCCD
                              </span>
                            )}
                          </div>

                          {/* Card Preview Container */}
                          <div 
                            className="relative aspect-[85.6/53.98] w-full rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center group shadow-xs print:rounded-lg print:border-slate-600"
                          >
                            <img
                              src={frontInfo.url}
                              alt={`Mặt trước CCCD - ${worker.fullName}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Hover overlay with zoom & quick upload */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden">
                              <button
                                type="button"
                                onClick={() => setLightboxImage({ url: frontInfo.url, title: `Mặt trước CCCD - ${worker.fullName}` })}
                                className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-md"
                                title="Xem phóng to chi tiết"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                              {onUpdateWorkerPhotos && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingUploadTarget({ workerId: worker.id, side: 'front' });
                                    fileInputRef.current?.click();
                                  }}
                                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all cursor-pointer shadow-md flex items-center gap-1 text-xs font-bold"
                                  title="Thay thế bằng ảnh chụp mới"
                                >
                                  <Upload className="w-4 h-4" />
                                  <span>Đổi ảnh</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. MẶT SAU */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 print:text-[10px]">
                            <span className="flex items-center gap-1.5 text-emerald-700">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                              2. MẶT SAU (CÓ CHIP &amp; MÃ VẠCH QR)
                            </span>
                            {backInfo.isRealPhoto ? (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 print:hidden">
                                <Check className="w-3 h-3" />
                                Ảnh chụp HD
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full print:hidden">
                                Mẫu số hóa CCCD
                              </span>
                            )}
                          </div>

                          {/* Card Preview Container */}
                          <div 
                            className="relative aspect-[85.6/53.98] w-full rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center group shadow-xs print:rounded-lg print:border-slate-600"
                          >
                            <img
                              src={backInfo.url}
                              alt={`Mặt sau CCCD - ${worker.fullName}`}
                              className="w-full h-full object-cover"
                            />

                            {/* Hover overlay with zoom & quick upload */}
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 print:hidden">
                              <button
                                type="button"
                                onClick={() => setLightboxImage({ url: backInfo.url, title: `Mặt sau CCCD - ${worker.fullName}` })}
                                className="p-2.5 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-all cursor-pointer shadow-md"
                                title="Xem phóng to chi tiết"
                              >
                                <ZoomIn className="w-4 h-4" />
                              </button>
                              {onUpdateWorkerPhotos && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPendingUploadTarget({ workerId: worker.id, side: 'back' });
                                    fileInputRef.current?.click();
                                  }}
                                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all cursor-pointer shadow-md flex items-center gap-1 text-xs font-bold"
                                  title="Thay thế bằng ảnh chụp mới"
                                >
                                  <Upload className="w-4 h-4" />
                                  <span>Đổi ảnh</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Modal Footer (Hidden in print) */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 print:hidden">
            <div className="text-xs text-slate-500">
              Đang chọn in: <strong className="text-slate-800">{selectedWorkers.length}</strong> / {displayedWorkers.length} công nhân trong {room.name}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors cursor-pointer min-h-[42px]"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={selectedWorkers.length === 0}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer min-h-[42px] flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>In A4 ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 print:hidden animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="flex items-center justify-between w-full text-white mb-2 px-2">
              <span className="text-sm font-bold truncate">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-white/20 bg-slate-950 max-h-[80vh] flex items-center justify-center shadow-2xl">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[80vh] w-auto object-contain"
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileDownload(lightboxImage.url, `${lightboxImage.title.replace(/\s+/g, '_')}.png`);
                }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải ảnh về máy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
