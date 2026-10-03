import React, { useState } from 'react';
import { 
  Trash2, 
  X, 
  AlertTriangle, 
  Users, 
  Building2, 
  DoorClosed, 
  Check, 
  ShieldAlert 
} from 'lucide-react';
import { Zone, Worker } from '../types';

interface DeleteZoneModalProps {
  isOpen: boolean;
  zone: Zone | null;
  workers: Worker[];
  onClose: () => void;
  onConfirmDelete: (zoneId: string, workerHandling: 'unassign' | 'delete') => Promise<void> | void;
}

export const DeleteZoneModal: React.FC<DeleteZoneModalProps> = ({
  isOpen,
  zone,
  workers = [],
  onClose,
  onConfirmDelete,
}) => {
  const [workerHandling, setWorkerHandling] = useState<'unassign' | 'delete'>('unassign');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !zone) return null;

  // Công nhân trong khu này
  const zoneWorkers = workers.filter(w => w.zoneId === zone.id);
  const totalRooms = (zone.blocks || []).reduce((acc, b) => acc + (b.rooms?.length || 15), 0);
  const totalBlocks = (zone.blocks || []).length;

  const handleExecuteDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete(zone.id, workerHandling);
      onClose();
    } catch (err) {
      console.error('Lỗi khi xóa Khu:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header cảnh báo màu đỏ */}
        <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Xác Nhận Xóa Phân Khu KTX</h3>
              <p className="text-xs text-rose-100">Hành động này sẽ xóa dữ liệu dãy và phòng thuộc khu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thân Modal */}
        <div className="p-5 space-y-4 text-slate-800 text-xs sm:text-sm">
          {/* Thông tin Khu sắp xóa */}
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-sm shrink-0">
              {zone.code || zone.name.replace('Khu ', '')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-black text-base text-slate-900">{zone.name}</div>
              <div className="text-xs text-slate-600 mt-0.5">{zone.description || 'Khu ký túc xá'}</div>
              <div className="flex items-center gap-3 text-xs text-slate-700 mt-2 font-medium">
                <span>{totalBlocks} Dãy</span>
                <span>•</span>
                <span>{totalRooms} Phòng</span>
                <span>•</span>
                <span className={zoneWorkers.length > 0 ? 'text-rose-700 font-bold' : 'text-slate-500'}>
                  {zoneWorkers.length} Công nhân đang ở
                </span>
              </div>
            </div>
          </div>

          {/* Lựa chọn xử lý công nhân nếu Khu có người đang ở */}
          {zoneWorkers.length > 0 ? (
            <div className="space-y-2.5">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-600" />
                <span>Khu này có {zoneWorkers.length} công nhân. Bạn muốn xử lý như thế nào?</span>
              </div>

              {/* Lựa chọn 1: Giữ hồ sơ, trả phòng (khuyên dùng) */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  workerHandling === 'unassign'
                    ? 'bg-blue-50/70 border-[#0088FF] ring-2 ring-blue-100'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="workerHandling"
                  value="unassign"
                  checked={workerHandling === 'unassign'}
                  onChange={() => setWorkerHandling('unassign')}
                  className="mt-1 text-[#0088FF] focus:ring-[#0088FF]"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Chuyển sang "Chưa xếp phòng" (Khuyên dùng)</span>
                    <span className="px-1.5 py-0.2 rounded bg-blue-100 text-[#0088FF] text-[10px] font-bold">An toàn</span>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Giữ lại toàn bộ thông tin cá nhân ({zoneWorkers.length} người), chỉ giải phóng phòng/giường để bạn xếp sang Khu khác bất cứ lúc nào.
                  </p>
                </div>
              </label>

              {/* Lựa chọn 2: Xóa cả hồ sơ công nhân */}
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  workerHandling === 'delete'
                    ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-100'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="workerHandling"
                  value="delete"
                  checked={workerHandling === 'delete'}
                  onChange={() => setWorkerHandling('delete')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-rose-800">
                    Xóa vĩnh viễn cả hồ sơ {zoneWorkers.length} công nhân này
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">
                    Xóa hoàn toàn danh sách {zoneWorkers.length} nhân sự này khỏi hệ thống KTX và cơ sở dữ liệu Cloud.
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <p className="text-xs text-slate-600 leading-relaxed">
              Khu này hiện chưa có công nhân nào cư trú. Toàn bộ các dãy và phòng của <strong>{zone.name}</strong> sẽ được xóa an toàn khỏi hệ thống.
            </p>
          )}

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Thao tác xóa sẽ có hiệu lực ngay lập tức và đồng bộ lên Cloud.</span>
          </div>
        </div>

        {/* Footer nút hành động */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleExecuteDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Đang xóa...' : `Xác nhận xóa ${zone.name}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
