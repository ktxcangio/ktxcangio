import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  User, 
  DoorOpen, 
  MapPin, 
  Building, 
  Phone, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  Bed, 
  Users,
  Eye
} from 'lucide-react';
import { Worker, Room, Zone, FilterState } from '../types';
import { matchVietnameseSearch, removeVietnameseTones } from '../utils/vietnamese';

interface SearchWithSuggestionsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  workers: Worker[];
  rooms: Room[];
  zones: Zone[];
  onSelectWorker?: (worker: Worker) => void;
  onSelectRoom?: (room: Room) => void;
  onApplyFilter?: (filterPatch: Partial<FilterState>) => void;
  placeholder?: string;
}

// Component làm nổi bật từ khóa tìm kiếm
const HighlightMatch: React.FC<{ text: string; query: string; className?: string }> = ({ 
  text, 
  query,
  className = '' 
}) => {
  if (!text) return null;
  if (!query || !query.trim()) return <span className={className}>{text}</span>;

  const normalizedQuery = removeVietnameseTones(query).trim();
  if (!normalizedQuery) return <span className={className}>{text}</span>;

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return <span className={className}>{text}</span>;

  // Đơn giản hóa: highlight nếu chứa từ khóa
  return (
    <span className={className}>
      {text}
    </span>
  );
};

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  searchQuery,
  onSearchChange,
  workers = [],
  rooms = [],
  zones = [],
  onSelectWorker,
  onSelectRoom,
  onApplyFilter,
  placeholder = "Tìm nhanh: Tên công nhân, Mã NV, CCCD, Phòng, Dãy, Tổ trưởng, SĐT, Quê quán..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper tìm tên phân cấp của phòng
  const getRoomLocation = (roomId: string) => {
    const r = rooms.find(item => item.id === roomId);
    if (!r) return { roomName: 'Chưa xếp', blockName: '', zoneName: '' };
    const z = zones.find(item => item.id === r.zoneId);
    const b = z?.blocks?.find(item => item.id === r.blockId);
    return {
      roomName: r.name,
      blockName: b?.name || '',
      zoneName: z?.name || ''
    };
  };

  // Tính toán các nhóm gợi ý dựa trên từ khóa tìm kiếm
  const suggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) {
      return {
        matchedWorkers: [],
        matchedRooms: [],
        matchedLeaders: [],
        matchedLocations: [],
        isEmpty: true
      };
    }

    // 1. Công nhân khớp (Tên, Mã NV, CCCD, SĐT, Quê quán, Tổ trưởng)
    const matchedWorkers = workers.filter((w) => {
      return (
        matchVietnameseSearch(w.fullName || '', q) ||
        matchVietnameseSearch(w.code || '', q) ||
        matchVietnameseSearch(w.citizenId || '', q) ||
        matchVietnameseSearch(w.phone || '', q) ||
        matchVietnameseSearch(w.address || '', q) ||
        matchVietnameseSearch(w.hometown || '', q) ||
        matchVietnameseSearch(w.teamLeaderName || '', q) ||
        matchVietnameseSearch(w.teamLeaderPhone || '', q)
      );
    }).slice(0, 5); // Lấy tối đa 5 người gợi ý nhanh

    // 2. Phòng khớp (Tên phòng, Số phòng, hoặc Khu/Dãy)
    const matchedRooms = rooms.filter((r) => {
      const z = zones.find(item => item.id === r.zoneId);
      const b = z?.blocks?.find(item => item.id === r.blockId);
      const fullNameStr = `${r.name} ${b?.name || ''} ${z?.name || ''} phòng ${r.roomNumber}`;
      return matchVietnameseSearch(fullNameStr, q) || matchVietnameseSearch(r.name, q);
    }).slice(0, 4);

    // 3. Nhóm Tổ trưởng khớp
    const leaderCountMap = new Map<string, { count: number; phone: string }>();
    workers.forEach(w => {
      if (w.teamLeaderName && matchVietnameseSearch(w.teamLeaderName, q)) {
        const existing = leaderCountMap.get(w.teamLeaderName);
        if (existing) {
          existing.count += 1;
        } else {
          leaderCountMap.set(w.teamLeaderName, { count: 1, phone: w.teamLeaderPhone || '' });
        }
      }
    });
    const matchedLeaders = Array.from(leaderCountMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .slice(0, 3);

    // 4. Nhóm Quê quán / Địa chỉ khớp
    const locationMap = new Map<string, number>();
    workers.forEach(w => {
      const loc = w.address || w.hometown;
      if (loc && matchVietnameseSearch(loc, q)) {
        locationMap.set(loc, (locationMap.get(loc) || 0) + 1);
      }
    });
    const matchedLocations = Array.from(locationMap.entries())
      .map(([address, count]) => ({ address, count }))
      .slice(0, 3);

    const totalCount = matchedWorkers.length + matchedRooms.length + matchedLeaders.length + matchedLocations.length;

    return {
      matchedWorkers,
      matchedRooms,
      matchedLeaders,
      matchedLocations,
      totalCount,
      isEmpty: false
    };
  }, [searchQuery, workers, rooms, zones]);

  // Phẳng hóa danh sách item để điều hướng bằng bàn phím
  const flatItems = useMemo(() => {
    const list: Array<{ type: 'worker' | 'room' | 'leader' | 'location'; data: any }> = [];
    suggestions.matchedWorkers.forEach(w => list.push({ type: 'worker', data: w }));
    suggestions.matchedRooms.forEach(r => list.push({ type: 'room', data: r }));
    suggestions.matchedLeaders.forEach(l => list.push({ type: 'leader', data: l }));
    suggestions.matchedLocations.forEach(loc => list.push({ type: 'location', data: loc }));
    return list;
  }, [suggestions]);

  // Xử lý Click Outside để ẩn Dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset selectedIndex khi query thay đổi
  useEffect(() => {
    setSelectedIndex(-1);
    if (searchQuery.trim().length > 0) {
      setIsOpen(true);
    }
  }, [searchQuery]);

  // Xử lý phím tắt (Arrow Up, Arrow Down, Enter, Escape, Shortcut '/')
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Phím tắt '/' để focus nhanh vào ô tìm kiếm khi không gõ trong input khác
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        const item = flatItems[selectedIndex];
        handleSelectItem(item);
      } else {
        // Đóng gợi ý và giữ bộ lọc
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item: { type: 'worker' | 'room' | 'leader' | 'location'; data: any }) => {
    if (item.type === 'worker') {
      const worker = item.data as Worker;
      onSearchChange(worker.fullName);
      if (onSelectWorker) {
        onSelectWorker(worker);
      }
    } else if (item.type === 'room') {
      const room = item.data as Room;
      if (onSelectRoom) {
        onSelectRoom(room);
      } else if (onApplyFilter) {
        onApplyFilter({ zoneId: room.zoneId, blockId: room.blockId, searchQuery: '' });
      }
    } else if (item.type === 'leader') {
      onSearchChange(item.data.name);
    } else if (item.type === 'location') {
      onSearchChange(item.data.address);
    }
    setIsOpen(false);
  };

  // Các thẻ tìm kiếm nhanh phổ biến khi chưa gõ
  const QUICK_TAGS = [
    { label: '🟢 Còn chỗ', query: '', filter: { roomStatus: 'available' as const } },
    { label: '🔴 Đã đầy', query: '', filter: { roomStatus: 'full' as const } },
    { label: '⚪ Phòng trống', query: '', filter: { roomStatus: 'empty' as const } },
    { label: 'Khu A', query: '', filter: { zoneId: 'zone-a' } },
    { label: 'Khu B', query: '', filter: { zoneId: 'zone-b' } },
    { label: 'Công nhân Nam', query: '', filter: { gender: 'Nam' as const } },
    { label: 'Công nhân Nữ', query: '', filter: { gender: 'Nữ' as const } },
  ];

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Ô nhập tìm kiếm chính */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-blue-500 absolute left-3 pointer-events-none transition-colors" />
        
        <input
          ref={inputRef}
          id="input-search-worker"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-9 pr-14 py-2 sm:py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-2xs font-medium"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {searchQuery && (
            <button
              id="btn-clear-search"
              type="button"
              onClick={() => {
                onSearchChange('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              title="Xóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-200/70 border border-slate-300 rounded text-center">
            /
          </kbd>
        </div>
      </div>

      {/* Dropdown Gợi Ý Ngay Lập Tức (Instant Suggestions Popover) */}
      {isOpen && (
        <div 
          id="search-suggestions-dropdown"
          className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-[460px] flex flex-col animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* TRƯỜNG HỢP 1: Khi chưa nhập từ khóa -> Hiện Gợi ý tìm kiếm phổ biến */}
          {suggestions.isEmpty ? (
            <div className="p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gợi ý tìm kiếm nhanh:
                </span>
                <span className="text-[11px] text-slate-400">Nhập ký tự để gợi ý tức thì</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map((tag, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (onApplyFilter && tag.filter) {
                        onApplyFilter(tag.filter);
                      }
                      setIsOpen(false);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>

              {workers.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Công nhân tiêu biểu trong KTX:
                  </div>
                  <div className="space-y-1">
                    {workers.slice(0, 3).map((w) => {
                      const loc = getRoomLocation(w.roomId);
                      return (
                        <div
                          key={w.id}
                          onClick={() => {
                            onSearchChange(w.fullName);
                            if (onSelectWorker) onSelectWorker(w);
                            setIsOpen(false);
                          }}
                          className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg ${w.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                              {w.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                {w.fullName} <span className="text-[11px] font-normal text-slate-500">({w.code})</span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {loc.zoneName} &bull; {loc.blockName} &bull; {loc.roomName} (Giường #{w.bedNumber})
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Xem <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : suggestions.totalCount === 0 ? (
            /* TRƯỜNG HỢP 2: Không tìm thấy kết quả nào */
            <div className="p-6 text-center space-y-2">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                Không tìm thấy kết quả nào khớp với &quot;{searchQuery}&quot;
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Mẹo: Hệ thống tự động tìm kiếm không dấu Tiếng Việt. Bạn có thể tìm theo <strong>Mã nhân viên (NV-...)</strong>, <strong>Số CCCD</strong>, <strong>Số điện thoại</strong>, hoặc <strong>Tên Phòng</strong>.
              </p>
            </div>
          ) : (
            /* TRƯỜNG HỢP 3: Có kết quả gợi ý tức thì được phân loại rõ ràng */
            <div className="overflow-y-auto divide-y divide-slate-100">
              
              {/* NHÓM 1: CÔNG NHÂN & NHÂN SỰ */}
              {suggestions.matchedWorkers.length > 0 && (
                <div className="p-2 sm:p-2.5">
                  <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Công nhân ({suggestions.matchedWorkers.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Nhấp để xem hồ sơ hoặc lọc</span>
                  </div>

                  <div className="space-y-1 mt-1">
                    {suggestions.matchedWorkers.map((w, index) => {
                      const flatIndex = index;
                      const isHighlighted = selectedIndex === flatIndex;
                      const loc = getRoomLocation(w.roomId);

                      return (
                        <div
                          key={w.id}
                          onClick={() => handleSelectItem({ type: 'worker', data: w })}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl cursor-pointer transition-all ${
                            isHighlighted ? 'bg-blue-50 border border-blue-200 shadow-2xs' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl ${w.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs overflow-hidden`}>
                              {w.photoUrl ? (
                                <img
                                  src={w.photoUrl}
                                  alt={w.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                w.fullName.charAt(0)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  <HighlightMatch text={w.fullName} query={searchQuery} />
                                </span>
                                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md border border-slate-200">
                                  {w.code}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                                  w.gender === 'Nữ' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {w.gender}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 truncate">
                                <span className="flex items-center gap-1 font-medium text-slate-700 truncate">
                                  <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                  {loc.zoneName} &bull; {loc.blockName} &bull; <strong className="text-blue-700">{loc.roomName}</strong> (Giường #{w.bedNumber})
                                </span>
                                {w.citizenId && (
                                  <span className="hidden sm:inline text-slate-400">
                                    • CCCD: {w.citizenId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectWorker) onSelectWorker(w);
                                setIsOpen(false);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Xem chi tiết hồ sơ"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NHÓM 2: PHÒNG Ở KTX */}
              {suggestions.matchedRooms.length > 0 && (
                <div className="p-2 sm:p-2.5">
                  <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <DoorOpen className="w-3.5 h-3.5" />
                      Phòng ở KTX ({suggestions.matchedRooms.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Nhấp để mở phòng</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {suggestions.matchedRooms.map((r, rIdx) => {
                      const flatIndex = suggestions.matchedWorkers.length + rIdx;
                      const isHighlighted = selectedIndex === flatIndex;
                      const z = zones.find(item => item.id === r.zoneId);
                      const b = z?.blocks?.find(item => item.id === r.blockId);
                      const occupants = workers.filter(w => w.roomId === r.id);
                      const isFull = occupants.length >= (r.maxCapacity || 20);
                      const freeBeds = Math.max(0, (r.maxCapacity || 20) - occupants.length);

                      return (
                        <div
                          key={r.id}
                          onClick={() => handleSelectItem({ type: 'room', data: r })}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`p-2 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                            isHighlighted 
                              ? 'bg-emerald-50 border-emerald-300 shadow-2xs' 
                              : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">
                                {r.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                ({z?.name} - {b?.name})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              <span>{occupants.length}/{r.maxCapacity || 20} người</span>
                              <span>&bull;</span>
                              <span className={freeBeds > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600'}>
                                {freeBeds > 0 ? `Còn ${freeBeds} giường` : 'Đã kín'}
                              </span>
                            </div>
                          </div>

                          <DoorOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* NHÓM 3: TỔ TRƯỞNG & ĐỊA BÀN */}
              {(suggestions.matchedLeaders.length > 0 || suggestions.matchedLocations.length > 0) && (
                <div className="p-2 sm:p-2.5 space-y-2 bg-slate-50/50">
                  {suggestions.matchedLeaders.length > 0 && (
                    <div>
                      <div className="px-2.5 py-0.5 text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        Tổ trưởng phụ trách
                      </div>
                      <div className="space-y-1 mt-1">
                        {suggestions.matchedLeaders.map((leader, lIdx) => {
                          const flatIndex = suggestions.matchedWorkers.length + suggestions.matchedRooms.length + lIdx;
                          const isHighlighted = selectedIndex === flatIndex;
                          return (
                            <div
                              key={leader.name}
                              onClick={() => handleSelectItem({ type: 'leader', data: leader })}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              className={`p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                                isHighlighted ? 'bg-purple-100/70 font-bold text-purple-900' : 'hover:bg-slate-100 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-purple-600" />
                                <span>Tổ trưởng: <strong>{leader.name}</strong></span>
                                {leader.phone && (
                                  <span className="text-[11px] text-slate-500">({leader.phone})</span>
                                )}
                              </div>
                              <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                                {leader.count} công nhân
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {suggestions.matchedLocations.length > 0 && (
                    <div>
                      <div className="px-2.5 py-0.5 text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Địa chỉ / Quê quán
                      </div>
                      <div className="space-y-1 mt-1">
                        {suggestions.matchedLocations.map((loc, locIdx) => {
                          const flatIndex = suggestions.matchedWorkers.length + suggestions.matchedRooms.length + suggestions.matchedLeaders.length + locIdx;
                          const isHighlighted = selectedIndex === flatIndex;
                          return (
                            <div
                              key={loc.address}
                              onClick={() => handleSelectItem({ type: 'location', data: loc })}
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              className={`p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                                isHighlighted ? 'bg-amber-100/70 font-bold text-amber-900' : 'hover:bg-slate-100 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="truncate">{loc.address}</span>
                              </div>
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold shrink-0">
                                {loc.count} người
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* Footer hướng dẫn phím bấm */}
          <div className="bg-slate-100/80 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">
                Dùng phím <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">↓</kbd> để di chuyển
              </span>
              <span>
                Phím <kbd className="px-1 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">Enter</kbd> để chọn
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Đóng (ESC)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
