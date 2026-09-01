import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Check, 
  Camera, 
  Building, 
  Bed, 
  Phone, 
  Shield, 
  MapPin, 
  Sparkles, 
  AlertTriangle,
  Upload,
  Trash2,
  Image as ImageIcon,
  Smartphone
} from 'lucide-react';
import { Worker, Zone, Room, QrParsedCCCD } from '../types';
import { AVATAR_COLORS } from '../data/dormitoryData';
import { QrScannerModal } from './QrScannerModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { fileToDataUrl, compressAndCropImage } from '../utils/imageUtils';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (workerData: Partial<Worker>) => void;
  onSaveWorker?: (workerData: Partial<Worker>) => void;
  worker?: Worker | null; // null if adding new
  workerToEdit?: Worker | null;
  zones?: Zone[];
  rooms?: Room[];
  defaultZoneId?: string;
  defaultBlockId?: string;
  defaultRoomId?: string;
  initialRoomId?: string;
  initialBedNumber?: number;
  existingWorkers?: Worker[];
  allWorkers?: Worker[];
}

export const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveWorker,
  worker: propWorker,
  workerToEdit,
  zones = [],
  rooms = [],
  defaultZoneId,
  defaultBlockId,
  defaultRoomId,
  initialRoomId,
  initialBedNumber,
  existingWorkers: propExistingWorkers,
  allWorkers = [],
}) => {
  const worker = workerToEdit !== undefined ? workerToEdit : propWorker;
  const existingWorkers = (propExistingWorkers || allWorkers || []);
  const resolvedSave = onSaveWorker || onSave || (() => {});
  const effectiveDefaultRoomId = initialRoomId || defaultRoomId;
  const isEditing = !!worker;

  // Form Fields (Theo đúng 8 mục của bạn)
  const [code, setCode] = useState(''); // 1. Mã nhân viên
  const [fullName, setFullName] = useState(''); // 2. Họ và tên
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam'); // 3. Giới tính
  const [birthDate, setBirthDate] = useState(''); // 4. Ngày sinh YYYY-MM-DD
  const [address, setAddress] = useState(''); // 5. Thôn/số nhà, Xã/Phường, Tỉnh/Thành phố
  const [citizenId, setCitizenId] = useState(''); // 6. Số CCCD
  const [teamLeaderName, setTeamLeaderName] = useState(''); // 7. Tên tổ trưởng
  const [teamLeaderPhone, setTeamLeaderPhone] = useState(''); // 8. SĐT tổ trưởng

  // Cư trú KTX
  const [zoneId, setZoneId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedNumber, setBedNumber] = useState<number>(1);
  const [lockerNumber, setLockerNumber] = useState<number>(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Scanner & Camera modal states
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isCameraCaptureOpen, setIsCameraCaptureOpen] = useState(false);
  const [qrNotification, setQrNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ảnh chân dung công nhân (base64)
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when modal opens or worker changes
  useEffect(() => {
    if (worker) {
      setCode(worker.code || '');
      setFullName(worker.fullName || '');
      setGender(worker.gender || 'Nam');
      setBirthDate(worker.birthDate || '');
      setAddress(worker.address || '');
      setCitizenId(worker.citizenId || '');
      setTeamLeaderName(worker.teamLeaderName || '');
      setTeamLeaderPhone(worker.teamLeaderPhone || '');
      setPhotoUrl(worker.photoUrl || undefined);
      setZoneId(worker.zoneId || zones[0]?.id || '');
      setBlockId(worker.blockId || '');
      setRoomId(worker.roomId || '');
      setBedNumber(worker.bedNumber || 1);
      setLockerNumber(worker.lockerNumber || worker.bedNumber || 1);
      setStartDate(worker.startDate || new Date().toISOString().split('T')[0]);
      setNotes(worker.notes || '');
    } else {
      // Auto-generate Mã nhân viên nếu là thêm mới
      const autoCode = `NV-${Math.floor(1000 + Math.random() * 9000)}`;
      setCode(autoCode);
      setFullName('');
      setGender('Nam');
      setBirthDate('');
      setAddress('');
      setCitizenId('');
      setTeamLeaderName('');
      setTeamLeaderPhone('');
      setPhotoUrl(undefined);
      
      const targetZoneId = defaultZoneId || zones[0]?.id || '';
      setZoneId(targetZoneId);
      
      const targetZone = zones.find(z => z.id === targetZoneId);
      const targetBlockId = defaultBlockId || targetZone?.blocks?.[0]?.id || '';
      setBlockId(targetBlockId);

      const targetBlock = targetZone?.blocks?.find(b => b.id === targetBlockId);
      const targetRoomId = effectiveDefaultRoomId || targetBlock?.rooms?.[0]?.id || '';
      setRoomId(targetRoomId);

      // Tìm vị trí giường trống đầu tiên
      const roomOccupants = (existingWorkers || []).filter(w => w.roomId === targetRoomId);
      const occupiedBeds = new Set(roomOccupants.map(w => w.bedNumber));
      let chosenBed = initialBedNumber || 1;
      if (!initialBedNumber || occupiedBeds.has(initialBedNumber)) {
        for (let i = 1; i <= 20; i++) {
          if (!occupiedBeds.has(i)) {
            chosenBed = i;
            break;
          }
        }
      }
      setBedNumber(chosenBed);
      setLockerNumber(chosenBed);
      setStartDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setErrorMsg(null);
    setQrNotification(null);
  }, [isOpen, worker, defaultZoneId, defaultBlockId, defaultRoomId, effectiveDefaultRoomId, initialBedNumber, zones, existingWorkers]);

  // Xử lý ảnh tải lên từ input file
  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rawData = await fileToDataUrl(file);
      const compressed = await compressAndCropImage(rawData, 400, 400, 0.85);
      setPhotoUrl(compressed);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      setErrorMsg('Không thể xử lý ảnh tải lên. Vui lòng thử lại.');
    } finally {
      e.target.value = '';
    }
  };

  // Khi chọn Khu -> Cập nhật Dãy & Phòng tương ứng
  const currentZone = zones.find(z => z.id === zoneId);
  const currentBlocks = currentZone?.blocks || [];

  const handleZoneChange = (newZoneId: string) => {
    setZoneId(newZoneId);
    const z = zones.find(item => item.id === newZoneId);
    if (z && z.blocks && z.blocks.length > 0) {
      const newBlockId = z.blocks[0].id;
      setBlockId(newBlockId);
      const b = z.blocks[0];
      if (b.rooms && b.rooms.length > 0) {
        setRoomId(b.rooms[0].id);
      }
    }
  };

  const handleBlockChange = (newBlockId: string) => {
    setBlockId(newBlockId);
    const b = currentBlocks.find(item => item.id === newBlockId);
    if (b && b.rooms && b.rooms.length > 0) {
      setRoomId(b.rooms[0].id);
    }
  };

  const currentBlock = currentBlocks.find(b => b.id === blockId);
  const currentRooms = currentBlock?.rooms || [];
  const currentRoom = currentRooms.find(r => r.id === roomId);

  // Tìm các giường đã có người trong phòng này
  const roomOccupants = (existingWorkers || []).filter(
    w => w.roomId === roomId && (!worker || w.id !== worker.id)
  );
  const occupiedBedNumbers = new Set(roomOccupants.map(w => w.bedNumber));
  const isRoomFull = roomOccupants.length >= (currentRoom?.maxCapacity || 20);

  // Xử lý khi Quét mã QR CCCD thành công
  const handleQrScanSuccess = (qrData: QrParsedCCCD) => {
    if (qrData.citizenId) setCitizenId(qrData.citizenId);
    if (qrData.fullName) setFullName(qrData.fullName);
    if (qrData.birthDate) setBirthDate(qrData.birthDate);
    if (qrData.gender) setGender(qrData.gender);
    if (qrData.address) setAddress(qrData.address);

    setQrNotification(`Đã tự động điền thông tin từ CCCD số: ${qrData.citizenId}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation các trường bắt buộc
    if (!code.trim()) {
      setErrorMsg('Vui lòng nhập Mã nhân viên (Mục 1)');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên nhân viên (Mục 2)');
      return;
    }
    if (!citizenId.trim()) {
      setErrorMsg('Vui lòng nhập hoặc Quét mã QR Số CCCD (Mục 6)');
      return;
    }
    if (!roomId) {
      setErrorMsg('Vui lòng chọn Phòng ở cho nhân viên');
      return;
    }

    // Kiểm tra trùng giường
    if (occupiedBedNumbers.has(bedNumber)) {
      setErrorMsg(`Giường #${bedNumber} trong ${currentRoom?.name || 'phòng này'} đã có người nằm. Vui lòng chọn giường khác.`);
      return;
    }

    // Kiểm tra sức chứa tối đa 20 người
    if (!isEditing && isRoomFull) {
      setErrorMsg(`Phòng ${currentRoom?.name} đã đủ tối đa ${currentRoom?.maxCapacity || 20} người. Vui lòng chọn phòng khác.`);
      return;
    }

    const payload: Partial<Worker> = {
      ...(worker || {}),
      code: code.trim().toUpperCase(),
      fullName: fullName.trim(),
      gender,
      birthDate: birthDate || '',
      address: address.trim(),
      citizenId: citizenId.trim(),
      teamLeaderName: teamLeaderName.trim(),
      teamLeaderPhone: teamLeaderPhone.trim(),
      photoUrl: photoUrl || undefined,
      zoneId,
      blockId,
      roomId,
      bedNumber: Number(bedNumber),
      lockerNumber: Number(lockerNumber) || Number(bedNumber),
      startDate,
      status: 'active',
      notes: notes.trim(),
      avatarColor: worker?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    resolvedSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        <div 
          id="modal-worker-form"
          className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isEditing ? 'Cập Nhật Hồ Sơ Nhân Viên' : 'Tiếp Nhận Nhân Viên Vào Ký Túc Xá'}
                </h3>
                <p className="text-xs text-slate-400">
                  Lưu trữ trực tuyến an toàn & bảo mật trên Google Cloud Firebase
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden File Inputs for Photo */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoFileUpload}
          />
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePhotoFileUpload}
          />

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {qrNotification && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{qrNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrNotification(null)}
                  className="text-xs text-emerald-600 font-bold hover:underline"
                >
                  Đóng
                </button>
              </div>
            )}

            {/* Quick QR Scanner Action Bar */}
            <div className="bg-gradient-to-r from-blue-900 to-slate-900 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" />
                  QUÉT NHANH MÃ QR CCCD GẮN CHIP
                </div>
                <div className="text-xs text-slate-300">
                  Tự động điền: Số CCCD, Họ tên, Giới tính, Ngày sinh, Địa chỉ/Quê quán
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQrScannerOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg cursor-pointer"
              >
                <Camera className="w-4 h-4 text-slate-950" />
                <span>Bật Camera Quét CCCD</span>
              </button>
            </div>

            {/* PHẦN ẢNH CHÂN DUNG CÔNG NHÂN */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar / Portrait Preview */}
              <div className="relative group shrink-0">
                {photoUrl ? (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-md relative bg-slate-900">
                    <img
                      src={photoUrl}
                      alt="Ảnh chân dung công nhân"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      title="Xóa ảnh này"
                      className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 gap-1 shadow-inner">
                    <User className="w-7 h-7 text-slate-300" />
                    <span className="text-[10px] font-semibold text-slate-400">Chưa có ảnh</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex-1 text-center sm:text-left space-y-1.5 w-full">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Ảnh Chân Dung Công Nhân
                  </h4>
                  {photoUrl && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Đã lưu ảnh
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Chụp ảnh trực tiếp từ camera hoặc tải ảnh chân dung công nhân để lưu vào hồ sơ.
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCameraCaptureOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{photoUrl ? 'Chụp lại ảnh' : 'Chụp ảnh trực tiếp'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chụp bằng ĐT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tải ảnh từ máy</span>
                  </button>

                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl(undefined)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PHẦN 1: THÔNG TIN CÁ NHÂN (8 TRƯỜNG DỮ LIỆU CHÍNH) */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                Thông Tin Nhân Viên
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Mã nhân viên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. Mã nhân viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VD: NV-1001"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-900 uppercase"
                  />
                </div>

                {/* 6. Số CCCD */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>6. Số CCCD / CMND <span className="text-rose-500">*</span></span>
                    <span className="text-[10px] text-blue-600 font-normal">Quét QR hoặc gõ 12 số</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={citizenId}
                      onChange={(e) => setCitizenId(e.target.value)}
                      placeholder="12 chữ số trên thẻ CCCD"
                      className="w-full pl-3 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono font-bold text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setIsQrScannerOpen(true)}
                      title="Quét QR CCCD"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. Họ và tên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. Họ và tên nhân viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-slate-900"
                  />
                </div>

                {/* 3. Giới tính (Dạng click chọn Nam hoặc Nữ) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. Giới tính <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Nam')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        gender === 'Nam'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                      <span>Nam</span>
                      {gender === 'Nam' && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setGender('Nữ')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        gender === 'Nữ'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                      <span>Nữ</span>
                      {gender === 'Nữ' && <Check className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                  </div>
                </div>

                {/* 4. Ngày, tháng, năm sinh */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    4. Ngày, tháng, năm sinh
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* 5. Thôn/số nhà, Xã/Phường, Tỉnh/Thành Phố */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    5. Thôn/số nhà, Xã/Phường, Tỉnh/Thành Phố (Quê quán / Thường trú)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="VD: Thôn 3, Xã Diễn Hùng, Tỉnh Nghệ An"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* 7. Tên tổ trưởng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    7. Tên tổ trưởng
                  </label>
                  <input
                    type="text"
                    value={teamLeaderName}
                    onChange={(e) => setTeamLeaderName(e.target.value)}
                    placeholder="VD: Phạm Đức Thắng"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium"
                  />
                </div>

                {/* 8. SĐT tổ trưởng */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    8. SĐT tổ trưởng
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={teamLeaderPhone}
                      onChange={(e) => setTeamLeaderPhone(e.target.value)}
                      placeholder="VD: 0988 776 655"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN 2: PHÂN BỔ PHÒNG & GIƯỜNG & TỦ ĐỒ (KHU > DÃY > PHÒNG) */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  Vị Trí Cư Trú (Khu &gt; Dãy &gt; Phòng &gt; Giường &gt; Tủ đồ)
                </h4>
                <span className="text-[11px] text-slate-500">Mỗi phòng tối đa 20 người</span>
              </div>

              {/* Bộ 3 chọn: Khu -> Dãy -> Phòng */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khu Ký Túc Xá
                  </label>
                  <select
                    value={zoneId}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer font-bold"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dãy Nhà
                  </label>
                  <select
                    value={blockId}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer font-bold"
                  >
                    {currentBlocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phòng Ở
                  </label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer font-bold text-blue-700"
                  >
                    {currentRooms.map(r => {
                      const count = existingWorkers.filter(w => w.roomId === r.id && (!worker || w.id !== worker.id)).length;
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} ({count}/{r.maxCapacity || 20} người)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Chọn Giường & Tủ đồ */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Bed className="w-4 h-4 text-blue-600" />
                    Chọn Vị Trí Giường Ngủ (1 - {currentRoom?.bedCount || 20})
                  </span>
                  <span className={`font-semibold ${isRoomFull ? 'text-rose-600 font-bold' : 'text-emerald-700'}`}>
                    Hiện tại: {roomOccupants.length}/{currentRoom?.maxCapacity || 20} người
                  </span>
                </div>

                {/* Grid 20 giường ngủ để click chọn trực quan */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {Array.from({ length: currentRoom?.bedCount || 20 }, (_, idx) => {
                    const bedNum = idx + 1;
                    const isOccupied = occupiedBedNumbers.has(bedNum);
                    const isSelected = bedNumber === bedNum;

                    return (
                      <button
                        key={bedNum}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => {
                          setBedNumber(bedNum);
                          setLockerNumber(bedNum);
                        }}
                        title={isOccupied ? `Giường #${bedNum} đã có người` : `Chọn giường #${bedNum}`}
                        className={`h-11 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isOccupied
                            ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400 ring-offset-1'
                            : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-400 hover:bg-blue-50'
                        }`}
                      >
                        <span className="text-[10px] leading-tight">G</span>
                        <span className="text-xs">{bedNum}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số Tủ Đồ Cá Nhân
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={currentRoom?.lockerCount || 30}
                      value={lockerNumber}
                      onChange={(e) => setLockerNumber(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl outline-none font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ngày bắt đầu vào ở
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl outline-none text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ghi chú thêm */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú thêm (Nếu có)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú về phân xưởng, chức vụ hoặc tình trạng sức khỏe..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Lưu Thay Đổi' : 'Xác Nhận Lưu Vào Hệ Thống'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraCaptureOpen}
        onClose={() => setIsCameraCaptureOpen(false)}
        onCapture={(photoData) => setPhotoUrl(photoData)}
        workerName={fullName || 'công nhân'}
      />
    </>
  );
};
