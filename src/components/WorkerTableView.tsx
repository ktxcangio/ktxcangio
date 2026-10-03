import React, { useState, useMemo } from 'react';
import { 
  Worker, 
  Zone, 
  Room 
} from '../types';
import { 
  formatDate, 
  formatPhoneNumber 
} from '../utils/vietnamese';
import { 
  User, 
  Phone, 
  MapPin, 
  Building2, 
  Bed, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  Eye, 
  Briefcase,
  Shield,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle
} from 'lucide-react';

interface WorkerTableViewProps {
  workers: Worker[];
  zones: Zone[];
  rooms: Room[];
  searchQuery: string;
  onSelectWorker: (worker: Worker) => void;
  onEditWorker: (worker: Worker) => void;
  onTransferWorker: (worker: Worker) => void;
  onDeleteWorker: (worker: Worker) => void;
  onSelectRoomById: (roomId: string) => void;
}

export const WorkerTableView: React.FC<WorkerTableViewProps> = ({
  workers = [],
  zones = [],
  rooms = [],
  searchQuery = '',
  onSelectWorker,
  onEditWorker,
  onTransferWorker,
  onDeleteWorker,
  onSelectRoomById,
}) => {
  const [workerPendingDelete, setWorkerPendingDelete] = useState<Worker | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const safeWorkers = workers || [];
  const safeRooms = rooms || [];
  const safeZones = zones || [];

  // Quản lý chọn nhiều checkbox (Sapo Bulk Actions)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Phân trang chuẩn Sapo
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Helper tra cứu tên Phòng, Dãy, Khu
  const getRoomHierarchy = (roomId: string) => {
    const room = safeRooms.find(r => r.id === roomId);
    if (!room) return { roomName: 'Chưa xếp', blockName: '', zoneName: '' };
    
    const zone = safeZones.find(z => z.id === room.zoneId);
    const block = zone?.blocks?.find(b => b.id === room.blockId);

    return {
      roomName: room.name,
      blockName: block?.name || '',
      zoneName: zone?.name || '',
    };
  };

  // Toggle chọn một nhân viên
  const handleToggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle chọn tất cả trang hiện tại
  const handleToggleSelectAll = (currentPageWorkers: Worker[]) => {
    const currentIds = currentPageWorkers.map(w => w.id);
    const isAllSelected = currentIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(safeWorkers.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedWorkers = safeWorkers.slice(startIndex, startIndex + pageSize);

  const isAllCurrentSelected = 
    paginatedWorkers.length > 0 && 
    paginatedWorkers.every(w => selectedIds.includes(w.id));

  if (safeWorkers.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E4E8EC] p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
          <User className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">
          Không tìm thấy công nhân nào
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          {searchQuery 
            ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Hãy thử tìm không dấu hoặc xóa bớt bộ lọc.`
            : 'Chưa có nhân viên nào trong danh sách hoặc các phòng thuộc bộ lọc đang trống.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sapo Batch Action Toolbar (khi có chọn ít nhất 1 dòng) */}
      {selectedIds.length > 0 && (
        <div className="bg-[#E5F3FF] border border-[#BAE0FF] rounded-lg p-2.5 px-4 flex items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0088FF]">Đã chọn {selectedIds.length} công nhân</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const targetWorker = safeWorkers.find(w => w.id === selectedIds[0]);
                if (targetWorker) onTransferWorker(targetWorker);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold rounded-md flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#0088FF]" />
              <span>Đổi phòng</span>
            </button>

            <button
              onClick={() => setIsBulkDeleting(true)}
              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Sapo Enterprise Table Container */}
      <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-xs overflow-hidden">
        {/* Table Top Summary Bar */}
        <div className="p-3 border-b border-[#E4E8EC] bg-[#FAFBFC] flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 font-medium">
            <span>Danh sách <strong className="text-slate-900 font-bold">{safeWorkers.length}</strong> công nhân KTX</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#D3D5D7] rounded px-2 py-0.5 text-xs text-slate-700 font-medium cursor-pointer outline-hidden"
              >
                <option value={15}>15 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
                <option value={100}>100 / trang</option>
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#FAFBFC] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E4E8EC]">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllCurrentSelected}
                    onChange={() => handleToggleSelectAll(paginatedWorkers)}
                    className="w-4 h-4 rounded text-[#0088FF] focus:ring-[#0088FF] border-slate-300 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Mã NV</th>
                <th className="py-3 px-4">Họ và Tên</th>
                <th className="py-3 px-3">Giới tính</th>
                <th className="py-3 px-3">Ngày sinh</th>
                <th className="py-3 px-4">Địa chỉ quê quán</th>
                <th className="py-3 px-3">Số CCCD</th>
                <th className="py-3 px-3">Tổ trưởng & SĐT</th>
                <th className="py-3 px-4">Vị trí (Khu › Dãy › Phòng)</th>
                <th className="py-3 px-3 text-center">G / Số tủ</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8EC]">
              {paginatedWorkers.map((worker) => {
                const hierarchy = getRoomHierarchy(worker.roomId);
                const isSelected = selectedIds.includes(worker.id);

                return (
                  <tr 
                    key={worker.id}
                    id={`worker-row-${worker.id}`}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#F0F7FF]' : 'hover:bg-[#F9FAFB]'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(worker.id)}
                        className="w-4 h-4 rounded text-[#0088FF] focus:ring-[#0088FF] border-slate-300 cursor-pointer"
                      />
                    </td>

                    {/* 1. Mã NV (Sapo Blue Link) */}
                    <td className="py-2.5 px-3 font-mono font-bold text-xs text-[#0088FF] whitespace-nowrap">
                      {worker.code}
                    </td>

                    {/* 2. Họ Tên */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-md ${worker.avatarColor || 'bg-[#0088FF]'} text-white font-bold flex items-center justify-center text-[11px] shrink-0 overflow-hidden shadow-2xs`}>
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
                        <button
                          onClick={() => onSelectWorker(worker)}
                          className="font-bold text-slate-800 hover:text-[#0088FF] hover:underline transition-colors text-left text-xs cursor-pointer block truncate"
                        >
                          {worker.fullName}
                        </button>
                      </div>
                    </td>

                    {/* 3. Giới tính (Sapo Pastel Tag) */}
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        worker.gender === 'Nam' 
                          ? 'bg-[#E5F3FF] text-[#0088FF] border-[#BAE0FF]' 
                          : 'bg-[#FDF2F8] text-[#DB2777] border-[#FBCFE8]'
                      }`}>
                        {worker.gender}
                      </span>
                    </td>

                    {/* 4. Ngày sinh */}
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {formatDate(worker.birthDate) || '-'}
                    </td>

                    {/* 5. Địa chỉ */}
                    <td className="py-2.5 px-4 text-slate-700 max-w-[170px] truncate" title={worker.address}>
                      {worker.address || '-'}
                    </td>

                    {/* 6. Số CCCD */}
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {worker.citizenId}
                      </span>
                    </td>

                    {/* 7 & 8. Tổ trưởng & SĐT */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{worker.teamLeaderName || '-'}</div>
                      {worker.teamLeaderPhone && (
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatPhoneNumber(worker.teamLeaderPhone)}
                        </div>
                      )}
                    </td>

                    {/* Vị trí KTX */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectRoomById(worker.roomId)}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-[#0088FF] hover:underline font-semibold cursor-pointer"
                      >
                        <span className="text-slate-400">{hierarchy.zoneName} › {hierarchy.blockName} ›</span>
                        <span className="text-[#0088FF]">{hierarchy.roomName}</span>
                      </button>
                    </td>

                    {/* Giường / Tủ */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="bg-[#EBF7EE] text-[#1E8E3E] border border-[#BDE8C6] px-1.5 py-0.5 rounded font-bold">
                        G.{worker.bedNumber}
                      </span>
                      {worker.lockerNumber !== undefined && (
                        <span className="ml-1 text-slate-500 text-[10px] font-medium">
                          ({worker.lockerNumber} tủ)
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectWorker(worker)}
                          title="Xem chi tiết hồ sơ"
                          className="p-1.5 text-slate-500 hover:text-[#0088FF] hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onTransferWorker(worker)}
                          title="Đổi phòng cho công nhân"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onEditWorker(worker)}
                          title="Chỉnh sửa thông tin"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setWorkerPendingDelete(worker)}
                          title="Xóa công nhân"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Sapo Pagination Footer */}
        <div className="p-3 border-t border-[#E4E8EC] bg-[#FAFBFC] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
          <div>
            Hiển thị <strong className="text-slate-900">{startIndex + 1}</strong> - <strong className="text-slate-900">{Math.min(startIndex + pageSize, safeWorkers.length)}</strong> trong tổng số <strong className="text-slate-900">{safeWorkers.length}</strong> công nhân
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded border border-[#D3D5D7] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 py-1 font-semibold text-slate-800">
              Trang {validCurrentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded border border-[#D3D5D7] bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* In-app modal: Xóa 1 công nhân */}
      {workerPendingDelete && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Xóa hồ sơ công nhân</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn trả phòng và xóa hồ sơ công nhân <strong>{workerPendingDelete.fullName}</strong> ({workerPendingDelete.code}) khỏi ký túc xá?
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setWorkerPendingDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteWorker(workerPendingDelete);
                  setWorkerPendingDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app modal: Xóa hàng loạt công nhân */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Xóa hàng loạt công nhân</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong>{selectedIds.length} công nhân đã chọn</strong> khỏi hệ thống? Dữ liệu phòng và giường sẽ được giải phóng ngay lập tức.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsBulkDeleting(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  selectedIds.forEach(id => {
                    const w = safeWorkers.find(item => item.id === id);
                    if (w) onDeleteWorker(w);
                  });
                  setSelectedIds([]);
                  setIsBulkDeleting(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Xác nhận xóa {selectedIds.length} người
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
