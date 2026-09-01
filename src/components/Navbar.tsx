import React from 'react';
import { 
  Building2, 
  Users, 
  BedDouble, 
  UserPlus, 
  Download, 
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  BarChart3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
  totalWorkers: number;
  totalRooms: number;
  maxCapacity: number;
  fullRoomsCount: number;
  emptyRoomsCount: number;
  availableRoomsCount: number;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpenAddWorker: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  totalWorkers,
  totalRooms,
  maxCapacity,
  fullRoomsCount,
  emptyRoomsCount,
  availableRoomsCount,
  currentView,
  onViewChange,
  onOpenAddWorker,
  onExportCSV,
  onResetData,
}) => {
  const occupancyRate = totalRooms > 0 ? Math.round((totalWorkers / (totalRooms * 20)) * 100) : 0;
  const remainingBeds = Math.max(0, (totalRooms * 20) - totalWorkers);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner / Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 sm:py-3 gap-2">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold text-lg shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate">
                  QL Ký Túc Xá
                </h1>
                <span className="hidden md:inline-flex text-[11px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                  20 người / phòng • 15 phòng / dãy
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                <span className="hidden sm:inline">Phân cấp Khu - Dãy - Phòng • </span>
                Tìm kiếm không dấu
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-add-worker-main"
              onClick={onOpenAddWorker}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer touch-manipulation min-h-[38px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Thêm CN</span>
            </button>

            <button
              id="btn-export-csv"
              onClick={onExportCSV}
              title="Xuất danh sách công nhân ra file CSV"
              className="inline-flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer touch-manipulation min-h-[38px]"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline sm:ml-1.5">Xuất CSV</span>
            </button>

            <button
              id="btn-reset-sample-data"
              onClick={onResetData}
              title="Khôi phục lại dữ liệu mẫu"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 border border-slate-700 text-xs font-medium transition-colors cursor-pointer min-h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Dữ liệu mẫu</span>
            </button>
          </div>
        </div>

        {/* Desktop View Switcher and Metric Indicators Bar */}
        <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between py-2 border-t border-slate-800/80 gap-3 text-xs">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
            <button
              id="view-tab-grid"
              onClick={() => onViewChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentView === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Sơ đồ Phòng</span>
            </button>

            <button
              id="view-tab-table"
              onClick={() => onViewChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentView === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Danh sách ({totalWorkers})</span>
            </button>

            <button
              id="view-tab-stats"
              onClick={() => onViewChange('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                currentView === 'stats'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Thống kê</span>
            </button>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center flex-wrap gap-2 text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Tổng CN: <strong className="text-white font-semibold">{totalWorkers}</strong></span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
              <span>Trống: <strong className="text-emerald-400 font-semibold">{remainingBeds}</strong>/{maxCapacity}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/70 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Lấp đầy: <strong className="text-white font-semibold">{occupancyRate}%</strong></span>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> {availableRoomsCount} phòng còn chỗ
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                <AlertTriangle className="w-3 h-3" /> {fullRoomsCount} phòng đầy
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Mini Counter Bar */}
        <div className="flex sm:hidden items-center justify-between py-1.5 border-t border-slate-800/80 text-[11px] text-slate-300">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-400" />
            <span>CN: <strong className="text-white">{totalWorkers}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <BedDouble className="w-3 h-3 text-emerald-400" />
            <span>Trống: <strong className="text-emerald-400">{remainingBeds}</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            <span>Lấp đầy: <strong className="text-white">{occupancyRate}%</strong></span>
          </div>
        </div>
      </div>
    </header>
  );
};
