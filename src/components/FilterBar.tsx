import React from 'react';
import { 
  RotateCcw, 
  X,
  Building2,
  FolderTree
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
  onOpenCategorySidebar?: () => void;
  isCategorySidebarOpen?: boolean;
  onToggleCategorySidebar?: () => void;
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
  onOpenCategorySidebar,
  isCategorySidebarOpen,
  onToggleCategorySidebar,
  onSelectWorker,
  onSelectRoom
}) => {
  // Thống kê nhanh phòng theo trạng thái
  const roomStatusCounts = React.useMemo(() => {
    let available = 0;
    let full = 0;
    let empty = 0;

    rooms.forEach(r => {
      const currentCount = workers.filter(w => w.roomId === r.id).length;
      const maxCap = r.maxCapacity || 20;
      if (currentCount >= maxCap) {
        full++;
      } else if (currentCount === 0) {
        empty++;
      } else {
        available++;
      }
    });

    return {
      all: rooms.length,
      available,
      full,
      empty
    };
  }, [rooms, workers]);

  const isFiltered = 
    filters.searchQuery.trim() !== '' ||
    filters.zoneId !== 'all' ||
    filters.blockId !== 'all' ||
    filters.roomStatus !== 'all' ||
    filters.gender !== 'all';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5 shadow-2xs">
      {/* Universal Search & Quick Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Toggle Category Sidebar Button */}
        {(onToggleCategorySidebar || onOpenCategorySidebar) && (
          <button
            type="button"
            onClick={onToggleCategorySidebar || onOpenCategorySidebar}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer shrink-0 ${
              isCategorySidebarOpen || filters.zoneId !== 'all'
                ? 'bg-blue-50 text-[#0088FF] border-blue-200'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Đóng / mở cây danh mục Khu & Dãy"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Danh mục Khu/Dãy</span>
            <span className="sm:hidden">Khu/Dãy</span>
            {filters.zoneId !== 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0088FF]" />
            )}
          </button>
        )}

        {/* Search input with suggestions */}
        <div className="flex-1 min-w-0">
          <SearchWithSuggestions
            searchQuery={filters.searchQuery}
            onSearchChange={(query) => onFilterChange({ searchQuery: query })}
            workers={workers}
            rooms={rooms}
            zones={zones}
            onSelectWorker={onSelectWorker}
            onSelectRoom={onSelectRoom}
            onApplyFilter={(patch) => onFilterChange(patch)}
            placeholder="Tìm theo họ tên, mã NV, CCCD, phòng, dãy, quê quán, SĐT..."
          />
        </div>

        {/* Zone Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={filters.zoneId}
              onChange={(e) => {
                onFilterChange({ zoneId: e.target.value, blockId: 'all' });
              }}
              className="h-[34px] pl-2.5 pr-8 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-md focus:outline-none focus:border-[#0088FF] cursor-pointer appearance-none"
            >
              <option value="all">Tất cả Khu ({zones.length} khu)</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.blocks?.length || 0} dãy)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              ▾
            </div>
          </div>

          {/* Gender Filter Segmented */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => onFilterChange({ gender: 'all' })}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filters.gender === 'all'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => onFilterChange({ gender: 'Nam' })}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filters.gender === 'Nam'
                  ? 'bg-white text-[#0088FF] shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nam
            </button>
            <button
              onClick={() => onFilterChange({ gender: 'Nữ' })}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filters.gender === 'Nữ'
                  ? 'bg-white text-pink-600 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nữ
            </button>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Đặt lại toàn bộ bộ lọc"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer border border-rose-200"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Room Status Tabs & Results Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => onFilterChange({ roomStatus: 'all' })}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filters.roomStatus === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[11px] opacity-80">{roomStatusCounts.all}</span>
          </button>

          <button
            onClick={() => onFilterChange({ roomStatus: 'available' })}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filters.roomStatus === 'available'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-emerald-700'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Còn trống</span>
            <span className="text-[11px] opacity-80">{roomStatusCounts.available}</span>
          </button>

          <button
            onClick={() => onFilterChange({ roomStatus: 'full' })}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filters.roomStatus === 'full'
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Đã đầy (20/20)</span>
            <span className="text-[11px] opacity-80">{roomStatusCounts.full}</span>
          </button>

          <button
            onClick={() => onFilterChange({ roomStatus: 'empty' })}
            className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              filters.roomStatus === 'empty'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-amber-700'
            }`}
          >
            <span>Phòng trống</span>
            <span className="text-[11px] opacity-80">{roomStatusCounts.empty}</span>
          </button>
        </div>

        {/* Quiet results counter (Unboxed text adhering to frontend design) */}
        <div className="text-slate-500 font-medium text-xs">
          <span>{totalFilteredRooms} phòng</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span>{totalFilteredWorkers} công nhân</span>
        </div>
      </div>
    </div>
  );
};
