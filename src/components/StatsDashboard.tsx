import React, { useState, useMemo } from 'react';
import { 
  Worker, 
  Zone, 
  Room 
} from '../types';
import { 
  Building, 
  Users, 
  Bed, 
  MapPin, 
  Briefcase, 
  PieChart, 
  CheckCircle2, 
  UserCheck,
  Box,
  Download,
  Search,
  Filter,
  Layers,
  ArrowRight,
  DoorOpen,
  FolderTree
} from 'lucide-react';
import { matchVietnameseSearch } from '../utils/vietnamese';

interface StatsDashboardProps {
  workers: Worker[];
  zones: Zone[];
  rooms: Room[];
  onSelectRoom?: (room: Room) => void;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  workers = [],
  zones = [],
  rooms = [],
  onSelectRoom,
}) => {
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [roomSearchQuery, setRoomSearchQuery] = useState<string>('');
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'available' | 'full' | 'empty'>('all');
  const [activeTab, setActiveTab] = useState<'both' | 'zone' | 'room'>('both');

  const safeWorkers = workers || [];
  const safeRooms = rooms || [];
  const safeZones = zones || [];

  // 1. Tính toán Tổng thể KTX (Tổng giường, Tổng tủ, Đang dùng, Còn trống)
  const totalBeds = useMemo(() => {
    return safeRooms.reduce((sum, r) => sum + (r.bedCount || 20), 0);
  }, [safeRooms]);

  const totalLockers = useMemo(() => {
    return safeRooms.reduce((sum, r) => sum + (r.lockerCount || 20), 0);
  }, [safeRooms]);

  const totalWorkers = safeWorkers.length;
  const availableBeds = Math.max(0, totalBeds - totalWorkers);
  const bedOccupancyRate = totalBeds > 0 ? Math.round((totalWorkers / totalBeds) * 100) : 0;

  // Tính tổng tủ đã cấp cho công nhân
  const totalAssignedLockers = useMemo(() => {
    return safeWorkers.reduce((sum, w) => sum + (w.lockerNumber !== undefined ? w.lockerNumber : 1), 0);
  }, [safeWorkers]);

  const availableLockers = Math.max(0, totalLockers - totalAssignedLockers);
  const lockerUsageRate = totalLockers > 0 ? Math.round((totalAssignedLockers / totalLockers) * 100) : 0;

  // Giới tính
  const maleCount = safeWorkers.filter(w => w.gender === 'Nam').length;
  const femaleCount = safeWorkers.filter(w => w.gender === 'Nữ').length;

  // 2. Thống kê Chi tiết theo Phân Khu (Zone)
  const zoneStats = useMemo(() => {
    return safeZones.map((zone) => {
      const zoneRooms = safeRooms.filter(r => r.zoneId === zone.id);
      const zoneWorkers = safeWorkers.filter(w => w.zoneId === zone.id);
      
      const zoneBeds = zoneRooms.reduce((sum, r) => sum + (r.bedCount || 20), 0);
      const zoneOccupiedBeds = zoneWorkers.length;
      const zoneAvailBeds = Math.max(0, zoneBeds - zoneOccupiedBeds);
      const bedOccupancy = zoneBeds > 0 ? Math.round((zoneOccupiedBeds / zoneBeds) * 100) : 0;

      const zoneLockers = zoneRooms.reduce((sum, r) => sum + (r.lockerCount || 20), 0);
      const zoneAssignedLockers = zoneWorkers.reduce((sum, w) => sum + (w.lockerNumber !== undefined ? w.lockerNumber : 1), 0);
      const zoneAvailLockers = Math.max(0, zoneLockers - zoneAssignedLockers);
      const lockerUsage = zoneLockers > 0 ? Math.round((zoneAssignedLockers / zoneLockers) * 100) : 0;

      // Đếm số phòng đầy, còn chỗ, trống
      let fullRooms = 0;
      let emptyRooms = 0;
      zoneRooms.forEach(r => {
        const count = safeWorkers.filter(w => w.roomId === r.id).length;
        const maxCap = r.maxCapacity || 20;
        if (count >= maxCap) fullRooms++;
        if (count === 0) emptyRooms++;
      });

      return {
        zone,
        blocksCount: zone.blocks?.length || 0,
        roomsCount: zoneRooms.length,
        workersCount: zoneOccupiedBeds,
        bedsCount: zoneBeds,
        availableBeds: zoneAvailBeds,
        bedOccupancy,
        lockersCount: zoneLockers,
        assignedLockers: zoneAssignedLockers,
        availableLockers: zoneAvailLockers,
        lockerUsage,
        fullRooms,
        emptyRooms,
        availableRooms: Math.max(0, zoneRooms.length - fullRooms - emptyRooms),
      };
    });
  }, [safeZones, safeRooms, safeWorkers]);

  // 3. Thống kê Chi tiết theo Từng Phòng (Room)
  const roomStatsList = useMemo(() => {
    return safeRooms.map((room) => {
      const roomWorkers = safeWorkers.filter(w => w.roomId === room.id);
      const zone = safeZones.find(z => z.id === room.zoneId);
      const block = zone?.blocks?.find(b => b.id === room.blockId);

      const bedCount = room.bedCount || 20;
      const occupiedBeds = roomWorkers.length;
      const availBeds = Math.max(0, bedCount - occupiedBeds);
      const bedRate = bedCount > 0 ? Math.round((occupiedBeds / bedCount) * 100) : 0;

      const lockerCount = room.lockerCount || 20;
      const assignedLockers = roomWorkers.reduce((sum, w) => sum + (w.lockerNumber !== undefined ? w.lockerNumber : 1), 0);
      const availLockers = Math.max(0, lockerCount - assignedLockers);
      const lockerRate = lockerCount > 0 ? Math.round((assignedLockers / lockerCount) * 100) : 0;

      const isFull = occupiedBeds >= (room.maxCapacity || 20);
      const isEmpty = occupiedBeds === 0;

      return {
        room,
        zone,
        block,
        workers: roomWorkers,
        bedCount,
        occupiedBeds,
        availBeds,
        bedRate,
        lockerCount,
        assignedLockers,
        availLockers,
        lockerRate,
        isFull,
        isEmpty,
      };
    });
  }, [safeRooms, safeWorkers, safeZones]);

  // Lọc danh sách phòng theo bộ lọc Khu & Tìm kiếm & Trạng thái
  const filteredRoomStats = useMemo(() => {
    return roomStatsList.filter((item) => {
      // 1. Lọc theo Khu
      if (selectedZoneFilter !== 'all' && item.room.zoneId !== selectedZoneFilter) {
        return false;
      }

      // 2. Lọc theo trạng thái
      if (roomStatusFilter === 'available' && item.isFull) return false;
      if (roomStatusFilter === 'full' && !item.isFull) return false;
      if (roomStatusFilter === 'empty' && !item.isEmpty) return false;

      // 3. Tìm kiếm tên phòng hoặc tên dãy
      if (roomSearchQuery.trim()) {
        const q = roomSearchQuery.trim();
        const matchesRoomName = matchVietnameseSearch(item.room.name || '', q);
        const matchesBlockName = matchVietnameseSearch(item.block?.name || '', q);
        const matchesZoneName = matchVietnameseSearch(item.zone?.name || '', q);
        if (!matchesRoomName && !matchesBlockName && !matchesZoneName) {
          return false;
        }
      }

      return true;
    });
  }, [roomStatsList, selectedZoneFilter, roomStatusFilter, roomSearchQuery]);

  // 4. Thống kê theo Tổ trưởng
  const teamLeaderMap = new Map<string, number>();
  safeWorkers.forEach(w => {
    const leader = w.teamLeaderName || 'Chưa gán tổ';
    teamLeaderMap.set(leader, (teamLeaderMap.get(leader) || 0) + 1);
  });
  const teamLeaderList = Array.from(teamLeaderMap.entries()).sort((a, b) => b[1] - a[1]);

  // Xuất file CSV thống kê Giường và Tủ
  const handleExportStatsCSV = () => {
    const headers = [
      'Phân Khu',
      'Dãy',
      'Tên Phòng',
      'Số Công Nhân Đang Ở',
      'Tổng Số Giường',
      'Giường Đã Có Người',
      'Giường Còn Trống',
      'Tỷ Lệ Dùng Giường (%)',
      'Tổng Số Tủ Đồ',
      'Số Tủ Đã Cấp',
      'Số Tủ Còn Trống',
      'Tỷ Lệ Dùng Tủ (%)',
      'Tình Trạng Phòng',
    ];

    const rows = filteredRoomStats.map((item) => [
      `"${item.zone?.name || ''}"`,
      `"${item.block?.name || ''}"`,
      `"${item.room.name}"`,
      item.occupiedBeds,
      item.bedCount,
      item.occupiedBeds,
      item.availBeds,
      `${item.bedRate}%`,
      item.lockerCount,
      item.assignedLockers,
      item.availLockers,
      `${item.lockerRate}%`,
      `"${item.isFull ? 'Đầy' : item.isEmpty ? 'Trống' : 'Còn chỗ'}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Thong_Ke_Giuong_Tu_KTX_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Sapo Top Metric KPI Cards - Có bổ sung Tổng giường & Tổng tủ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Tổng công nhân */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng công nhân</span>
            <div className="w-8 h-8 rounded-md bg-[#E5F3FF] text-[#0088FF] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {totalWorkers} <span className="text-xs font-normal text-slate-500">người</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-[#0088FF] font-semibold">Nam: {maleCount}</span>
            <span>•</span>
            <span className="text-pink-600 font-semibold">Nữ: {femaleCount}</span>
          </div>
        </div>

        {/* Card 2: Tổng số phòng */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số phòng</span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {rooms.length} <span className="text-xs font-normal text-slate-500">phòng</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {zones.length} Phân khu • {safeZones.reduce((sum, z) => sum + (z.blocks?.length || 0), 0)} Dãy
          </div>
        </div>

        {/* Card 3: TỔNG SỐ GIƯỜNG NGỦ */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số giường</span>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700 mt-2">
            {totalBeds} <span className="text-xs font-normal text-slate-500">giường</span>
          </div>
          <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
            <span>Đang nằm: <strong className="text-slate-900">{totalWorkers}</strong></span>
            <span className="text-[#1E8E3E] font-bold">Trống {availableBeds}</span>
          </div>
        </div>

        {/* Card 4: TỔNG SỐ TỦ ĐỒ CÁ NHÂN */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số tủ đồ</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Box className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {totalLockers} <span className="text-xs font-normal text-slate-500">cái tủ</span>
          </div>
          <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
            <span>Đã cấp: <strong className="text-slate-900">{totalAssignedLockers}</strong></span>
            <span className="text-[#1E8E3E] font-bold">Trống {availableLockers}</span>
          </div>
        </div>
      </div>

      {/* 2. THANH ĐIỀU HƯỚNG BÁO CÁO & XUẤT CSV */}
      <div className="bg-white rounded-lg border border-[#E4E8EC] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">Chế độ xem:</span>
          <button
            type="button"
            onClick={() => setActiveTab('both')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'both'
                ? 'bg-[#0088FF] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả báo cáo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zone')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'zone'
                ? 'bg-[#0088FF] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Thống kê theo Khu ({safeZones.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('room')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'room'
                ? 'bg-[#0088FF] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Thống kê theo Phòng ({safeRooms.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportStatsCSV}
          className="px-3.5 py-1.5 bg-[#1E8E3E] hover:bg-[#187533] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
          title="Xuất dữ liệu thống kê Giường và Tủ của từng khu và phòng ra file Excel (CSV)"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Excel Giường &amp; Tủ</span>
        </button>
      </div>

      {/* 3. BẢNG 1: THỐNG KÊ TỔNG SỐ GIƯỜNG & SỐ TỦ THEO PHÂN KHU (ZONE) */}
      {(activeTab === 'both' || activeTab === 'zone') && (
        <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-xs overflow-hidden">
          <div className="p-3.5 border-b border-[#E4E8EC] bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0088FF]" />
                <span>1. Thống Kê Tổng Số Giường &amp; Số Tủ Theo Từng Phân Khu</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp chi tiết số giường ngủ, số tủ cá nhân và tỷ lệ sử dụng tại từng Khu KTX
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {safeZones.length} Khu • {totalBeds} giường • {totalLockers} tủ đồ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#FAFBFC] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E4E8EC]">
                <tr>
                  <th className="py-3 px-4">Khu vực</th>
                  <th className="py-3 px-3 text-center">Số dãy</th>
                  <th className="py-3 px-3 text-center">Tổng phòng</th>
                  <th className="py-3 px-3 text-center">Công nhân</th>
                  {/* Cột Thống kê Giường */}
                  <th className="py-3 px-4 bg-blue-50/50 text-blue-900">
                    <div className="flex items-center gap-1 font-bold">
                      <Bed className="w-3.5 h-3.5 text-blue-600" />
                      <span>Thống kê Giường</span>
                    </div>
                  </th>
                  {/* Cột Thống kê Tủ */}
                  <th className="py-3 px-4 bg-amber-50/50 text-amber-900">
                    <div className="flex items-center gap-1 font-bold">
                      <Box className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thống kê Tủ Đồ</span>
                    </div>
                  </th>
                  <th className="py-3 px-4">Tỷ lệ lấp đầy</th>
                  <th className="py-3 px-4 text-center">Tình trạng phòng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8EC]">
                {zoneStats.map((stat) => (
                  <tr key={stat.zone.id} className="hover:bg-[#F9FAFB] transition-colors">
                    {/* Khu */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm">{stat.zone.name}</div>
                      <div className="text-[11px] text-slate-400">{stat.zone.description || 'Khu KTX'}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold">{stat.blocksCount} dãy</td>
                    <td className="py-3 px-3 text-center">{stat.roomsCount} phòng</td>
                    <td className="py-3 px-3 text-center font-bold text-[#0088FF] text-sm">
                      {stat.workersCount} người
                    </td>

                    {/* Dữ liệu Giường */}
                    <td className="py-3 px-4 bg-blue-50/30">
                      <div className="font-bold text-slate-900">
                        {stat.workersCount} / {stat.bedsCount} <span className="text-[10px] text-slate-500 font-normal">giường</span>
                      </div>
                      <div className="text-[11px] text-[#1E8E3E] font-semibold mt-0.5">
                        Còn trống {stat.availableBeds} giường ({100 - stat.bedOccupancy}%)
                      </div>
                    </td>

                    {/* Dữ liệu Tủ */}
                    <td className="py-3 px-4 bg-amber-50/30">
                      <div className="font-bold text-slate-900">
                        {stat.assignedLockers} / {stat.lockersCount} <span className="text-[10px] text-slate-500 font-normal">cái tủ</span>
                      </div>
                      <div className="text-[11px] text-[#1E8E3E] font-semibold mt-0.5">
                        Còn trống {stat.availableLockers} tủ ({100 - stat.lockerUsage}%)
                      </div>
                    </td>

                    {/* Tiến độ lấp đầy */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold w-9">{stat.bedOccupancy}%</span>
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-[#0088FF] h-1.5 rounded-full" 
                            style={{ width: `${stat.bedOccupancy}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Tình trạng phòng */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {stat.fullRooms > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {stat.fullRooms} đầy
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {stat.availableRooms} còn chỗ
                        </span>
                        {stat.emptyRooms > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                            {stat.emptyRooms} trống
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. BẢNG 2: THỐNG KÊ TỔNG SỐ GIƯỜNG & SỐ TỦ CHI TIẾT TỪNG PHÒNG (ROOM) */}
      {(activeTab === 'both' || activeTab === 'room') && (
        <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-xs overflow-hidden">
          {/* Header Bảng Phòng */}
          <div className="p-3.5 border-b border-[#E4E8EC] bg-[#FAFBFC] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-indigo-600" />
                <span>2. Thống Kê Chi Tiết Giường &amp; Tủ Từng Phòng</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hiển thị số lượng giường đang nằm, giường trống, tủ đã cấp và tủ trống của từng phòng
              </p>
            </div>

            {/* Thanh công cụ lọc phòng */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Lọc theo Khu */}
              <select
                value={selectedZoneFilter}
                onChange={(e) => setSelectedZoneFilter(e.target.value)}
                className="py-1.5 px-2.5 rounded-lg border border-[#D3D5D7] bg-white text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
              >
                <option value="all">Tất cả các Khu ({safeZones.length})</option>
                {safeZones.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>

              {/* Lọc trạng thái phòng */}
              <select
                value={roomStatusFilter}
                onChange={(e) => setRoomStatusFilter(e.target.value as any)}
                className="py-1.5 px-2.5 rounded-lg border border-[#D3D5D7] bg-white text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs"
              >
                <option value="all">Tất cả tình trạng</option>
                <option value="available">Còn chỗ trống</option>
                <option value="full">Đã đầy (20/20)</option>
                <option value="empty">Phòng trống 100%</option>
              </select>

              {/* Tìm kiếm phòng */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm tên phòng..."
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1.5 rounded-lg border border-[#D3D5D7] text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0088FF] w-36 sm:w-44"
                />
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-[#FAFBFC] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E4E8EC] sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-2.5 px-4 bg-[#FAFBFC]">Phòng &amp; Vị trí</th>
                  <th className="py-2.5 px-3 text-center bg-[#FAFBFC]">Sĩ số</th>
                  <th className="py-2.5 px-4 bg-blue-50/70 text-blue-900">
                    <div className="flex items-center gap-1 font-bold">
                      <Bed className="w-3.5 h-3.5 text-blue-600" />
                      <span>Số Giường Ngủ</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-4 bg-amber-50/70 text-amber-900">
                    <div className="flex items-center gap-1 font-bold">
                      <Box className="w-3.5 h-3.5 text-amber-600" />
                      <span>Số Tủ Cá Nhân</span>
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center bg-[#FAFBFC]">Trạng thái</th>
                  <th className="py-2.5 px-3 text-center bg-[#FAFBFC]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E8EC]">
                {filteredRoomStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      Không tìm thấy phòng nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  filteredRoomStats.map((item) => (
                    <tr key={item.room.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Tên phòng & Khu */}
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{item.room.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.zone?.name || 'Khu'} • {item.block?.name || 'Dãy'}
                        </div>
                      </td>

                      {/* Sĩ số */}
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {item.occupiedBeds} người
                      </td>

                      {/* Số Giường */}
                      <td className="py-2.5 px-4 bg-blue-50/20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            {item.occupiedBeds} / {item.bedCount} giường
                          </span>
                          <span className={`text-[11px] font-bold ${
                            item.availBeds === 0 ? 'text-slate-400' : 'text-[#1E8E3E]'
                          }`}>
                            {item.availBeds === 0 ? 'Hết giường' : `Trống ${item.availBeds}`}
                          </span>
                        </div>
                        {/* Mini bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.isFull ? 'bg-slate-500' : item.bedRate >= 80 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${item.bedRate}%` }}
                          />
                        </div>
                      </td>

                      {/* Số Tủ */}
                      <td className="py-2.5 px-4 bg-amber-50/20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900">
                            {item.assignedLockers} / {item.lockerCount} tủ
                          </span>
                          <span className={`text-[11px] font-bold ${
                            item.availLockers === 0 ? 'text-slate-400' : 'text-[#1E8E3E]'
                          }`}>
                            {item.availLockers === 0 ? 'Hết tủ' : `Trống ${item.availLockers}`}
                          </span>
                        </div>
                        {/* Mini bar */}
                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.assignedLockers >= item.lockerCount ? 'bg-slate-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, item.lockerRate)}%` }}
                          />
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-2.5 px-3 text-center">
                        {item.isFull ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Đầy
                          </span>
                        ) : item.isEmpty ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Trống
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF7EE] text-[#1E8E3E] border border-[#BDE8C6]">
                            Còn {item.availBeds} chỗ
                          </span>
                        )}
                      </td>

                      {/* Nút xem chi tiết phòng */}
                      <td className="py-2.5 px-3 text-center">
                        {onSelectRoom && (
                          <button
                            type="button"
                            onClick={() => onSelectRoom(item.room)}
                            className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-[#D3D5D7] text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Xem phòng
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-2.5 border-t border-[#E4E8EC] bg-[#FAFBFC] text-xs text-slate-500 flex items-center justify-between">
            <span>Hiển thị <strong>{filteredRoomStats.length}</strong> / {safeRooms.length} phòng</span>
            <span>Tổng giường: <strong>{filteredRoomStats.reduce((s, i) => s + i.bedCount, 0)}</strong> • Tổng tủ: <strong>{filteredRoomStats.reduce((s, i) => s + i.lockerCount, 0)}</strong></span>
          </div>
        </div>
      )}

      {/* 5. BẢNG 3: PHÂN BỐ THEO TỔ TRƯỞNG */}
      <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E4E8EC] bg-[#FAFBFC]">
          <h3 className="font-bold text-slate-800 text-sm">
            Phân bố nhân sự theo Tổ Trưởng
          </h3>
          <p className="text-xs text-slate-500">
            Tổng hợp số lượng công nhân do từng tổ trưởng phụ trách lưu trú
          </p>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teamLeaderList.map(([leader, count]) => (
            <div key={leader} className="p-3 rounded-lg border border-[#E4E8EC] bg-[#FAFBFC] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#E5F3FF] text-[#0088FF] flex items-center justify-center font-bold text-xs shrink-0">
                  {leader.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{leader}</div>
                  <div className="text-[11px] text-slate-500">Tổ quản lý công nhân</div>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#D3D5D7] text-[#0088FF] shrink-0">
                {count} CN
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
