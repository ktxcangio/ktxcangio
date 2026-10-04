import React from 'react';
import { 
  Menu, 
  Download, 
  Plus, 
  RotateCcw, 
  Building2, 
  CheckCircle2, 
  RefreshCw,
  LayoutGrid,
  Users,
  BarChart3,
  Cloud
} from 'lucide-react';
import { ViewMode } from '../types';

interface SapoHeaderProps {
  currentView: ViewMode;
  totalWorkers: number;
  totalRooms: number;
  maxCapacity: number;
  availableRoomsCount: number;
  fullRoomsCount: number;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onOpenMobileMenu: () => void;
  onOpenAddWorker: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  onOpenStructureManager: () => void;
  onOpenCategorySidebar?: () => void;
  onViewChange?: (view: ViewMode) => void;
  onOpenFirebaseModal?: () => void;
}

export const SapoHeader: React.FC<SapoHeaderProps> = ({
  currentView,
  totalWorkers,
  totalRooms,
  syncStatus = 'synced',
  onOpenMobileMenu,
  onOpenAddWorker,
  onExportCSV,
  onResetData,
  onViewChange,
  onOpenFirebaseModal,
}) => {
  const occupancyRate = totalRooms > 0 ? Math.round((totalWorkers / (totalRooms * 20)) * 100) : 0;
  const remainingBeds = Math.max(0, (totalRooms * 20) - totalWorkers);

  const navItems = [
    { id: 'grid' as ViewMode, label: 'Sơ đồ phòng', icon: LayoutGrid },
    { id: 'table' as ViewMode, label: 'Danh sách công nhân', icon: Users },
    { id: 'stats' as ViewMode, label: 'Báo cáo thống kê', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="h-14 px-3 sm:px-5 flex items-center justify-between gap-3">
        {/* Left Side: Mobile Menu Button & App Title / View Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
            title="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#0088FF] text-white flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate">
                Quản Lý Ký Túc Xá
              </h1>
            </div>
          </div>

          {/* Quick View Tabs in Header (Desktop) */}
          {onViewChange && (
            <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#0088FF]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Quick Stats & Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Subtle Live Stats Indicator (Zero-Pill discipline) */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span><strong>{totalWorkers}</strong> công nhân</span>
            <span>·</span>
            <span>Trống <strong>{remainingBeds}</strong> giường</span>
            <span>·</span>
            <span>Lấp đầy <strong>{occupancyRate}%</strong></span>
          </div>

          {/* Cloud Sync Status - Google Firebase */}
          <button
            onClick={onOpenFirebaseModal}
            title="Xem chi tiết trạng thái lưu trữ trên Google Firebase Cloud"
            className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-700 font-medium px-2.5 py-1.5 rounded-md bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200/90 transition-colors cursor-pointer shadow-2xs"
          >
            {syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
                <span className="text-amber-800 font-semibold">Firebase đang đồng bộ</span>
              </>
            ) : syncStatus === 'offline' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span className="text-slate-600">Firebase ngoại tuyến</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-amber-900 font-semibold">Google Firebase</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">Cloud</span>
              </>
            )}
          </button>

          {/* Export CSV Button */}
          <button
            onClick={onExportCSV}
            title="Xuất danh sách công nhân ra Excel / CSV"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetData}
            title="Khôi phục lại dữ liệu mẫu ký túc xá"
            className="hidden sm:inline-flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Primary Action Button: + Thêm công nhân */}
          <button
            id="sapo-header-btn-add-worker"
            onClick={onOpenAddWorker}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0088FF] hover:bg-[#0070E0] active:bg-[#005CBA] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Thêm công nhân</span>
          </button>

          {/* User Profile Avatar */}
          <div className="w-7 h-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[11px] shadow-2xs">
            AD
          </div>
        </div>
      </div>
    </header>
  );
};
