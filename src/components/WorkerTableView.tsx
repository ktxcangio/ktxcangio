import React from 'react';
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
  Shield
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
  const safeWorkers = workers || [];
  const safeRooms = rooms || [];
  const safeZones = zones || [];

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

  if (safeWorkers.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 text-slate-400">
          <User className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
          Không tìm thấy nhân viên nào
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-4">
          {searchQuery 
            ? `Không có kết quả nào khớp với từ khóa "${searchQuery}". Hãy thử tìm không dấu (vd: nguyen van an, thao, 1001, cccd) hoặc xóa bớt bộ lọc.`
            : 'Chưa có nhân viên nào trong danh sách hoặc các phòng thuộc bộ lọc đang trống.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Mobile Card View (< md screens) */}
      <div className="md:hidden space-y-3">
        <div className="text-xs font-semibold text-slate-500 px-1 flex items-center justify-between">
          <span>Danh sách <strong>{workers.length}</strong> nhân viên</span>
          <span>Chạm vào thẻ để xem chi tiết</span>
        </div>

        {workers.map((worker) => {
          const hierarchy = getRoomHierarchy(worker.roomId);

          return (
            <div
              key={worker.id}
              id={`worker-card-mobile-${worker.id}`}
              className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs hover:border-blue-300 transition-all space-y-3"
            >
              {/* Card Header: Avatar, Name, Code, Bed */}
              <div className="flex items-start justify-between gap-3">
                <div 
                  onClick={() => onSelectWorker(worker)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className={`w-11 h-11 rounded-2xl ${worker.avatarColor || 'bg-blue-600'} text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs overflow-hidden`}>
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
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {worker.fullName}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        worker.gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {worker.gender}
                      </span>
                    </div>
                    <div className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                      {worker.code} • <span className="font-sans font-normal text-slate-500">CCCD: {worker.citizenId}</span>
                    </div>
                  </div>
                </div>

                {/* Bed Pill */}
                <div className="shrink-0 text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                    G.{worker.bedNumber} / T.{worker.lockerNumber || worker.bedNumber}
                  </span>
                </div>
              </div>

              {/* Location & Team Leader Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                <button
                  onClick={() => onSelectRoomById(worker.roomId)}
                  className="text-left group cursor-pointer"
                >
                  <span className="text-[10px] text-slate-400 block font-medium">Vị trí phòng:</span>
                  <span className="font-bold text-slate-800 group-hover:text-blue-600 flex items-center gap-1">
                    <Bed className="w-3 h-3 text-blue-600 shrink-0" />
                    {hierarchy.roomName}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {hierarchy.zoneName} &gt; {hierarchy.blockName}
                  </span>
                </button>

                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Tổ trưởng:</span>
                  <span className="font-semibold text-slate-800 block truncate">
                    {worker.teamLeaderName || 'Chưa gán'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    SĐT: {worker.teamLeaderPhone || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Address */}
              {worker.address && (
                <div className="text-xs text-slate-600 flex items-center gap-1 truncate px-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{worker.address}</span>
                </div>
              )}

              {/* Actions Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                {/* Team leader phone */}
                {worker.teamLeaderPhone ? (
                  <a
                    href={`tel:${worker.teamLeaderPhone}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 active:bg-emerald-100 transition-colors touch-manipulation min-h-[36px]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Gọi Tổ trưởng</span>
                  </a>
                ) : (
                  <span className="text-slate-400 text-xs">Không có SĐT</span>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onTransferWorker(worker)}
                    title="Đổi phòng"
                    className="p-2 text-slate-600 hover:text-amber-600 active:bg-amber-50 rounded-xl transition-colors cursor-pointer touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center border border-slate-200"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onEditWorker(worker)}
                    title="Chỉnh sửa"
                    className="p-2 text-slate-600 hover:text-blue-600 active:bg-blue-50 rounded-xl transition-colors cursor-pointer touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center border border-slate-200"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectWorker(worker)}
                    title="Xem hồ sơ"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1 touch-manipulation min-h-[36px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Responsive Table (>= md screens) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="text-sm text-slate-600 font-medium">
            Danh sách <strong className="text-slate-900 font-bold">{workers.length}</strong> nhân viên KTX
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">1. Mã NV</th>
                <th className="py-3.5 px-4">2. Họ và Tên</th>
                <th className="py-3.5 px-4">3. Giới tính</th>
                <th className="py-3.5 px-4">4. Ngày sinh</th>
                <th className="py-3.5 px-4">5. Thôn/Xã/Tỉnh</th>
                <th className="py-3.5 px-4">6. Số CCCD</th>
                <th className="py-3.5 px-4">7. Tổ trưởng</th>
                <th className="py-3.5 px-4">8. SĐT Tổ trưởng</th>
                <th className="py-3.5 px-4">Vị trí (Khu &gt; Dãy &gt; Phòng)</th>
                <th className="py-3.5 px-4 text-center">G / Tủ</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70">
              {workers.map((worker) => {
                const hierarchy = getRoomHierarchy(worker.roomId);

                return (
                  <tr 
                    key={worker.id}
                    id={`worker-row-${worker.id}`}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    {/* 1. Mã NV */}
                    <td className="py-3 px-4 font-mono font-bold text-xs text-blue-700 whitespace-nowrap">
                      {worker.code}
                    </td>

                    {/* 2. Họ Tên */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
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
                        <button
                          onClick={() => onSelectWorker(worker)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left text-sm cursor-pointer block truncate"
                        >
                          {worker.fullName}
                        </button>
                      </div>
                    </td>

                    {/* 3. Giới tính */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        worker.gender === 'Nam' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {worker.gender}
                      </span>
                    </td>

                    {/* 4. Ngày sinh */}
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {formatDate(worker.birthDate) || '-'}
                    </td>

                    {/* 5. Địa chỉ */}
                    <td className="py-3 px-4 text-xs text-slate-700 max-w-[180px] truncate" title={worker.address}>
                      {worker.address || '-'}
                    </td>

                    {/* 6. Số CCCD */}
                    <td className="py-3 px-4 font-mono font-semibold text-xs text-emerald-700 whitespace-nowrap">
                      {worker.citizenId}
                    </td>

                    {/* 7. Tên tổ trưởng */}
                    <td className="py-3 px-4 text-xs text-slate-800 font-medium whitespace-nowrap">
                      {worker.teamLeaderName || '-'}
                    </td>

                    {/* 8. SĐT tổ trưởng */}
                    <td className="py-3 px-4 text-xs whitespace-nowrap">
                      {worker.teamLeaderPhone ? (
                        <a href={`tel:${worker.teamLeaderPhone}`} className="text-emerald-700 font-semibold hover:underline">
                          {formatPhoneNumber(worker.teamLeaderPhone)}
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Vị trí Phòng */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectRoomById(worker.roomId)}
                        className="text-left group cursor-pointer"
                        title="Bấm để xem toàn bộ phòng này"
                      >
                        <div className="font-bold text-slate-800 group-hover:text-blue-600 flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5 text-blue-600" />
                          {hierarchy.roomName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {hierarchy.zoneName} &gt; {hierarchy.blockName}
                        </div>
                      </button>
                    </td>

                    {/* Số giường / Tủ */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-slate-100 font-bold text-slate-800 text-xs border border-slate-200">
                        G#{worker.bedNumber} | T#{worker.lockerNumber || worker.bedNumber}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          id={`btn-view-worker-${worker.id}`}
                          onClick={() => onSelectWorker(worker)}
                          title="Xem chi tiết"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-transfer-worker-${worker.id}`}
                          onClick={() => onTransferWorker(worker)}
                          title="Đổi phòng / Đổi giường"
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-edit-worker-${worker.id}`}
                          onClick={() => onEditWorker(worker)}
                          title="Chỉnh sửa thông tin"
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          id={`btn-delete-worker-${worker.id}`}
                          onClick={() => onDeleteWorker(worker)}
                          title="Trả phòng / Xóa nhân viên"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
