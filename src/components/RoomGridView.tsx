import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Bed, 
  Plus, 
  Eye,
  Sparkles,
  ChevronRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  ArrowLeft,
  Trash2,
  CreditCard,
  Printer,
  Box
} from 'lucide-react';
import { Zone, Block, Room, Worker } from '../types';
import { matchVietnameseSearch } from '../utils/vietnamese';
import { DeleteZoneModal } from './DeleteZoneModal';

interface RoomGridViewProps {
  zones: Zone[];
  rooms: Room[];
  workers: Worker[];
  searchQuery: string;
  selectedZoneId: string;
  selectedBlockId: string;
  onFilterBlock?: (blockId: string) => void;
  onSelectRoom: (room: Room) => void;
  onAddWorkerToRoom: (room: Room) => void;
  onSelectWorker: (worker: Worker) => void;
  onBackToOverview?: () => void;
  onSelectZone?: (zoneId: string) => void;
  onDeleteZone?: (zoneId: string, workerHandling: 'unassign' | 'delete') => Promise<void> | void;
  onOpenIdCardsPrint?: (room: Room) => void;
}

export const RoomGridView: React.FC<RoomGridViewProps> = ({
  zones = [],
  rooms = [],
  workers = [],
  searchQuery = '',
  selectedZoneId = 'all',
  selectedBlockId = 'all',
  onFilterBlock,
  onSelectRoom,
  onAddWorkerToRoom,
  onSelectWorker,
  onBackToOverview,
  onSelectZone,
  onDeleteZone,
  onOpenIdCardsPrint,
}) => {
  const [zonePendingDelete, setZonePendingDelete] = useState<Zone | null>(null);
  // Trạng thái chọn Dãy nội bộ trong từng Khu (mặc định 'all')
  const [activeBlockByZone, setActiveBlockByZone] = useState<Record<string, string>>({});

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
    <div className="space-y-4">
      {/* Sapo Breadcrumb & Zone Navigation Bar khi đang xem một Khu cụ thể */}
      {selectedZoneId !== 'all' && (
        <div className="bg-white rounded-lg p-3 sm:p-4 border border-[#E4E8EC] shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-[#E5F3FF] text-slate-700 hover:text-[#0088FF] font-semibold text-xs border border-slate-200 hover:border-[#0088FF]/30 transition-all cursor-pointer shrink-0 shadow-2xs"
                title="Quay lại Màn hình Sơ đồ số liệu tổng quát KTX"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>‹ Quay lại Sơ đồ tổng quát</span>
              </button>
            )}

            <div className="h-5 w-[1px] bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 text-xs hidden sm:inline">Khu hiện tại:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E5F3FF] text-[#0088FF] font-bold text-xs border border-[#BAE0FF]">
                <Building2 className="w-3.5 h-3.5" />
                <span>{zones.find(z => z.id === selectedZoneId)?.name || 'Khu KTX'}</span>
              </div>
              {selectedBlockId !== 'all' && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
                  <span>Dãy: {zones.find(z => z.id === selectedZoneId)?.blocks?.find(b => b.id === selectedBlockId)?.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Thanh chuyển nhanh giữa các Khu khác */}
          {zones.length > 1 && onSelectZone && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1 hidden lg:inline">
                Phím tắt Khu:
              </span>
              {zones.map((z, idx) => {
                const codeLetter = z.code?.toUpperCase() || z.name.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase() || String(idx + 1);
                const isCurrent = z.id === selectedZoneId;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => onSelectZone(z.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      isCurrent
                        ? 'bg-[#0088FF] text-white shadow-2xs ring-1 ring-[#0088FF]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title={`Chuyển đến ${z.name} (Phím tắt: ${codeLetter})`}
                  >
                    <kbd className={`px-1 py-0.2 rounded text-[10px] font-mono ${
                      isCurrent ? 'bg-white/20 text-white' : 'bg-white text-slate-600 border border-slate-300'
                    }`}>
                      {codeLetter}
                    </kbd>
                    <span>{z.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {filteredZones.map((zone) => {
        const allZoneBlocks = zone.blocks || [];
        const zoneRooms = (rooms || []).filter(r => r.zoneId === zone.id);
        const zoneWorkers = (workers || []).filter(w => w.zoneId === zone.id);
        const zoneMaxCapacity = zoneRooms.reduce((sum, r) => sum + (r.maxCapacity || 20), 0);

        // Lấy dãy được chọn
        const currentZoneBlockSelection = selectedBlockId !== 'all'
          ? selectedBlockId
          : (activeBlockByZone[zone.id] || 'all');

        // Lọc các dãy hiển thị
        const visibleBlocks = allZoneBlocks.filter((block) => {
          if (currentZoneBlockSelection !== 'all' && block.id !== currentZoneBlockSelection) {
            return false;
          }
          return true;
        });

        if (allZoneBlocks.length === 0) return null;

        return (
          <div 
            key={zone.id} 
            id={`zone-container-${zone.id}`}
            className="bg-white rounded-lg border border-[#E4E8EC] shadow-xs overflow-hidden"
          >
            {/* Sapo Zone Header */}
            <div className="bg-[#182538] text-white px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#0088FF] flex items-center justify-center font-bold text-white text-xs shadow-xs shrink-0">
                  {zone.code || zone.name.replace('Khu ', '')}
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    {zone.name}
                  </h2>
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    {zone.description || 'Ký túc xá công nhân'}
                  </p>
                </div>
              </div>

              {/* Thông tin nhanh số lượng & Nút Xóa Khu */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="bg-[#203046] text-slate-300 px-2.5 py-1 rounded border border-[#2B3F5B] font-medium">
                  {allZoneBlocks.length} Dãy • {zoneRooms.length} Phòng • <strong className="text-emerald-400 font-bold">{zoneWorkers.length}</strong>/{zoneMaxCapacity} người
                </span>

                {onDeleteZone && (
                  <button
                    type="button"
                    onClick={() => setZonePendingDelete(zone)}
                    className="p-1 px-2 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-colors cursor-pointer flex items-center gap-1 font-medium text-[11px]"
                    title={`Xóa ${zone.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xóa {zone.name}</span>
                  </button>
                )}
              </div>
            </div>

            {/* THANH TAB CHỌN DÃY TRONG KHU (Sapo Horizontal Tab Style) */}
            <div className="bg-[#FAFBFC] border-b border-[#E4E8EC] px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                Chọn Dãy:
              </span>

              {/* Tab Tất cả Dãy */}
              <button
                type="button"
                onClick={() => {
                  if (onFilterBlock && selectedBlockId !== 'all') {
                    onFilterBlock('all');
                  }
                  setActiveBlockByZone(prev => ({ ...prev, [zone.id]: 'all' }));
                }}
                className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  currentZoneBlockSelection === 'all'
                    ? 'bg-[#0088FF] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                Tất cả các dãy ({allZoneBlocks.length})
              </button>

              {/* Tabs từng Dãy */}
              {allZoneBlocks.map((block) => {
                const blockRooms = zoneRooms.filter(r => r.blockId === block.id);
                const blockWorkers = zoneWorkers.filter(w => w.blockId === block.id);
                const isSelected = currentZoneBlockSelection === block.id;

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => {
                      if (onFilterBlock && selectedBlockId !== 'all') {
                        onFilterBlock(block.id);
                      }
                      setActiveBlockByZone(prev => ({ ...prev, [zone.id]: block.id }));
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#0088FF] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                    }`}
                  >
                    <span>{block.name}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {blockWorkers.length} CN
                    </span>
                  </button>
                );
              })}
            </div>

            {/* DANH SÁCH PHÒNG THEO TỪNG DÃY */}
            <div className="p-3 sm:p-5 space-y-6">
              {visibleBlocks.map((block) => {
                const blockRooms = zoneRooms.filter((r) => r.blockId === block.id);
                const blockWorkers = zoneWorkers.filter((w) => w.blockId === block.id);

                if (blockRooms.length === 0) return null;

                return (
                  <div key={block.id} className="space-y-3">
                    {/* Dãy Title Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#0088FF]"></span>
                        <h3 className="font-bold text-slate-800 text-sm">
                          {block.name}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium">
                          ({blockRooms.length} phòng, tiêu chuẩn 20 người/phòng)
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-medium">
                        Tổng cư dân: <strong className="text-slate-900 font-bold">{blockWorkers.length}</strong> người
                      </div>
                    </div>

                    {/* Sapo Room Grid Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {blockRooms.map((room) => {
                        const roomWorkers = workersByRoom.get(room.id) || [];
                        const maxCap = room.maxCapacity || 20;
                        const occupiedCount = roomWorkers.length;
                        const remaining = Math.max(0, maxCap - occupiedCount);
                        const isFull = occupiedCount >= maxCap;
                        const isEmpty = occupiedCount === 0;
                        const occupancyPercent = Math.min(100, Math.round((occupiedCount / maxCap) * 100));

                        const roomBeds = room.bedCount || 20;
                        const roomLockers = room.lockerCount || 20;
                        const assignedLockers = roomWorkers.reduce((sum, w) => sum + (w.lockerNumber !== undefined ? w.lockerNumber : 1), 0);
                        const emptyBeds = Math.max(0, roomBeds - occupiedCount);
                        const emptyLockers = Math.max(0, roomLockers - assignedLockers);

                        return (
                          <div
                            key={room.id}
                            id={`room-card-${room.id}`}
                            className={`bg-white rounded-lg border transition-all duration-150 flex flex-col justify-between hover:shadow-md cursor-pointer group ${
                              isFull
                                ? 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                                : occupiedCount >= 18
                                ? 'border-amber-300 hover:border-amber-500 bg-amber-50/20'
                                : 'border-[#E4E8EC] hover:border-[#0088FF]'
                            }`}
                            onClick={() => onSelectRoom(room)}
                          >
                            {/* Card Top: Room Name & Status Tag (Sapo Style) */}
                            <div className="p-3 border-b border-[#E4E8EC] flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-slate-800 group-hover:text-[#0088FF] transition-colors">
                                  {room.name}
                                </span>
                              </div>

                              {/* Sapo Room Tag */}
                              {isFull ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                  Đầy 20/20
                                </span>
                              ) : isEmpty ? (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Trống (20 chỗ)
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EBF7EE] text-[#1E8E3E] border border-[#BDE8C6]">
                                  Còn {remaining} chỗ
                                </span>
                              )}
                            </div>

                            {/* Card Body: Progress Bar & Bed Occupancy Matrix */}
                            <div className="p-3 space-y-2.5">
                              {/* Capacity Ratio & Bar */}
                              <div>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-slate-500 font-medium">Sĩ số lưu trú:</span>
                                  <span className="font-bold text-slate-900">
                                    {occupiedCount} / {maxCap} người
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      isFull
                                        ? 'bg-slate-500'
                                        : occupancyPercent >= 80
                                        ? 'bg-amber-500'
                                        : 'bg-[#0088FF]'
                                    }`}
                                    style={{ width: `${occupancyPercent}%` }}
                                  />
                                </div>
                              </div>

                              {/* 20 Beds Preview Matrix (Dots) */}
                              <div className="grid grid-cols-10 gap-1 pt-1">
                                {Array.from({ length: 20 }).map((_, idx) => {
                                  const bedNumber = idx + 1;
                                  const workerInBed = roomWorkers.find(w => w.bedNumber === bedNumber);
                                  const isOccupied = !!workerInBed;

                                  return (
                                    <div
                                      key={bedNumber}
                                      title={workerInBed ? `G.${bedNumber}: ${workerInBed.fullName}` : `G.${bedNumber}: Trống`}
                                      className={`h-2.5 rounded-xs transition-colors ${
                                        isOccupied
                                          ? 'bg-[#0088FF]'
                                          : 'bg-slate-200'
                                      }`}
                                    />
                                  );
                                })}
                              </div>

                              {/* Thống kê nhanh Giường & Tủ đồ */}
                              <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[11px] bg-slate-50 p-1.5 rounded-md border border-slate-100">
                                <div className="flex items-center gap-1.5 min-w-0" title={`Tổng số giường: ${roomBeds}, đang ở: ${occupiedCount}, còn trống: ${emptyBeds}`}>
                                  <Bed className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span className="truncate">G: <strong>{occupiedCount}</strong>/{roomBeds}</span>
                                </div>
                                <div className="flex items-center gap-1.5 min-w-0" title={`Tổng số tủ đồ: ${roomLockers}, đã cấp: ${assignedLockers}, còn trống: ${emptyLockers}`}>
                                  <Box className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span className="truncate">Tủ: <strong>{assignedLockers}</strong>/{roomLockers}</span>
                                </div>
                              </div>

                              {/* Preview First 2 Workers */}
                              {roomWorkers.length > 0 && (
                                <div className="text-[11px] text-slate-500 truncate pt-1">
                                  <span className="font-semibold text-slate-700">Đang ở: </span>
                                  <span>{roomWorkers.slice(0, 2).map(w => w.fullName).join(', ')}</span>
                                  {roomWorkers.length > 2 && <span> +{roomWorkers.length - 2} người</span>}
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Sapo Action Buttons */}
                            <div className="p-2 border-t border-[#E4E8EC] bg-[#FAFBFC] flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRoom(room);
                                }}
                                className="flex-1 py-1 px-2 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-[#D3D5D7] transition-colors cursor-pointer text-center"
                              >
                                Xem phòng
                              </button>

                              {roomWorkers.length > 0 && onOpenIdCardsPrint && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenIdCardsPrint(room);
                                  }}
                                  title={`In / Xuất ảnh 2 mặt CCCD của ${roomWorkers.length} người trong ${room.name}`}
                                  className="py-1 px-2 rounded text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>CCCD</span>
                                </button>
                              )}

                              {!isFull && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onAddWorkerToRoom(room);
                                  }}
                                  className="py-1 px-2 rounded text-xs font-semibold text-white bg-[#0088FF] hover:bg-[#0070E0] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>+ Xếp</span>
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

      {/* Modal xác nhận xóa Khu */}
      {zonePendingDelete && (
        <DeleteZoneModal
          isOpen={!!zonePendingDelete}
          zone={zonePendingDelete}
          workers={workers}
          onClose={() => setZonePendingDelete(null)}
          onConfirmDelete={async (zoneId, workerHandling) => {
            if (onDeleteZone) {
              await onDeleteZone(zoneId, workerHandling);
            }
            setZonePendingDelete(null);
          }}
        />
      )}
    </div>
  );
};
