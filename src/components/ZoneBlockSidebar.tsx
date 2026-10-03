import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  ChevronRight, 
  ChevronDown, 
  DoorClosed, 
  Plus, 
  Search, 
  X, 
  Users, 
  Bed, 
  Check, 
  RotateCcw,
  Sparkles,
  FolderTree,
  Folder,
  FolderOpen,
  BarChart3
} from 'lucide-react';
import { Zone, Block, Room, Worker } from '../types';
import { matchVietnameseSearch } from '../utils/vietnamese';

interface ZoneBlockSidebarProps {
  zones: Zone[];
  rooms: Room[];
  workers: Worker[];
  selectedZoneId: string;
  selectedBlockId: string;
  onSelectZoneBlock: (zoneId: string, blockId: string) => void;
  onOpenStructureManager?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  hideOnDesktop?: boolean;
  onCloseDesktop?: () => void;
}

export const ZoneBlockSidebar: React.FC<ZoneBlockSidebarProps> = ({
  zones = [],
  rooms = [],
  workers = [],
  selectedZoneId = 'all',
  selectedBlockId = 'all',
  onSelectZoneBlock,
  onOpenStructureManager,
  isMobileOpen = false,
  onCloseMobile,
  hideOnDesktop = false,
  onCloseDesktop,
}) => {
  const [searchCategory, setSearchCategory] = useState('');
  
  // State quản lý việc mở/đóng danh sách dãy của từng khu (mặc định mở tất cả)
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    zones.forEach(z => { initial[z.id] = true; });
    return initial;
  });

  // Khi danh sách zones thay đổi (thêm mới), tự động mở rộng khu mới
  useEffect(() => {
    setExpandedZones(prev => {
      const next = { ...prev };
      zones.forEach(z => {
        if (next[z.id] === undefined) {
          next[z.id] = true;
        }
      });
      return next;
    });
  }, [zones]);

  // Nếu đang chọn một Zone cụ thể, đảm bảo Zone đó được mở rộng
  useEffect(() => {
    if (selectedZoneId !== 'all') {
      setExpandedZones(prev => ({
        ...prev,
        [selectedZoneId]: true
      }));
    }
  }, [selectedZoneId]);

  const toggleZoneExpand = (zoneId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedZones(prev => ({
      ...prev,
      [zoneId]: !prev[zoneId]
    }));
  };

  // Tính số lượng công nhân và phòng cho từng Khu & Dãy
  const statsMap = useMemo(() => {
    const zoneWorkerCount: Record<string, number> = {};
    const zoneRoomCount: Record<string, number> = {};
    const blockWorkerCount: Record<string, number> = {};
    const blockRoomCount: Record<string, number> = {};

    rooms.forEach(r => {
      zoneRoomCount[r.zoneId] = (zoneRoomCount[r.zoneId] || 0) + 1;
      blockRoomCount[r.blockId] = (blockRoomCount[r.blockId] || 0) + 1;
    });

    workers.forEach(w => {
      zoneWorkerCount[w.zoneId] = (zoneWorkerCount[w.zoneId] || 0) + 1;
      blockWorkerCount[w.blockId] = (blockWorkerCount[w.blockId] || 0) + 1;
    });

    return {
      zoneWorkerCount,
      zoneRoomCount,
      blockWorkerCount,
      blockRoomCount
    };
  }, [rooms, workers]);

  // Tổng số dãy
  const totalBlocksCount = useMemo(() => {
    return zones.reduce((sum, z) => sum + (z.blocks?.length || 0), 0);
  }, [zones]);

  // Lọc danh mục khi người dùng gõ tìm nhanh
  const filteredZones = useMemo(() => {
    if (!searchCategory.trim()) return zones;
    const query = searchCategory.trim();

    return zones.map(zone => {
      const zoneMatches = matchVietnameseSearch(zone.name, query) || matchVietnameseSearch(zone.code || '', query);
      const matchingBlocks = (zone.blocks || []).filter(block => 
        matchVietnameseSearch(block.name, query)
      );

      if (zoneMatches) return zone;
      if (matchingBlocks.length > 0) {
        return {
          ...zone,
          blocks: matchingBlocks
        };
      }
      return null;
    }).filter(Boolean) as Zone[];
  }, [zones, searchCategory]);

  const handleSelectAll = () => {
    onSelectZoneBlock('all', 'all');
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectZone = (zoneId: string) => {
    onSelectZoneBlock(zoneId, 'all');
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectBlock = (zoneId: string, blockId: string) => {
    onSelectZoneBlock(zoneId, blockId);
    if (onCloseMobile) onCloseMobile();
  };

  const isAllSelected = selectedZoneId === 'all' && selectedBlockId === 'all';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Sapo Category Panel Header */}
      <div className="p-3.5 border-b border-[#E4E8EC] bg-[#FAFBFC]">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#E5F3FF] flex items-center justify-center text-[#0088FF]">
              <FolderTree className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Danh mục Khu - Dãy
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Structure Manager Button */}
            {onOpenStructureManager && (
              <button
                onClick={onOpenStructureManager}
                title="Quản lý & Thêm Khu, Dãy, Phòng"
                className="text-xs font-semibold text-[#0088FF] hover:text-[#0070E0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thiết lập</span>
              </button>
            )}

            {/* Desktop close button */}
            {onCloseDesktop && (
              <button
                type="button"
                onClick={onCloseDesktop}
                title="Ẩn danh mục"
                className="hidden lg:flex p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tìm kiếm nhanh danh mục (Sapo Search Input) */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            placeholder="Lọc tên Khu hoặc Dãy..."
            className="w-full pl-8 pr-7 py-1.5 bg-white text-xs border border-[#D3D5D7] rounded-md focus:border-[#0088FF] focus:ring-1 focus:ring-[#0088FF] text-slate-800 placeholder-slate-400 transition-all outline-hidden"
          />
          {searchCategory && (
            <button
              onClick={() => setSearchCategory('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sapo Category Tree Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs">
        {/* Mục 1: Tất cả Khu - Dãy (Sapo All Item) */}
        <button
          onClick={handleSelectAll}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-all text-left cursor-pointer group ${
            isAllSelected
              ? 'bg-[#E5F3FF] text-[#0088FF] font-bold border-l-4 border-[#0088FF] shadow-2xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BarChart3 className={`w-4 h-4 shrink-0 ${isAllSelected ? 'text-[#0088FF]' : 'text-slate-400 group-hover:text-slate-600'}`} />
            <span className="truncate font-semibold">Sơ đồ tổng quát (Tất cả khu)</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
              isAllSelected ? 'bg-[#0088FF] text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {rooms.length} phòng
            </span>
            <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
              isAllSelected ? 'bg-blue-100 text-[#0088FF]' : 'bg-slate-100 text-slate-600'
            }`}>
              {workers.length} CN
            </span>
          </div>
        </button>

        {/* Phân cách danh mục */}
        <div className="pt-2 pb-1 px-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          <span>Phân cấp KTX ({zones.length} Khu)</span>
          <span className="text-[10px] font-normal lowercase">{totalBlocksCount} dãy</span>
        </div>

        {/* Danh sách các Khu & Dãy */}
        {filteredZones.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
            Không tìm thấy Khu/Dãy nào khớp với "{searchCategory}"
          </div>
        ) : (
          filteredZones.map(zone => {
            const isZoneSelected = selectedZoneId === zone.id && selectedBlockId === 'all';
            const isExpanded = expandedZones[zone.id] ?? true;
            const zoneWorkers = statsMap.zoneWorkerCount[zone.id] || 0;
            const zoneRooms = statsMap.zoneRoomCount[zone.id] || 0;
            const blocks = zone.blocks || [];

            return (
              <div key={zone.id} className="space-y-0.5">
                {/* Dòng Header Khu */}
                <div
                  onClick={() => handleSelectZone(zone.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md transition-all text-left cursor-pointer group select-none ${
                    isZoneSelected
                      ? 'bg-[#E5F3FF] text-[#0088FF] font-bold border-l-4 border-[#0088FF]'
                      : selectedZoneId === zone.id
                      ? 'bg-blue-50/60 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Nút mở rộng/thu gọn Dãy */}
                    <button
                      type="button"
                      onClick={(e) => toggleZoneExpand(zone.id, e)}
                      className="p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Biểu tượng Thư mục / Khu */}
                    <div className="w-5 h-5 rounded bg-blue-100 text-[#0088FF] flex items-center justify-center font-bold text-[10px] shrink-0">
                      {zone.code || zone.name.replace('Khu ', '')}
                    </div>

                    <span className="truncate">{zone.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-[11px]">
                    <span className="text-slate-500 font-normal">{zoneRooms}p</span>
                    <span className="text-slate-300">•</span>
                    <span className={`font-semibold ${zoneWorkers > 0 ? 'text-[#0088FF]' : 'text-slate-400'}`}>
                      {zoneWorkers} CN
                    </span>
                  </div>
                </div>

                {/* Danh sách Dãy con (với đường kẻ nhánh cây Sapo) */}
                {isExpanded && blocks.length > 0 && (
                  <div className="ml-5 pl-2.5 border-l-2 border-slate-200 space-y-0.5 py-0.5">
                    {blocks.map(block => {
                      const isBlockSelected = selectedZoneId === zone.id && selectedBlockId === block.id;
                      const blockWorkers = statsMap.blockWorkerCount[block.id] || 0;
                      const blockRooms = statsMap.blockRoomCount[block.id] || 0;

                      return (
                        <button
                          key={block.id}
                          onClick={() => handleSelectBlock(zone.id, block.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-all text-left cursor-pointer group text-xs ${
                            isBlockSelected
                              ? 'bg-[#E5F3FF] text-[#0088FF] font-bold border-l-3 border-[#0088FF]'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <DoorClosed className={`w-3.5 h-3.5 shrink-0 ${isBlockSelected ? 'text-[#0088FF]' : 'text-slate-400'}`} />
                            <span className="truncate">{block.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
                            <span className="text-slate-400">{blockRooms}p</span>
                            <span className={`font-medium ${isBlockSelected ? 'text-[#0088FF]' : 'text-slate-600'}`}>
                              {blockWorkers} CN
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sapo Category Footer: Tổng kết nhanh */}
      <div className="p-3 border-t border-[#E4E8EC] bg-[#FAFBFC] text-[11px] text-slate-500 flex items-center justify-between">
        <span>Đang chọn:</span>
        <span className="font-semibold text-slate-800 truncate max-w-[170px]">
          {isAllSelected 
            ? 'Tất cả KTX' 
            : `${zones.find(z => z.id === selectedZoneId)?.name || ''} ${selectedBlockId !== 'all' ? '› ' + (zones.find(z => z.id === selectedZoneId)?.blocks?.find(b => b.id === selectedBlockId)?.name || '') : ''}`
          }
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Left Panel (chỉ hiện khi không bị ẩn) */}
      {!hideOnDesktop && (
        <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 bg-white border border-[#E4E8EC] rounded-lg shadow-xs overflow-hidden sticky top-[76px] max-h-[calc(100vh-92px)] flex-col">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Drawer (Trượt từ trái qua phải) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
          />

          {/* Off-canvas panel */}
          <div className="fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-3.5 border-b border-[#E4E8EC] bg-[#182538] text-white">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#0088FF]" />
                <span className="font-bold text-sm">Danh mục Khu & Dãy</span>
              </div>
              <button
                onClick={onCloseMobile}
                className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {sidebarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
