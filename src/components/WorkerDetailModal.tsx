import React from 'react';
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
  Briefcase
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
                  {room?.name} • Giường #{worker.bedNumber} • Tủ #{worker.lockerNumber || worker.bedNumber}
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
    </div>
  );
};
