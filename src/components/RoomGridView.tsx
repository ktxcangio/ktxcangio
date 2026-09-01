import React from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Bed, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Sparkles
} from 'lucide-react';
import { Zone, Block, Room, Worker } from '../types';
import { matchVietnameseSearch } from '../utils/vietnamese';

interface RoomGridViewProps {
  zones: Zone[];
  rooms: Room[];
  workers: Worker[];
  searchQuery: string;
  selectedZoneId: string;
  selectedBlockId: string;
  onSelectRoom: (room: Room) => void;
  onAddWorkerToRoom: (room: Room) => void;
  onSelectWorker: (worker: Worker) => void;
}

export const RoomGridView: React.FC<RoomGridViewProps> = ({
  zones = [],
  rooms = [],
  workers = [],
  searchQuery = '',
  selectedZoneId = 'all',
  selectedBlockId = 'all',
  onSelectRoom,
  onAddWorkerToRoom,
  onSelectWorker,
}) => {
  // Nhóm workers theo roomId
  const workersByRoom = React.useMemo(() => {
    const map = new Map<string, Worker[]>();
    (workers || []).forEach((worker) => {
      if (!map.has(worker.roomId)) {
        map.set(worker.roomId, []);
      }
      map.get(worker.roomId)!.push(worker);
    });
    return map;
  }, [workers]);

  // Lọc zones theo bộ lọc
  const filteredZones = (zones || []).filter((zone) => {
    if (selectedZoneId !== 'all' && zone.id !== selectedZoneId) return false;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {filteredZones.map((zone) => {
        // Lọc blocks trong zone
        const blocks = (zone.blocks || []).filter((block) => {
          if (selectedBlockId !== 'all' && block.id !== selectedBlockId) return false;
          return true;
        });

        if (blocks.length === 0) return null;

        // Tính tổng phòng & sức chứa của Zone
        const zoneRooms = (rooms || []).filter(r => r.zoneId === zone.id);
        const zoneWorkers = (workers || []).filter(w => w.zoneId === zone.id);
        const zoneMaxCapacity = zoneRooms.reduce((sum, r) => sum + (r.maxCapacity || 20), 0);

        return (
          <div key={zone.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Zone Header */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow-md shrink-0">
                  {zone.code || zone.name.replace('Khu ', '')}
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    {zone.name}
                  </h2>
                  <p className="text-xs text-slate-400">{zone.description || 'Ký túc xá công nhân'}</p>
                </div>
              </div>

              {/* Zone Summary Badge */}
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 font-medium">
                  {blocks.length} Dãy • {zoneRooms.length} Phòng • {zoneWorkers.length}/{zoneMaxCapacity} người
                </span>
              </div>
            </div>

            {/* Blocks Section */}
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              {blocks.map((block) => {
                const blockRooms = (block.rooms && block.rooms.length > 0) ? block.rooms : (rooms || []).filter((r) => r.blockId === block.id);
                const blockWorkers = (workers || []).filter(w => w.blockId === block.id);
                const blockCap = blockRooms.reduce((sum, r) => sum + (r.maxCapacity || 20), 0);

                return (
                  <div
                    key={block.id}
                    className="bg-slate-50/80 rounded-2xl p-3 sm:p-4 border border-slate-200 space-y-3"
                  >
                    {/* Block Title Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2.5 gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          {block.name}
                        </h3>
                        <span className="text-[11px] text-slate-600 font-medium bg-slate-200/80 px-2.5 py-0.5 rounded-lg">
                          {blockRooms.length} Phòng (Mỗi phòng tối đa 20 người)
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-medium">
                        Đang ở: <strong className="text-blue-700 font-bold">{blockWorkers.length}</strong> / {blockCap} chỗ
                      </div>
                    </div>

                    {/* Rooms Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {blockRooms.map((room) => {
                        const roomWorkers = workersByRoom.get(room.id) || [];
                        const count = roomWorkers.length;
                        const maxCap = room.maxCapacity || 20;
                        const percentage = Math.round((count / maxCap) * 100);
                        const isFull = count >= maxCap;
                        const isEmpty = count === 0;

                        // Tìm kiếm không dấu
                        const matchingWorkers = searchQuery.trim()
                          ? roomWorkers.filter((w) =>
                              matchVietnameseSearch(w.fullName, searchQuery) ||
                              matchVietnameseSearch(w.code, searchQuery) ||
                              matchVietnameseSearch(w.citizenId, searchQuery) ||
                              matchVietnameseSearch(w.teamLeaderName, searchQuery) ||
                              matchVietnameseSearch(w.teamLeaderPhone, searchQuery) ||
                              matchVietnameseSearch(w.address, searchQuery)
                            )
                          : [];
                        const hasSearchMatch = searchQuery.trim() && matchingWorkers.length > 0;

                        // Màu sắc trạng thái
                        let statusBadge = {
                          text: `Còn ${maxCap - count} chỗ`,
                          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          barClass: 'bg-emerald-500',
                        };

                        if (isFull) {
                          statusBadge = {
                            text: 'Đã đầy (20/20)',
                            colorClass: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
                            barClass: 'bg-rose-500',
                          };
                        } else if (count >= 16) {
                          statusBadge = {
                            text: `Sắp đầy (còn ${maxCap - count})`,
                            colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
                            barClass: 'bg-amber-500',
                          };
                        } else if (isEmpty) {
                          statusBadge = {
                            text: 'Trống (0/20)',
                            colorClass: 'bg-slate-100 text-slate-600 border-slate-200',
                            barClass: 'bg-slate-300',
                          };
                        }

                        return (
                          <div
                            key={room.id}
                            id={`room-card-${room.id}`}
                            className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                              hasSearchMatch
                                ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/30'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Card Header */}
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <Bed className="w-4 h-4 text-blue-600" />
                                  <span className="font-bold text-slate-800 text-sm">
                                    {room.name}
                                  </span>
                                </div>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusBadge.colorClass}`}>
                                  {count}/{maxCap}
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-100 rounded-full h-1.5 my-2 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${statusBadge.barClass}`}
                                  style={{ width: `${Math.min(100, percentage)}%` }}
                                ></div>
                              </div>

                              {/* Search match highlight if any */}
                              {hasSearchMatch && (
                                <div className="mb-2 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
                                  <span className="font-semibold">
                                    {matchingWorkers.length} khớp:
                                  </span>
                                  <span className="truncate max-w-[120px] font-medium">
                                    {matchingWorkers.map(w => w.fullName).join(', ')}
                                  </span>
                                </div>
                              )}

                              {/* Occupant Avatars Preview */}
                              <div className="my-2">
                                <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
                                  <span>Đang ở:</span>
                                  <span className="font-semibold text-slate-700">{count} người</span>
                                </div>

                                {count === 0 ? (
                                  <div className="py-2 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    Chưa có người ở
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1 items-center max-h-[56px] overflow-hidden">
                                    {roomWorkers.slice(0, 10).map((worker) => {
                                      const isMatched = searchQuery.trim() && (
                                        matchVietnameseSearch(worker.fullName, searchQuery) ||
                                        matchVietnameseSearch(worker.code, searchQuery) ||
                                        matchVietnameseSearch(worker.citizenId, searchQuery)
                                      );

                                      return (
                                        <button
                                          key={worker.id}
                                          onClick={() => onSelectWorker(worker)}
                                          title={`Giường #${worker.bedNumber}: ${worker.fullName} (${worker.code}) - CCCD: ${worker.citizenId}`}
                                          className={`w-7 h-7 rounded-full text-[11px] font-bold text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer touch-manipulation shadow-xs overflow-hidden ${
                                            worker.avatarColor || 'bg-blue-500'
                                          } ${isMatched ? 'ring-2 ring-yellow-400 scale-105' : ''}`}
                                        >
                                          {worker.photoUrl ? (
                                            <img
                                              src={worker.photoUrl}
                                              alt={worker.fullName}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            worker.fullName.charAt(0)
                                          )}
                                        </button>
                                      );
                                    })}

                                    {count > 10 && (
                                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded-full">
                                        +{count - 10}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 mt-1">
                              <button
                                id={`btn-view-room-${room.id}`}
                                onClick={() => onSelectRoom(room)}
                                className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer touch-manipulation min-h-[38px]"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chi tiết ({count})</span>
                              </button>

                              {!isFull && (
                                <button
                                  id={`btn-add-worker-to-room-${room.id}`}
                                  onClick={() => onAddWorkerToRoom(room)}
                                  title="Thêm nhân viên vào phòng này"
                                  className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-colors cursor-pointer border border-blue-200 hover:border-blue-600 touch-manipulation min-h-[38px] min-w-[38px] flex items-center justify-center"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
