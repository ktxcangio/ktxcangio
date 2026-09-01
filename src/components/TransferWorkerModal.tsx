import React, { useState, useEffect } from 'react';
import { 
  Worker, 
  Zone, 
  Room 
} from '../types';
import { 
  X, 
  ArrowRightLeft, 
  Building, 
  Bed, 
  AlertCircle, 
  CheckCircle2, 
  User 
} from 'lucide-react';

interface TransferWorkerModalProps {
  worker: Worker | null;
  zones: Zone[];
  rooms: Room[];
  allWorkers: Worker[];
  onClose: () => void;
  onConfirmTransfer: (workerId: string, targetRoomId: string, targetBedNumber: number, targetZoneId: string, targetBlockId: string) => void;
}

export const TransferWorkerModal: React.FC<TransferWorkerModalProps> = ({
  worker,
  zones = [],
  rooms = [],
  allWorkers = [],
  onClose,
  onConfirmTransfer,
}) => {
  if (!worker) return null;

  const safeWorkers = allWorkers || [];
  const safeRooms = rooms || [];
  const safeZones = zones || [];

  // Lấy vị trí hiện tại
  const currentRoom = safeRooms.find(r => r.id === worker.roomId);
  const currentZone = safeZones.find(z => z.id === worker.zoneId);
  const currentBlock = currentZone?.blocks?.find(b => b.id === worker.blockId);

  // State vị trí mới
  const [targetZoneId, setTargetZoneId] = useState(worker.zoneId);
  const [targetBlockId, setTargetBlockId] = useState(worker.blockId);
  const [targetRoomId, setTargetRoomId] = useState(worker.roomId);
  const [targetBedNumber, setTargetBedNumber] = useState<number>(worker.bedNumber);
  const [errorMsg, setErrorMsg] = useState('');

  const targetZone = safeZones.find(z => z.id === targetZoneId);
  const targetBlocks = targetZone?.blocks || [];

  useEffect(() => {
    if (targetBlocks.length > 0 && !targetBlocks.some(b => b.id === targetBlockId)) {
      setTargetBlockId(targetBlocks[0].id);
    }
  }, [targetZoneId, targetBlocks, targetBlockId]);

  const targetBlock = targetBlocks.find(b => b.id === targetBlockId);
  const targetRooms = targetBlock?.rooms || [];

  useEffect(() => {
    if (targetRooms.length > 0 && !targetRooms.some(r => r.id === targetRoomId)) {
      setTargetRoomId(targetRooms[0].id);
    }
  }, [targetBlockId, targetRooms, targetRoomId]);

  const selectedTargetRoom = targetRooms.find(r => r.id === targetRoomId);
  const maxCap = selectedTargetRoom?.maxCapacity || 20;

  // Kiểm tra sức chứa phòng đích
  const workersInTargetRoom = safeWorkers.filter(
    w => w.roomId === targetRoomId && w.id !== worker.id
  );
  const isTargetFull = workersInTargetRoom.length >= maxCap;
  const occupiedBeds = new Set(workersInTargetRoom.map(w => w.bedNumber));

  // Tự động chọn giường trống đầu tiên nếu giường đang chọn bị trùng
  useEffect(() => {
    if (occupiedBeds.has(targetBedNumber)) {
      for (let i = 1; i <= maxCap; i++) {
        if (!occupiedBeds.has(i)) {
          setTargetBedNumber(i);
          break;
        }
      }
    }
  }, [targetRoomId]);

  const handleTransfer = () => {
    setErrorMsg('');
    if (isTargetFull) {
      setErrorMsg(`Phòng đích đã đủ tối đa ${maxCap} người. Vui lòng chọn phòng khác.`);
      return;
    }
    if (occupiedBeds.has(targetBedNumber)) {
      setErrorMsg(`Giường #${targetBedNumber} đã có người ở. Vui lòng chọn giường trống khác.`);
      return;
    }

    onConfirmTransfer(worker.id, targetRoomId, targetBedNumber, targetZoneId, targetBlockId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 lg:p-6">
      <div 
        id="modal-transfer-worker"
        className="bg-white sm:rounded-3xl max-w-xl w-full shadow-2xl border-0 sm:border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full sm:h-auto"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">
                Chuyển Phòng / Đổi Giường
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Điều chuyển vị trí cư trú trong ký túc xá
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Current Worker Summary */}
          <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${worker.avatarColor || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden`}>
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
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm truncate">{worker.fullName}</span>
                <span className="text-xs font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 shrink-0 font-semibold">
                  {worker.code}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Hiện tại: <strong className="text-slate-800">{currentZone?.name} • {currentBlock?.name} • {currentRoom?.name} (Giường #{worker.bedNumber})</strong>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Target Location Selection */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn Vị Trí Phòng Mới:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khu mới
                </label>
                <select
                  value={targetZoneId}
                  onChange={(e) => setTargetZoneId(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer min-h-[42px]"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dãy mới
                </label>
                <select
                  value={targetBlockId}
                  onChange={(e) => setTargetBlockId(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer min-h-[42px]"
                >
                  {targetBlocks.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phòng mới
                </label>
                <select
                  value={targetRoomId}
                  onChange={(e) => setTargetRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer font-bold text-slate-800 min-h-[42px]"
                >
                  {targetRooms.map(r => {
                    const c = safeWorkers.filter(w => w.roomId === r.id && w.id !== worker.id).length;
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} ({c}/{r.maxCapacity || 20})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Target Bed selection */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn Giường tại phòng mới (1 - {selectedTargetRoom?.bedCount || 20}):
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-10 gap-1.5 sm:gap-1.5">
                {Array.from({ length: selectedTargetRoom?.bedCount || 20 }, (_, idx) => {
                  const bedNum = idx + 1;
                  const isOccupied = occupiedBeds.has(bedNum);
                  const isSelected = targetBedNumber === bedNum;

                  return (
                    <button
                      key={bedNum}
                      type="button"
                      disabled={isOccupied}
                      onClick={() => setTargetBedNumber(bedNum)}
                      className={`py-2.5 sm:py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer touch-manipulation min-h-[40px] flex items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : isOccupied
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 active:bg-blue-50'
                      }`}
                    >
                      #{bedNum}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl border border-slate-300 transition-colors cursor-pointer touch-manipulation min-h-[42px]"
          >
            Hủy
          </button>
          <button
            onClick={handleTransfer}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer touch-manipulation min-h-[42px]"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Xác nhận chuyển</span>
          </button>
        </div>
      </div>
    </div>
  );
};
