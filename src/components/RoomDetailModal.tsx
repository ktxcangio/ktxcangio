import React, { useState } from 'react';
import { 
  Room, 
  Worker, 
  Zone, 
  Block 
} from '../types';
import { 
  X, 
  Bed, 
  User, 
  UserPlus, 
  Phone, 
  MapPin, 
  ArrowRightLeft, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  Briefcase,
  Shield,
  CreditCard,
  Printer
} from 'lucide-react';
import { formatPhoneNumber } from '../utils/vietnamese';

interface RoomDetailModalProps {
  room: Room | null;
  zone: Zone | undefined;
  block: Block | undefined;
  workersInRoom: Worker[];
  onClose: () => void;
  onAddWorkerToBed: (bedNumber: number) => void;
  onSelectWorker: (worker: Worker) => void;
  onEditWorker: (worker: Worker) => void;
  onTransferWorker: (worker: Worker) => void;
  onDeleteWorker: (worker: Worker) => void;
  onOpenIdCardsPrint?: () => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  zone,
  block,
  workersInRoom = [],
  onClose,
  onAddWorkerToBed,
  onSelectWorker,
  onEditWorker,
  onTransferWorker,
  onDeleteWorker,
  onOpenIdCardsPrint,
}) => {
  if (!room) return null;

  const safeWorkers = workersInRoom || [];
  const maxCapacity = room.maxCapacity || 20;
  const count = safeWorkers.length;
  const isFull = count >= maxCapacity;
  const percentage = Math.round((count / maxCapacity) * 100);

  // Tạo map giường
  const bedMap = new Map<number, Worker>();
  safeWorkers.forEach((w) => {
    bedMap.set(w.bedNumber, w);
  });

  // Số lượng ô giường hiển thị tự động co giãn theo số công nhân thực tế
  const maxBedNumberUsed = Math.max(0, ...Array.from(bedMap.keys()));
  const totalBeds = Math.max(room.bedCount || 20, maxBedNumberUsed, count + 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 lg:p-6">
      <div 
        id="modal-room-detail"
        className="bg-white sm:rounded-3xl w-full max-w-4xl shadow-2xl border-0 sm:border border-slate-200 overflow-hidden h-full sm:h-auto sm:max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
              <Bed className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-base sm:text-xl font-bold text-white truncate">
                  Chi tiết {room.name}
                </h3>
                <span className="text-[11px] sm:text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                  {zone?.name || 'Khu'} • {block?.name || 'Dãy'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Đang ở {count} người (Không giới hạn) • Chuẩn thiết kế: {maxCapacity} chỗ • {room.lockerCount || 20} tủ đồ
              </p>
            </div>
          </div>

          <button
            id="btn-close-room-detail"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Occupancy Bar & Quick Summary */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-slate-800">
                Tình trạng:
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                count > maxCapacity
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : isFull
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {count} người đang ở
              </span>
              <span className="text-xs text-slate-500">
                • {count >= maxCapacity ? 'Có thể tiếp tục thêm không giới hạn' : `Còn ${maxCapacity - count} chỗ theo chuẩn thiết kế`}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenIdCardsPrint && count > 0 && (
                <button
                  id="btn-export-room-idcards"
                  onClick={onOpenIdCardsPrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs touch-manipulation min-h-[38px]"
                  title="In hoặc xuất hình ảnh 2 mặt CCCD của các công nhân trong phòng này"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>In / Xuất CCCD 2 mặt ({count})</span>
                </button>
              )}

              <button
                id="btn-quick-add-worker"
                onClick={() => {
                  // Tìm giường trống đầu tiên hoặc cấp số tiếp theo
                  let targetBed = 1;
                  while (bedMap.has(targetBed)) {
                    targetBed++;
                  }
                  onAddWorkerToBed(targetBed);
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs touch-manipulation min-h-[38px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Thêm nhân viên vào phòng này</span>
              </button>
            </div>
          </div>

          {/* Progress Visual */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 transition-all duration-300 ${
                count > maxCapacity ? 'bg-purple-500' : isFull ? 'bg-blue-500' : count >= 16 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            ></div>
          </div>
        </div>

        {/* Beds Interactive Layout */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              Sơ đồ Vị Trí Giường Ngủ (Hiển thị {totalBeds} vị trí):
            </h4>
            <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Đang ở ({count})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Vị trí trống ({Math.max(0, totalBeds - count)})
              </span>
            </div>
          </div>

          {/* Grid Giường */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {Array.from({ length: totalBeds }, (_, idx) => {
              const bedNumber = idx + 1;
              const worker = bedMap.get(bedNumber);

              if (worker) {
                return (
                  <div
                    key={bedNumber}
                    id={`bed-slot-${bedNumber}`}
                    className="bg-white rounded-2xl border border-blue-200 p-3 shadow-xs hover:border-blue-400 transition-all flex flex-col justify-between group relative space-y-2"
                  >
                    <div>
                      {/* Bed header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200">
                          Giường #{bedNumber} • {worker.lockerNumber !== undefined ? `${worker.lockerNumber} tủ` : '1 tủ'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-semibold">
                          {worker.code}
                        </span>
                      </div>

                      {/* Worker info */}
                      <div className="flex items-start gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${worker.avatarColor || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs overflow-hidden`}>
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
                          <button
                            onClick={() => onSelectWorker(worker)}
                            className="font-bold text-slate-900 text-xs hover:text-blue-600 truncate block text-left w-full cursor-pointer"
                          >
                            {worker.fullName}
                          </button>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            CCCD: {worker.citizenId}
                          </div>
                          {worker.teamLeaderName && (
                            <div className="text-[10px] text-slate-600 truncate mt-0.5">
                              Tổ: {worker.teamLeaderName}
                            </div>
                          )}
                        </div>
                      </div>

                      {worker.notes && (
                        <div className="mt-1.5 text-[10px] bg-amber-50 text-amber-800 p-1.5 rounded-lg border border-amber-200 line-clamp-1">
                          📝 {worker.notes}
                        </div>
                      )}
                    </div>

                    {/* Action buttons on bed */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1">
                      <button
                        onClick={() => onTransferWorker(worker)}
                        title="Đổi sang phòng hoặc giường khác"
                        className="p-1.5 text-slate-500 hover:text-amber-600 active:bg-amber-50 rounded-lg transition-colors cursor-pointer touch-manipulation min-h-[34px] min-w-[34px] flex items-center justify-center"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditWorker(worker)}
                        title="Sửa thông tin"
                        className="p-1.5 text-slate-500 hover:text-blue-600 active:bg-blue-50 rounded-lg transition-colors cursor-pointer touch-manipulation min-h-[34px] min-w-[34px] flex items-center justify-center"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteWorker(worker)}
                        title="Trả phòng / Xóa công nhân này"
                        className="p-1.5 text-slate-400 hover:text-rose-600 active:bg-rose-50 rounded-lg transition-colors cursor-pointer touch-manipulation min-h-[34px] min-w-[34px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              }

              // Giường trống
              return (
                <div
                  key={bedNumber}
                  id={`bed-slot-empty-${bedNumber}`}
                  className="bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 p-3 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center text-center min-h-[110px]"
                >
                  <span className="text-[11px] font-bold bg-slate-200/70 text-slate-600 px-2 py-0.5 rounded-md mb-1.5">
                    Giường #{bedNumber}
                  </span>
                  <span className="text-xs text-slate-400 font-medium mb-2">
                    Chưa có người
                  </span>
                  <button
                    onClick={() => onAddWorkerToBed(bedNumber)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-blue-600 active:bg-blue-700 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 rounded-xl transition-colors cursor-pointer shadow-xs touch-manipulation min-h-[36px]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Thêm vào đây</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
          <div>
            {onOpenIdCardsPrint && count > 0 && (
              <button
                type="button"
                onClick={onOpenIdCardsPrint}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs min-h-[40px]"
              >
                <Printer className="w-4 h-4" />
                <span>In / Xuất ảnh CCCD 2 mặt ({count} người)</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer touch-manipulation min-h-[44px]"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
