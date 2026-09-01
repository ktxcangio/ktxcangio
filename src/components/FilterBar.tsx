import React, { useState } from 'react';
import { 
  Filter, 
  MapPin, 
  SlidersHorizontal,
  RotateCcw,
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Plus 
} from 'lucide-react';
import { Zone, Room, Worker, FilterState } from '../types';
import { SearchWithSuggestions } from './SearchWithSuggestions';

interface FilterBarProps {
  zones: Zone[];
  rooms?: Room[];
  workers?: Worker[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalFilteredWorkers: number;
  totalFilteredRooms: number;
  onOpenManageStructure?: () => void;
  onOpenStructureManager?: () => void;
  onSelectWorker?: (worker: Worker) => void;
  onSelectRoom?: (room: Room) => void;
  departments?: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  zones = [],
  rooms = [],
  workers = [],
  filters,
  onFilterChange,
  onResetFilters,
  totalFilteredWorkers,
  totalFilteredRooms,
  onOpenManageStructure,
  onOpenStructureManager,
  onSelectWorker,
  onSelectRoom
}) => {
  const [isMobileFilterExpanded, setIsMobileFilterExpanded] = useState(false);
  const handleOpenStructure = onOpenStructureManager || onOpenManageStructure || (() => {});

  // Tìm zone hiện tại để lấy danh sách block tương ứng
  const selectedZone = (zones || []).find(z => z.id === filters.zoneId);
  const availableBlocks = selectedZone?.blocks || [];

  const isFiltered = 
    filters.searchQuery.trim() !== '' ||
    filters.zoneId !== 'all' ||
    filters.blockId !== 'all' ||
    filters.roomStatus !== 'all' ||
    filters.gender !== 'all';

  const activeExtraFilterCount = 
    (filters.blockId !== 'all' ? 1 : 0) +
    (filters.roomStatus !== 'all' ? 1 : 0) +
    (filters.gender !== 'all' ? 1 : 0);

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs sticky top-[68px] sm:top-[80px] z-20 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 space-y-2.5">
        
        {/* Row 1: Search Bar With Realtime Suggestions & Mobile Filter Toggle */}
        <div className="flex items-center gap-2">
          {/* Ô Tìm Kiếm Có Gợi Ý Tức Thì */}
          <SearchWithSuggestions
            searchQuery={filters.searchQuery}
            onSearchChange={(query) => onFilterChange({ searchQuery: query })}
            workers={workers}
            rooms={rooms}
            zones={zones}
            onSelectWorker={onSelectWorker}
            onSelectRoom={onSelectRoom}
            onApplyFilter={(patch) => onFilterChange(patch)}
            placeholder="Gõ tìm ngay: Họ tên, Mã NV, CCCD, Phòng, Dãy, Tổ trưởng, SĐT, Quê quán..."
          />

          {/* Nút Thêm Khu / Dãy / Phòng */}
          <button
            type="button"
            onClick={handleOpenStructure}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors cursor-pointer shrink-0"
            title="Thêm Khu, Dãy hoặc Phòng mới"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>Thêm Khu/Dãy/Phòng</span>
          </button>

          {/* Mobile Filter Toggle Button */}
          <button
            onClick={() => setIsMobileFilterExpanded(!isMobileFilterExpanded)}
            className={`md:hidden flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer touch-manipulation min-h-[38px] shrink-0 ${
              activeExtraFilterCount > 0 || isMobileFilterExpanded
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-slate-50 border-slate-300 text-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Lọc</span>
            {activeExtraFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeExtraFilterCount}
              </span>
            )}
            {isMobileFilterExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Khu chips (Khu A, Khu B, Khu C, Khu D...) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 -mx-1 px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
            Khu KTX:
          </span>
          <button
            onClick={() => onFilterChange({ zoneId: 'all', blockId: 'all' })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer touch-manipulation ${
              filters.zoneId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả ({zones.length} Khu)
          </button>
          {zones.map((zone) => (
            <button
              key={zone.id}
              onClick={() => onFilterChange({ zoneId: zone.id, blockId: 'all' })}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer touch-manipulation flex items-center gap-1.5 ${
                filters.zoneId === zone.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span className="font-bold">{zone.name}</span>
              <span className="text-[10px] opacity-80">({(zone.blocks || []).length} dãy)</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleOpenStructure}
            className="sm:hidden px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3 h-3" />
            <span>+ Khu/Dãy/Phòng</span>
          </button>
        </div>

        {/* Extra Filters Row */}
        <div className={`${isMobileFilterExpanded ? 'block' : 'hidden md:block'} pt-2 border-t border-slate-100 space-y-2.5 animate-in fade-in duration-150`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Filter by Block (Dãy) */}
            <div>
              <label htmlFor="select-filter-block" className="sr-only">Lọc theo Dãy</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  id="select-filter-block"
                  value={filters.blockId}
                  disabled={filters.zoneId === 'all'}
                  onChange={(e) => onFilterChange({ blockId: e.target.value })}
                  className={`w-full pl-9 pr-8 py-2 text-slate-800 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all font-medium ${
                    filters.zoneId === 'all'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                      : 'bg-slate-50 hover:bg-slate-100/80 focus:bg-white cursor-pointer'
                  }`}
                >
                  <option value="all">
                    {filters.zoneId === 'all' ? 'Chọn Khu trước để lọc Dãy' : `Tất cả Dãy (${availableBlocks.length})`}
                  </option>
                  {availableBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.name} ({block.rooms?.length || 0} phòng)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter by Room Status */}
            <div>
              <label htmlFor="select-filter-room-status" className="sr-only">Trạng thái phòng</label>
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <select
                  id="select-filter-room-status"
                  value={filters.roomStatus}
                  onChange={(e) => onFilterChange({ roomStatus: e.target.value as FilterState['roomStatus'] })}
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="all">Tất cả tình trạng phòng</option>
                  <option value="available">🟢 Còn chỗ (&lt; 20 người)</option>
                  <option value="full">🔴 Đã đầy (20/20 người)</option>
                  <option value="empty">⚪ Phòng trống (0 người)</option>
                </select>
              </div>
            </div>

            {/* Gender Filter Buttons */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 w-full sm:w-auto">
                <button
                  id="btn-filter-gender-all"
                  onClick={() => onFilterChange({ gender: 'all' })}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filters.gender === 'all'
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả GT
                </button>
                <button
                  id="btn-filter-gender-nam"
                  onClick={() => onFilterChange({ gender: 'Nam' })}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filters.gender === 'Nam'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nam
                </button>
                <button
                  id="btn-filter-gender-nu"
                  onClick={() => onFilterChange({ gender: 'Nữ' })}
                  className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    filters.gender === 'Nữ'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Nữ
                </button>
              </div>

              {isFiltered && (
                <button
                  id="btn-reset-filters"
                  onClick={onResetFilters}
                  title="Xóa tất cả bộ lọc"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer font-semibold text-xs whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa lọc</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter & Search Tip */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span>Kết quả: <strong className="text-slate-900 font-bold">{totalFilteredWorkers}</strong> nhân viên</span>
            <span>•</span>
            <span><strong className="text-slate-900 font-bold">{totalFilteredRooms}</strong> phòng</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Tìm kiếm không dấu Tiếng Việt tự động</span>
          </div>
        </div>
      </div>
    </div>
  );
};
