import React, { useState } from 'react';
import { 
  Worker, 
  Zone, 
  Room 
} from '../types';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Bed, 
  Calendar, 
  Shield, 
  ArrowRightLeft, 
  Edit3, 
  Trash2,
  Clock,
  Briefcase,
  CreditCard,
  ZoomIn,
  Check,
  Sparkles
} from 'lucide-react';
import { formatDate, formatPhoneNumber } from '../utils/vietnamese';

interface WorkerDetailModalProps {
  worker: Worker | null;
  zones: Zone[];
  rooms: Room[];
  onClose: () => void;
  onEdit: (worker: Worker) => void;
  onTransfer: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
  onViewRoom: (roomId: string) => void;
}

export const WorkerDetailModal: React.FC<WorkerDetailModalProps> = ({
  worker,
  zones = [],
  rooms = [],
  onClose,
  onEdit,
  onTransfer,
  onDelete,
  onViewRoom,
}) => {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  if (!worker) return null;

  const room = (rooms || []).find(r => r.id === worker.roomId);
  const zone = (zones || []).find(z => z.id === worker.zoneId);
  const block = zone?.blocks?.find(b => b.id === worker.blockId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 lg:p-6">
      <div 
        id="modal-worker-profile"
        className="bg-white sm:rounded-3xl max-w-xl w-full shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full sm:h-auto"
      >
        {/* Header with Avatar & Name */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 sm:gap-4 pr-8">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${worker.avatarColor || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-xl sm:text-2xl shadow-lg ring-4 ring-slate-800 shrink-0 overflow-hidden`}>
              {worker.photoUrl ? (
                <img
                  src={worker.photoUrl}
                  alt={worker.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                worker.fullName.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl font-bold text-white truncate">
                  {worker.fullName}
                </h3>
                <span className="text-[10px] sm:text-xs font-mono bg-blue-900/90 text-blue-300 border border-blue-700 px-2 py-0.5 rounded-md font-bold">
                  {worker.code}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 truncate">
                Tổ trưởng: <strong>{worker.teamLeaderName || 'Chưa cập nhật'}</strong>
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                <span className={`text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full ${
                  worker.gender === 'Nam' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  Giới tính: {worker.gender}
                </span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {worker.status === 'active' ? '● Đang cư trú' : '○ Tạm vắng'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details List */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-sm text-slate-700 overflow-y-auto flex-1">
          {/* Vị trí cư trú */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-2">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bed className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {room?.name} • Giường #{worker.bedNumber} • {worker.lockerNumber !== undefined ? `${worker.lockerNumber} tủ đồ` : '1 tủ đồ'}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 truncate">
                  {zone?.name} &gt; {block?.name} (Tối đa {room?.maxCapacity || 20} người)
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onViewRoom(worker.roomId);
              }}
              className="px-3 py-2 bg-white hover:bg-blue-600 active:bg-blue-700 hover:text-white text-blue-700 text-xs font-semibold rounded-xl border border-blue-300 transition-colors cursor-pointer touch-manipulation min-h-[38px] shrink-0"
            >
              Xem phòng
            </button>
          </div>

          {/* Grid 8 thông tin trường dữ liệu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* 1. Mã nhân viên */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                1. Mã nhân viên
              </div>
              <div className="font-bold text-slate-900 text-sm sm:text-base font-mono">
                {worker.code}
              </div>
            </div>

            {/* 6. Số CCCD */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                6. Số CCCD / CMND
              </div>
              <div className="font-bold font-mono text-emerald-700 text-sm sm:text-base">
                {worker.citizenId}
              </div>
            </div>

            {/* 2. Họ và tên */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                2. Họ và tên
              </div>
              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                {worker.fullName}
              </div>
            </div>

            {/* 4. Ngày, tháng, năm sinh */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                4. Ngày sinh
              </div>
              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                {formatDate(worker.birthDate) || 'Chưa cập nhật'}
              </div>
            </div>

            {/* 5. Thôn/số nhà, Xã/Phường, Tỉnh/Thành Phố */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200 sm:col-span-2">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                5. Thôn/số nhà, Xã/Phường, Tỉnh/Thành Phố
              </div>
              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                {worker.address || 'Chưa cập nhật'}
              </div>
            </div>

            {/* 7. Tên tổ trưởng */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                7. Tên tổ trưởng
              </div>
              <div className="font-semibold text-slate-900 text-sm sm:text-base">
                {worker.teamLeaderName || 'Chưa có'}
              </div>
            </div>

            {/* 8. SĐT tổ trưởng */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-medium mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                8. SĐT tổ trưởng
              </div>
              {worker.teamLeaderPhone ? (
                <a 
                  href={`tel:${worker.teamLeaderPhone}`}
                  className="font-bold text-emerald-700 text-sm sm:text-base hover:underline flex items-center gap-1.5"
                >
                  <span>{formatPhoneNumber(worker.teamLeaderPhone)}</span>
                  <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Gọi ngay</span>
                </a>
              ) : (
                <div className="text-slate-400 text-sm">Chưa có số</div>
              )}
            </div>
          </div>

          {/* ẢNH THẺ CĂN CƯỚC CÔNG DÂN (CCCD) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ảnh Thẻ Căn Cước Công Dân (CCCD)
                </h4>
                {(worker.idCardFrontUrl || worker.idCardBackUrl || worker.idCardUrl) && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                    Chuẩn HD
                  </span>
                )}
              </div>
              {(worker.idCardFrontUrl || worker.idCardBackUrl || worker.idCardUrl) ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Đã lưu ảnh thẻ HD
                </span>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(worker);
                  }}
                  className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  + Thêm ảnh CCCD
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mặt trước CCCD */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Mặt trước CCCD
                  </span>
                  {(worker.idCardFrontUrl || worker.idCardUrl) && (
                    <button 
                      type="button" 
                      onClick={() => setLightboxImage({ url: (worker.idCardFrontUrl || worker.idCardUrl)!, title: `Mặt trước CCCD - ${worker.fullName}` })}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ZoomIn className="w-3 h-3" />
                      Phóng to
                    </button>
                  )}
                </div>
                <div 
                  onClick={() => (worker.idCardFrontUrl || worker.idCardUrl) && setLightboxImage({ url: (worker.idCardFrontUrl || worker.idCardUrl)!, title: `Mặt trước CCCD - ${worker.fullName}` })}
                  className={`aspect-[85/54] rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center relative ${
                    (worker.idCardFrontUrl || worker.idCardUrl) ? 'cursor-pointer group' : ''
                  }`}
                >
                  {(worker.idCardFrontUrl || worker.idCardUrl) ? (
                    <>
                      <img 
                        src={worker.idCardFrontUrl || worker.idCardUrl} 
                        alt="Mặt trước CCCD" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" />
                        <span>Xem chi tiết</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3 text-slate-400 space-y-1">
                      <CreditCard className="w-7 h-7 mx-auto text-slate-600" />
                      <div className="text-[11px] text-slate-400">Chưa có ảnh mặt trước</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mặt sau CCCD */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Mặt sau CCCD
                  </span>
                  {worker.idCardBackUrl && (
                    <button 
                      type="button" 
                      onClick={() => setLightboxImage({ url: worker.idCardBackUrl!, title: `Mặt sau CCCD - ${worker.fullName}` })}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ZoomIn className="w-3 h-3" />
                      Phóng to
                    </button>
                  )}
                </div>
                <div 
                  onClick={() => worker.idCardBackUrl && setLightboxImage({ url: worker.idCardBackUrl, title: `Mặt sau CCCD - ${worker.fullName}` })}
                  className={`aspect-[85/54] rounded-lg overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center relative ${
                    worker.idCardBackUrl ? 'cursor-pointer group' : ''
                  }`}
                >
                  {worker.idCardBackUrl ? (
                    <>
                      <img 
                        src={worker.idCardBackUrl} 
                        alt="Mặt sau CCCD" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" />
                        <span>Xem chi tiết</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3 text-slate-400 space-y-1">
                      <CreditCard className="w-7 h-7 mx-auto text-slate-600" />
                      <div className="text-[11px] text-slate-400">Chưa có ảnh mặt sau</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {worker.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
              <strong>Ghi chú:</strong> {worker.notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              onClose();
              onDelete(worker);
            }}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 active:bg-rose-200 rounded-xl transition-colors cursor-pointer touch-manipulation min-h-[40px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Trả phòng</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onTransfer(worker);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-50 active:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl border border-amber-300 transition-colors cursor-pointer touch-manipulation min-h-[40px]"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Chuyển phòng</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(worker);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs touch-manipulation min-h-[40px]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Modal để xem ảnh CCCD chi tiết phóng to */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div 
            className="bg-slate-900 rounded-3xl p-3 sm:p-5 max-w-2xl w-full border border-slate-700 shadow-2xl relative space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base flex-wrap">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>{lightboxImage.title}</span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  HD Sắc Nét
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[75vh]">
              <img 
                src={lightboxImage.url} 
                alt={lightboxImage.title}
                className="w-full h-auto max-h-[72vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
