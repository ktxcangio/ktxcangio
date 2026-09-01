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
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng công nhân đang ở</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 sm:mt-2">
            {totalWorkers} <span className="text-xs sm:text-sm font-normal text-slate-500">người</span>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-blue-600 font-bold">Nam: {maleCount}</span>
            <span>•</span>
            <span className="text-rose-600 font-bold">Nữ: {femaleCount}</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số phòng KTX</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 sm:mt-2">
            {rooms.length} <span className="text-xs sm:text-sm font-normal text-slate-500">phòng</span>
          </div>
          <div className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">
            {zones.length} Khu • Tối đa 20 người/phòng
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Trống / Tổng số chỗ</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1.5 sm:mt-2">
            {availableBeds} / {totalBeds} <span className="text-xs sm:text-sm font-normal text-slate-500">chỗ</span>
          </div>
          <div className="text-[11px] sm:text-xs text-emerald-700 font-medium mt-1 truncate flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Sẵn sàng tiếp nhận thêm
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ lấp đầy</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 sm:mt-2">
            {overallOccupancy}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full" 
              style={{ width: `${overallOccupancy}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Báo cáo từng Khu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
            Báo cáo Tình trạng Ký Túc Xá Theo Phân Khu (Khu A, B, C, D...)
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Chi tiết số dãy, số phòng và tỷ lệ cư trú tại từng phân khu
          </p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-100 text-slate-700 font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Khu vực</th>
                <th className="py-3.5 px-4">Số dãy</th>
                <th className="py-3.5 px-4">Tổng số phòng</th>
                <th className="py-3.5 px-4">Công nhân hiện tại</th>
                <th className="py-3.5 px-4">Tổng số chỗ</th>
                <th className="py-3.5 px-4">Còn trống</th>
                <th className="py-3.5 px-4">Tỷ lệ lấp đầy</th>
                <th className="py-3.5 px-4 text-center">Phòng đầy (20/20)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {zoneStats.map((stat) => (
                <tr key={stat.zone.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{stat.zone.name}</div>
                    <div className="text-xs text-slate-500">{stat.zone.description}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold">{stat.zone.blocks.length} Dãy</td>
                  <td className="py-3 px-4 font-semibold">{stat.roomsCount} Phòng</td>
                  <td className="py-3 px-4 font-bold text-blue-600">{stat.workersCount} người</td>
                  <td className="py-3 px-4 text-slate-600">{stat.bedsCount} chỗ</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">{stat.bedsCount - stat.workersCount} chỗ</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{stat.occupancy}%</span>
                      <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${stat.occupancy}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {stat.fullRooms} phòng
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards for Zones */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {zoneStats.map((stat) => (
            <div key={stat.zone.id} className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{stat.zone.name}</h4>
                  <span className="text-[11px] text-slate-500">{stat.zone.blocks.length} Dãy • {stat.roomsCount} Phòng</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  stat.occupancy >= 90 ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {stat.occupancy}% lấp đầy
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-slate-400 text-[10px]">Đang ở</div>
                  <div className="font-bold text-blue-600 text-sm">{stat.workersCount}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-slate-400 text-[10px]">Còn trống</div>
                  <div className="font-bold text-emerald-600 text-sm">{stat.bedsCount - stat.workersCount}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <div className="text-slate-400 text-[10px]">Phòng 20/20</div>
                  <div className="font-bold text-rose-600 text-sm">{stat.fullRooms}</div>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className="bg-blue-600 h-1.5 rounded-full"
                  style={{ width: `${stat.occupancy}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phân bổ theo Tổ trưởng */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">Phân Bổ Nhân Viên Theo Tổ Trưởng</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {teamLeaderList.map(([leader, count]) => {
            const pct = totalWorkers > 0 ? Math.round((count / totalWorkers) * 100) : 0;
            return (
              <div key={leader} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 truncate">{leader}</span>
                  <span className="text-blue-700 font-bold">{count} người</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
