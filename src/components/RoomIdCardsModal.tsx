import React, { useState, useRef, useMemo } from 'react';
import { Room, Worker, Zone, Block } from '../types';
import { 
  X, 
  Printer, 
  Download, 
  FileArchive, 
  Sparkles, 
  ZoomIn, 
  Upload, 
  CreditCard, 
  Users, 
  Check, 
  RefreshCw,
  Eye,
  LayoutGrid,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle
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
  // Navigation & View Mode State
  const [activeTab, setActiveTab] = useState<'cards' | 'preview'>('cards');
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>(() => workers.map(w => w.id));
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isGeneratingComposite, setIsGeneratingComposite] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'real_only'>('all');

  // Print Preview options
  const [itemsPerPage, setItemsPerPage] = useState<1 | 2>(2);
  const [previewZoom, setPreviewZoom] = useState<number>(100);

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
    // If not in preview tab, we can still print directly
    window.print();
  };

  // Chunk selected workers into pages for A4 printing/previewing
  const pages = useMemo(() => {
    const list = selectedWorkers;
    const result: Worker[][] = [];
    for (let i = 0; i < list.length; i += itemsPerPage) {
      result.push(list.slice(i, i + itemsPerPage));
    }
    return result;
  }, [selectedWorkers, itemsPerPage]);

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
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-0 sm:p-3 lg:p-4 print-modal-backdrop">
        <div 
          className="bg-white sm:rounded-2xl w-full max-w-6xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden h-full sm:h-auto sm:max-h-[96vh] flex flex-col animate-in fade-in zoom-in-95 duration-150 print-modal-container"
        >
          {/* 1. Modal Top Bar (Screen only) */}
          <div className="bg-[#111827] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    Quản Lý &amp; In Căn Cước Công Dân (2 Mặt)
                  </h3>
                  <span className="text-xs bg-blue-900 text-blue-200 border border-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                    {room.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {zone?.name || 'Khu'} • {block?.name || 'Dãy'} • {workers.length} công nhân đang lưu trú
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('cards')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'cards'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Danh sách thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'preview'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước khi in A4</span>
                  {selectedWorkers.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center font-bold">
                      {selectedWorkers.length}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Control Toolbar (Screen only) */}
          <div className="p-3 sm:px-5 sm:py-2.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 shrink-0 print:hidden text-xs">
            {/* Left Controls */}
            {activeTab === 'cards' ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] text-white ${
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

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Filter Tabs */}
                <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      filterMode === 'real_only'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Có ảnh chụp ({workersWithPhotosCount})
                  </button>
                </div>
              </div>
            ) : (
              /* Controls inside Print Preview Tab */
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Bản in A4: {pages.length} trang ({selectedWorkers.length} người)
                </span>

                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Bố cục:</span>
                  <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => setItemsPerPage(2)}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        itemsPerPage === 2 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                      title="In 2 công nhân trên 1 trang A4 (tiết kiệm giấy)"
                    >
                      2 người / trang A4
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemsPerPage(1)}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        itemsPerPage === 1 ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                      }`}
                      title="In 1 công nhân trên 1 trang A4 (khổ lớn chi tiết)"
                    >
                      1 người / trang A4
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="text-slate-500 font-medium">Thu phóng:</span>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.max(60, prev - 15))}
                    className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs w-10 text-center font-bold">{previewZoom}%</span>
                  <button
                    onClick={() => setPreviewZoom(prev => Math.min(130, prev + 15))}
                    className="w-6 h-6 rounded bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Right Buttons: Print & ZIP */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {activeTab === 'cards' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xem trước bản in A4</span>
                </button>
              )}

              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={selectedWorkers.length === 0}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Mở hộp thoại in trình duyệt hoặc Lưu dạng PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In A4 / Xuất PDF ({selectedWorkers.length})</span>
              </button>

              {/* Download ZIP */}
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={selectedWorkers.length === 0 || isExportingZip}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Tải về trọn bộ ảnh CCCD của phòng dưới dạng file ZIP"
              >
                {isExportingZip ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang nén ZIP...</span>
                  </>
                ) : (
                  <>
                    <FileArchive className="w-3.5 h-3.5" />
                    <span>Tải ZIP ảnh</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: CARDS LIST VIEW (CHẾ ĐỘ DANH SÁCH THẺ)                             */}
          {/* ========================================================================= */}
          {activeTab === 'cards' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 print:hidden">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Tích chọn các công nhân cần in. Nhấn vào nút <strong>Xem trước khi in A4</strong> hoặc <strong>In A4 / Xuất PDF</strong> để xuất tài liệu chuẩn.
                  </span>
                </div>
              </div>

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
                <div className="space-y-4">
                  {displayedWorkers.map((worker) => {
                    const isSelected = selectedWorkerIds.includes(worker.id);
                    const frontInfo = getWorkerFrontCard(worker);
                    const backInfo = getWorkerBackCard(worker);

                    return (
                      <div
                        key={worker.id}
                        className={`rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-300 bg-white shadow-xs'
                            : 'border-slate-200 bg-slate-50/60 opacity-65'
                        }`}
                      >
                        {/* Worker Header Info */}
                        <div className="p-3 sm:px-4 sm:py-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/60 rounded-t-xl">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleToggleSelectWorker(worker.id)}
                              className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                              title={isSelected ? 'Bỏ chọn người này khi in' : 'Chọn người này để in'}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>

                            <span className="font-extrabold text-xs px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                              Giường #{worker.bedNumber}
                            </span>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm">
                                  {worker.fullName}
                                </h4>
                                <span className="text-xs text-slate-500 font-mono font-bold">
                                  ({worker.gender}, {getCleanDate(worker.birthDate)})
                                </span>
                              </div>
                              <div className="text-xs text-slate-600 font-mono">
                                CCCD: <strong className="text-slate-900 font-bold">{worker.citizenId}</strong>
                                {worker.address && <span className="text-slate-500 hidden sm:inline"> • {worker.address}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleDownloadComposite(worker)}
                              disabled={isGeneratingComposite === worker.id}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                              title="Tải ảnh ghép thẻ đôi dạng PNG"
                            >
                              {isGeneratingComposite === worker.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Download className="w-3 h-3 text-slate-500" />
                              )}
                              <span>Xuất ảnh ghép PNG</span>
                            </button>
                          </div>
                        </div>

                        {/* Front and Back Cards Grid */}
                        <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 1. Mặt trước */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span className="flex items-center gap-1.5 text-blue-700">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                1. MẶT TRƯỚC (CÓ ẢNH CHÂN DUNG)
                              </span>
                              {frontInfo.isRealPhoto ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  Ảnh thật
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                                  Mẫu số hóa
                                </span>
                              )}
                            </div>

                            <div className="relative aspect-[85.6/53.98] w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center group shadow-xs">
                              <img
                                src={frontInfo.url}
                                alt={`Mặt trước CCCD - ${worker.fullName}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage({ url: frontInfo.url, title: `Mặt trước CCCD - ${worker.fullName}` })}
                                  className="p-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all cursor-pointer shadow-md"
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
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all cursor-pointer shadow-md flex items-center gap-1 text-xs font-bold"
                                    title="Thay thế bằng ảnh chụp mới"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Đổi ảnh</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 2. Mặt sau */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span className="flex items-center gap-1.5 text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                2. MẶT SAU (CÓ CHIP &amp; QR)
                              </span>
                              {backInfo.isRealPhoto ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5" />
                                  Ảnh thật
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-full">
                                  Mẫu số hóa
                                </span>
                              )}
                            </div>

                            <div className="relative aspect-[85.6/53.98] w-full rounded-xl overflow-hidden border border-slate-300 bg-slate-900 flex items-center justify-center group shadow-xs">
                              <img
                                src={backInfo.url}
                                alt={`Mặt sau CCCD - ${worker.fullName}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage({ url: backInfo.url, title: `Mặt sau CCCD - ${worker.fullName}` })}
                                  className="p-2 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-all cursor-pointer shadow-md"
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
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all cursor-pointer shadow-md flex items-center gap-1 text-xs font-bold"
                                    title="Thay thế bằng ảnh chụp mới"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
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
          )}

          {/* ========================================================================= */}
          {/* TAB 2: A4 PRINT PREVIEW (CHẾ ĐỘ XEM TRƯỚC KHI IN A4 TRỰC QUAN)             */}
          {/* ========================================================================= */}
          {activeTab === 'preview' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-700/90 flex flex-col items-center gap-6 print:hidden">
              {pages.length === 0 ? (
                <div className="p-12 text-center text-slate-200 space-y-3">
                  <AlertCircle className="w-12 h-12 mx-auto text-amber-400" />
                  <p className="text-base font-bold">Chưa có công nhân nào được chọn để in.</p>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"
                  >
                    Chọn tất cả công nhân
                  </button>
                </div>
              ) : (
                pages.map((pageWorkers, pageIndex) => (
                  <div
                    key={pageIndex}
                    style={{
                      transform: `scale(${previewZoom / 100})`,
                      transformOrigin: 'top center',
                      width: '210mm',
                      minHeight: '297mm',
                    }}
                    className="bg-white text-slate-900 shadow-2xl rounded-xs p-[12mm] flex flex-col justify-between border border-slate-300 relative transition-transform duration-150 mb-4"
                  >
                    {/* Top Sheet Header */}
                    <div>
                      <div className="text-center border-b border-slate-900 pb-3 mb-4">
                        <div className="font-bold text-[12px] uppercase tracking-wider text-slate-800">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </div>
                        <div className="font-bold text-[11px] text-slate-900">
                          Độc lập - Tự do - Hạnh phúc
                        </div>
                        <div className="w-24 h-0.5 bg-slate-800 mx-auto my-1.5" />
                        <h1 className="text-sm sm:text-base font-black uppercase text-slate-950 mt-2 tracking-wide">
                          BẢN SAO CHỤP ẢNH CĂN CƯỚC CÔNG DÂN (2 MẶT)
                        </h1>
                        <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                          KÝ TÚC XÁ CÔNG NHÂN • PHÒNG: {room.name.toUpperCase()} • {zone?.name || 'Khu'} • {block?.name || 'Dãy'}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          Ngày in: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}
                        </div>
                      </div>

                      {/* Workers on this sheet */}
                      <div className="space-y-4">
                        {pageWorkers.map((worker) => {
                          const frontInfo = getWorkerFrontCard(worker);
                          const backInfo = getWorkerBackCard(worker);

                          return (
                            <div
                              key={worker.id}
                              className="border border-slate-400 rounded-lg p-3 bg-white"
                            >
                              {/* Worker info banner */}
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-xs px-2 py-0.5 bg-slate-100 border border-slate-400 rounded text-slate-900">
                                    Giường #{worker.bedNumber}
                                  </span>
                                  <span className="font-bold text-slate-950 text-sm">
                                    {worker.fullName.toUpperCase()}
                                  </span>
                                  <span className="text-slate-600 font-mono text-[11px]">
                                    ({worker.gender} - {getCleanDate(worker.birthDate)})
                                  </span>
                                </div>
                                <div className="font-mono text-slate-800 font-bold text-xs">
                                  Số CCCD: <span className="tracking-wider">{worker.citizenId}</span>
                                </div>
                              </div>

                              {/* Two Cards Row */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Mặt trước */}
                                <div>
                                  <div className="text-[9px] font-bold text-blue-800 uppercase mb-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-700 inline-block"></span>
                                    Mặt trước (Ảnh chân dung)
                                  </div>
                                  <div className="aspect-[85.6/53.98] w-full rounded-md overflow-hidden border border-slate-500 bg-slate-100 flex items-center justify-center">
                                    <img
                                      src={frontInfo.url}
                                      alt="Mặt trước"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>

                                {/* Mặt sau */}
                                <div>
                                  <div className="text-[9px] font-bold text-emerald-800 uppercase mb-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 inline-block"></span>
                                    Mặt sau (Chip &amp; Mã vạch)
                                  </div>
                                  <div className="aspect-[85.6/53.98] w-full rounded-md overflow-hidden border border-slate-500 bg-slate-100 flex items-center justify-center">
                                    <img
                                      src={backInfo.url}
                                      alt="Mặt sau"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Extra worker details */}
                              <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-600">
                                <span>Quê quán / Địa chỉ: <strong>{worker.address || worker.hometown || 'Chưa cập nhật'}</strong></span>
                                {worker.teamLeaderPhone && (
                                  <span>Tổ trưởng: {worker.teamLeaderName || ''} ({worker.teamLeaderPhone})</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Sheet Footer */}
                    <div className="pt-4 border-t border-slate-300 flex items-end justify-between text-[10px] text-slate-700">
                      <div>
                        <div>Ký túc xá công nhân - {room.name}</div>
                        <div className="text-slate-400">Tài liệu lưu trữ nội bộ và đăng ký tạm trú</div>
                      </div>

                      <div className="text-center min-w-[140px]">
                        <div className="font-bold">Người lập / Quản lý KTX</div>
                        <div className="h-12 flex items-center justify-center text-slate-300 italic text-[9px]">
                          (Ký và ghi rõ họ tên)
                        </div>
                      </div>

                      <div className="font-bold text-slate-500">
                        Trang {pageIndex + 1} / {pages.length}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. PRINTABLE AREA - KHU VỰC IN CHÍNH THỨC CỦA TRÌNH DUYỆT                 */}
          {/* ========================================================================= */}
          <div id="printable-id-cards-area" className="hidden print:block">
            {pages.map((pageWorkers, pageIndex) => (
              <div
                key={pageIndex}
                className={`p-0 bg-white text-slate-900 ${
                  pageIndex < pages.length - 1 ? 'print-page-break' : ''
                }`}
              >
                {/* Official National Header */}
                <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                  <div className="font-bold text-xs uppercase tracking-wider text-slate-800">
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                  </div>
                  <div className="font-bold text-[11px] text-slate-900">
                    Độc lập - Tự do - Hạnh phúc
                  </div>
                  <div className="w-20 h-0.5 bg-slate-900 mx-auto my-1" />
                  <h1 className="text-base font-black uppercase text-slate-950 mt-1.5 tracking-wide">
                    BẢN SAO CHỤP ẢNH CĂN CƯỚC CÔNG DÂN (2 MẶT)
                  </h1>
                  <div className="text-[11px] text-slate-700 font-semibold mt-0.5">
                    KÝ TÚC XÁ CÔNG NHÂN • PHÒNG: {room.name.toUpperCase()} • {zone?.name || 'Khu'} • {block?.name || 'Dãy'}
                  </div>
                  <div className="text-[9px] text-slate-500 mt-0.5">
                    Thời gian in: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN')}
                  </div>
                </div>

                {/* Workers on this sheet */}
                <div className="space-y-3">
                  {pageWorkers.map((worker) => {
                    const frontInfo = getWorkerFrontCard(worker);
                    const backInfo = getWorkerBackCard(worker);

                    return (
                      <div
                        key={worker.id}
                        className="border border-slate-400 rounded-lg p-2.5 bg-white print-avoid-break"
                      >
                        {/* Worker Header Info */}
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-300 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs px-2 py-0.5 bg-slate-100 border border-slate-600 rounded text-slate-950">
                              Giường #{worker.bedNumber}
                            </span>
                            <span className="font-bold text-slate-950 text-sm">
                              {worker.fullName.toUpperCase()}
                            </span>
                            <span className="text-slate-600 font-mono text-[11px]">
                              ({worker.gender} - {getCleanDate(worker.birthDate)})
                            </span>
                          </div>
                          <div className="font-mono text-slate-900 font-bold text-xs">
                            Số CCCD: <span className="tracking-wider">{worker.citizenId}</span>
                          </div>
                        </div>

                        {/* Two Cards Row (Front + Back) */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Mặt trước */}
                          <div>
                            <div className="text-[9px] font-bold text-slate-800 uppercase mb-0.5">
                              1. Mặt trước (Ảnh chân dung)
                            </div>
                            <div className="aspect-[85.6/53.98] w-full rounded border border-slate-500 bg-slate-50 flex items-center justify-center overflow-hidden">
                              <img
                                src={frontInfo.url}
                                alt="Mặt trước"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>

                          {/* Mặt sau */}
                          <div>
                            <div className="text-[9px] font-bold text-slate-800 uppercase mb-0.5">
                              2. Mặt sau (Chip &amp; Mã vạch)
                            </div>
                            <div className="aspect-[85.6/53.98] w-full rounded border border-slate-500 bg-slate-50 flex items-center justify-center overflow-hidden">
                              <img
                                src={backInfo.url}
                                alt="Mặt sau"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Extra Details */}
                        <div className="mt-1.5 pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600">
                          <span>Địa chỉ: <strong>{worker.address || worker.hometown || 'Chưa cập nhật'}</strong></span>
                          {worker.teamLeaderPhone && (
                            <span>Tổ trưởng: {worker.teamLeaderName || ''} ({worker.teamLeaderPhone})</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Printable Page Footer */}
                <div className="pt-3 mt-3 border-t border-slate-400 flex items-end justify-between text-[10px] text-slate-700">
                  <div>
                    <div>Ký túc xá công nhân - Phòng {room.name}</div>
                    <div className="text-slate-400 text-[9px]">Tài liệu lưu trữ và quản lý tạm trú</div>
                  </div>

                  <div className="text-center min-w-[140px]">
                    <div className="font-bold">Ban quản lý KTX xác nhận</div>
                    <div className="h-10 flex items-center justify-center text-slate-400 italic text-[9px]">
                      (Ký và ghi rõ họ tên)
                    </div>
                  </div>

                  <div className="font-bold text-slate-600">
                    Trang {pageIndex + 1} / {pages.length}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 4. Modal Footer (Screen only) */}
          <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden text-xs">
            <div className="text-slate-500 flex items-center gap-2">
              <span>Đang chọn: <strong>{selectedWorkers.length}</strong> / {displayedWorkers.length} công nhân</span>
              <span>•</span>
              <span>Dự kiến: <strong>{pages.length}</strong> trang A4</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={selectedWorkers.length === 0}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
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
