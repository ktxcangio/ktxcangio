import React from 'react';
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
  UserCheck
} from 'lucide-react';

interface StatsDashboardProps {
  workers: Worker[];
  zones: Zone[];
  rooms: Room[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  workers = [],
  zones = [],
  rooms = [],
}) => {
  const safeWorkers = workers || [];
  const safeRooms = rooms || [];
  const safeZones = zones || [];

  // Tính tổng giường dựa trên cấu hình phòng (hoặc mặc định 20)
  const totalBeds = safeRooms.reduce((sum, r) => sum + (r.bedCount || 20), 0);
  const totalWorkers = safeWorkers.length;
  const overallOccupancy = totalBeds > 0 ? Math.round((totalWorkers / totalBeds) * 100) : 0;
  const availableBeds = Math.max(0, totalBeds - totalWorkers);

  // Thống kê theo Khu
  const zoneStats = safeZones.map((zone) => {
    const zoneRooms = safeRooms.filter(r => r.zoneId === zone.id);
    const zoneWorkers = safeWorkers.filter(w => w.zoneId === zone.id);
    const zoneBeds = zoneRooms.reduce((sum, r) => sum + (r.bedCount || 20), 0);
    const occupancy = zoneBeds > 0 ? Math.round((zoneWorkers.length / zoneBeds) * 100) : 0;
    
    // Đếm số phòng đầy và phòng còn chỗ
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
      roomsCount: zoneRooms.length,
      workersCount: zoneWorkers.length,
      bedsCount: zoneBeds,
      occupancy,
      fullRooms,
      emptyRooms,
      availableRooms: Math.max(0, zoneRooms.length - fullRooms - emptyRooms),
    };
  });

  // Thống kê theo Tổ trưởng
  const teamLeaderMap = new Map<string, number>();
  safeWorkers.forEach(w => {
    const leader = w.teamLeaderName || 'Chưa gán tổ';
    teamLeaderMap.set(leader, (teamLeaderMap.get(leader) || 0) + 1);
  });
  const teamLeaderList = Array.from(teamLeaderMap.entries()).sort((a, b) => b[1] - a[1]);

  // Giới tính
  const maleCount = safeWorkers.filter(w => w.gender === 'Nam').length;
  const femaleCount = safeWorkers.filter(w => w.gender === 'Nữ').length;

  return (
    <div className="space-y-4 pb-12">
      {/* Sapo Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            {zones.length} Phân khu • 20 người / phòng
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chỗ còn trống</span>
            <div className="w-8 h-8 rounded-md bg-[#EBF7EE] text-[#1E8E3E] flex items-center justify-center shrink-0">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E8E3E] mt-2">
            {availableBeds} / {totalBeds} <span className="text-xs font-normal text-slate-500">giường</span>
          </div>
          <div className="text-xs text-[#1E8E3E] font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Sẵn sàng tiếp nhận thêm
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ lấp đầy</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {overallOccupancy}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-[#0088FF] h-1.5 rounded-full" 
              style={{ width: `${overallOccupancy}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Sapo Report Table: Báo cáo từng Khu */}
      <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E4E8EC] bg-[#FAFBFC]">
          <h3 className="font-bold text-slate-800 text-sm">
            Báo cáo Tình trạng KTX Theo Phân Khu (Khu A, B, C, D...)
          </h3>
          <p className="text-xs text-slate-500">
            Chi tiết số dãy, số phòng và tỷ lệ cư trú tại từng phân khu
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#FAFBFC] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E4E8EC]">
              <tr>
                <th className="py-3 px-4">Khu vực</th>
                <th className="py-3 px-4">Số dãy</th>
                <th className="py-3 px-4">Tổng số phòng</th>
                <th className="py-3 px-4">Công nhân hiện tại</th>
                <th className="py-3 px-4">Tổng số chỗ</th>
                <th className="py-3 px-4">Còn trống</th>
                <th className="py-3 px-4">Tỷ lệ lấp đầy</th>
                <th className="py-3 px-4 text-center">Phòng đầy (20/20)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8EC]">
              {zoneStats.map((stat) => (
                <tr key={stat.zone.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{stat.zone.name}</div>
                    <div className="text-[11px] text-slate-400">{stat.zone.description}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold">{stat.zone.blocks?.length || 0} dãy</td>
                  <td className="py-3 px-4">{stat.roomsCount} phòng</td>
                  <td className="py-3 px-4 font-bold text-[#0088FF]">{stat.workersCount} người</td>
                  <td className="py-3 px-4">{stat.bedsCount} chỗ</td>
                  <td className="py-3 px-4 text-[#1E8E3E] font-semibold">{Math.max(0, stat.bedsCount - stat.workersCount)} chỗ</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-9">{stat.occupancy}%</span>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-[#0088FF] h-1.5 rounded-full" 
                          style={{ width: `${stat.occupancy}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {stat.fullRooms} phòng
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sapo Report Table: Phân bố theo Tổ trưởng */}
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
