import React from 'react';
import { 
  LayoutGrid, 
  Users, 
  BarChart3, 
  FolderTree, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Plus
} from 'lucide-react';
import { ViewMode } from '../types';

interface SapoSidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  totalWorkers: number;
  totalRooms: number;
  syncStatus: 'synced' | 'syncing' | 'offline';
  onOpenStructureManager: () => void;
  onOpenAddWorker: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const SapoSidebar: React.FC<SapoSidebarProps> = ({
  currentView,
  onViewChange,
  totalWorkers,
  totalRooms,
  syncStatus,
  onOpenStructureManager,
  onOpenAddWorker,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const menuItems = [
    {
      id: 'grid' as ViewMode,
      label: 'Sơ đồ phòng',
      badge: `${totalRooms}`,
      icon: LayoutGrid,
    },
    {
      id: 'table' as ViewMode,
      label: 'Danh sách công nhân',
      badge: `${totalWorkers}`,
      icon: Users,
    },
    {
      id: 'stats' as ViewMode,
      label: 'Báo cáo thống kê',
      badge: null,
      icon: BarChart3,
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Main Clean Dark Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#111827] text-slate-300 transition-all duration-200 select-none border-r border-slate-800 ${
          isMobileOpen
            ? 'translate-x-0 w-60'
            : '-translate-x-full lg:translate-x-0 ' + (isCollapsed ? 'w-[64px]' : 'w-56')
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 border-b border-slate-800 px-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-md bg-[#0088FF] flex items-center justify-center text-white shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            {(!isCollapsed || isMobileOpen) && (
              <div className="min-w-0">
                <span className="font-bold text-sm tracking-tight text-white block truncate">
                  KTX CÔNG NHÂN
                </span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {isMobileOpen && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Add Button */}
        <div className="p-2.5">
          <button
            onClick={() => {
              onOpenAddWorker();
              if (isMobileOpen) onCloseMobile();
            }}
            className={`w-full bg-[#0088FF] hover:bg-[#0070E0] active:bg-[#005CBA] text-white font-medium rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              isCollapsed && !isMobileOpen ? 'h-9 px-0' : 'h-8 px-2.5 text-xs'
            }`}
            title="Thêm công nhân mới"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span className="font-semibold">Thêm công nhân</span>}
          </button>
        </div>

        {/* Navigation Menu List */}
        <nav className="flex-1 px-2 py-1 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  if (isMobileOpen) onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer group text-left ${
                  isActive
                    ? 'bg-[#0088FF] text-white font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {(!isCollapsed || isMobileOpen) && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}

          <div className="pt-2 border-t border-slate-800/80 my-2">
            <button
              onClick={() => {
                onOpenStructureManager();
                if (isMobileOpen) onCloseMobile();
              }}
              title="Cấu hình Khu - Dãy - Phòng"
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer group text-left text-slate-400 hover:text-white hover:bg-slate-800/80"
            >
              <FolderTree className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-slate-200" />
              {(!isCollapsed || isMobileOpen) && (
                <span className="truncate">Cấu hình Khu - Dãy</span>
              )}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer: Cloud Sync Status */}
        <div className="border-t border-slate-800/80 p-2.5 shrink-0 bg-[#0d131f]">
          <div className={`flex items-center gap-2 text-[11px] ${
            isCollapsed && !isMobileOpen ? 'justify-center' : 'px-1'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              syncStatus === 'synced' ? 'bg-emerald-400' : syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
            }`} />
            {(!isCollapsed || isMobileOpen) && (
              <span className="text-slate-400 text-[11px] truncate">
                {syncStatus === 'synced' ? 'Realtime Firestore' : syncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Ngoại tuyến'}
              </span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
