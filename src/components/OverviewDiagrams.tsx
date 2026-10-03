import React from 'react';
import { 
  Building2, 
  Building, 
  Users, 
  Bed, 
  Layers, 
  ArrowRight, 
  PieChart, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FileSpreadsheet, 
  DoorClosed, 
  DoorOpen,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  ChevronRight,
  FolderTree,
  Trash2
} from 'lucide-react';
import { Zone, Room, Worker } from '../types';
import { DeleteZoneModal } from './DeleteZoneModal';

interface OverviewDiagramsProps {
  zones: Zone[];
  rooms: Room[];
  workers: Worker[];
  onSelectZone: (zoneId: string) => void;
  onOpenAddWorker?: () => void;
  onExportCSV?: () => void;
  onOpenStructureManager?: () => void;
  onDeleteZone?: (zoneId: string, workerHandling: 'unassign' | 'delete') => Promise<void> | void;
}

export const OverviewDiagrams: React.FC<OverviewDiagramsProps> = ({
  zones = [],
  rooms = [],
  workers = [],
  onSelectZone,
  onOpenAddWorker,
  onExportCSV,
  onOpenStructureManager,
  onDeleteZone,
}) => {
  const [zoneToDelete, setZoneToDelete] = React.useState<Zone | null>(null);
  const safeWorkers = workers || [];
  const safeRooms = rooms || [];
  const safeZones = zones || [];

  // 1. Số liệu tổng quan toàn bộ KTX
  const totalBeds = safeRooms.reduce((sum, r) => sum + (r.bedCount || 20), 0);
  const totalWorkers = safeWorkers.length;
  const overallOccupancy = totalBeds > 0 ? Math.round((totalWorkers / totalBeds) * 100) : 0;
  const availableBeds = Math.max(0, totalBeds - totalWorkers);

  const maleCount = safeWorkers.filter(w => w.gender === 'Nam').length;
  const femaleCount = safeWorkers.filter(w => w.gender === 'Nữ').length;
  const malePercent = totalWorkers > 0 ? Math.round((maleCount / totalWorkers) * 100) : 0;
  const femalePercent = totalWorkers > 0 ? (100 - malePercent) : 0;

  // 2. Thống kê theo tình trạng phòng toàn KTX
  let totalFullRooms = 0;
  let totalEmptyRooms = 0;
  let totalAvailableRooms = 0;

  safeRooms.forEach(r => {
    const count = safeWorkers.filter(w => w.roomId === r.id).length;
    const maxCap = r.maxCapacity || 20;
    if (count >= maxCap) totalFullRooms++;
    else if (count === 0) totalEmptyRooms++;
    else totalAvailableRooms++;
  });

  const fullRoomPercent = safeRooms.length > 0 ? Math.round((totalFullRooms / safeRooms.length) * 100) : 0;
  const emptyRoomPercent = safeRooms.length > 0 ? Math.round((totalEmptyRooms / safeRooms.length) * 100) : 0;
  const availRoomPercent = Math.max(0, 100 - fullRoomPercent - emptyRoomPercent);

  // 3. Số liệu chi tiết từng Khu
  const zoneStats = safeZones.map((zone) => {
    const zoneRooms = safeRooms.filter(r => r.zoneId === zone.id);
    const zoneWorkers = safeWorkers.filter(w => w.zoneId === zone.id);
    const zoneBeds = zoneRooms.reduce((sum, r) => sum + (r.bedCount || 20), 0);
    const occupancy = zoneBeds > 0 ? Math.round((zoneWorkers.length / zoneBeds) * 100) : 0;
    
    let fullRooms = 0;
    let emptyRooms = 0;
    let availRooms = 0;

    zoneRooms.forEach(r => {
      const count = safeWorkers.filter(w => w.roomId === r.id).length;
      const maxCap = r.maxCapacity || 20;
      if (count >= maxCap) fullRooms++;
      else if (count === 0) emptyRooms++;
      else availRooms++;
    });

    const zoneMale = zoneWorkers.filter(w => w.gender === 'Nam').length;
    const zoneFemale = zoneWorkers.filter(w => w.gender === 'Nữ').length;

    return {
      zone,
      blocksCount: zone.blocks?.length || 0,
      roomsCount: zoneRooms.length,
      workersCount: zoneWorkers.length,
      bedsCount: zoneBeds,
      availableBeds: Math.max(0, zoneBeds - zoneWorkers.length),
      occupancy,
      fullRooms,
      emptyRooms,
      availRooms,
      zoneMale,
      zoneFemale,
      blocks: zone.blocks || []
    };
  });

  // 4. Phân bố theo Phân xưởng sản xuất
  const deptMap = new Map<string, number>();
  safeWorkers.forEach(w => {
    const dept = w.department || 'Chưa gán xưởng';
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
  });
  const deptList = Array.from(deptMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // 5. Phân bố theo Tổ trưởng
  const leaderMap = new Map<string, { count: number; phone?: string }>();
  safeWorkers.forEach(w => {
    const leader = w.teamLeaderName || 'Chưa phân tổ';
    const existing = leaderMap.get(leader);
    if (existing) {
      existing.count += 1;
      if (!existing.phone && w.teamLeaderPhone) existing.phone = w.teamLeaderPhone;
    } else {
      leaderMap.set(leader, { count: 1, phone: w.teamLeaderPhone });
    }
  });
  const leaderList = Array.from(leaderMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  return (
    <div className="space-y-4 pb-12">
      {/* 1. Thanh tiêu đề tối giản, sạch đẹp */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tổng quan Ký túc xá</span>
            <span className="text-xs font-normal text-slate-500">· {zones.length} Phân khu</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chọn khu bất kỳ bên dưới để xem sơ đồ phòng chi tiết
          </p>
        </div>

        {onOpenStructureManager && (
          <button
            onClick={onOpenStructureManager}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FolderTree className="w-3.5 h-3.5 text-slate-500" />
            <span>Cấu hình Khu - Dãy</span>
          </button>
        )}
      </div>

      {/* 2. Top 4 Sapo KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Tổng công nhân */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-2xs hover:shadow-xs transition-shadow">
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
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng số phòng KTX</span>
            <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {rooms.length} <span className="text-xs font-normal text-slate-500">phòng</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {zones.length} Phân khu • Quy chuẩn 20 giường/phòng
          </div>
        </div>

        {/* Card 3: Chỗ giường còn trống */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giường còn trống</span>
            <div className="w-8 h-8 rounded-md bg-[#EBF7EE] text-[#1E8E3E] flex items-center justify-center shrink-0">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1E8E3E] mt-2">
            {availableBeds} / {totalBeds} <span className="text-xs font-normal text-slate-500">chỗ</span>
          </div>
          <div className="text-xs text-[#1E8E3E] font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Sẵn sàng tiếp nhận thêm nhân sự
          </div>
        </div>

        {/* Card 4: Tỷ lệ lấp đầy toàn bộ */}
        <div className="bg-white p-4 rounded-lg border border-[#E4E8EC] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ lấp đầy KTX</span>
            <div className="w-8 h-8 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {overallOccupancy}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                overallOccupancy > 90 ? 'bg-red-500' : overallOccupancy > 75 ? 'bg-amber-500' : 'bg-[#0088FF]'
              }`}
              style={{ width: `${overallOccupancy}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. SƠ ĐỒ TRỰC QUAN CÁC PHÂN KHU (Bấm vào thẻ Khu để mở sơ đồ khu đó) */}
      <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-[#E4E8EC] bg-[#FAFBFC] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#E5F3FF] text-[#0088FF] flex items-center justify-center font-bold text-xs">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span>Sơ đồ các Phân Khu KTX</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5F3FF] text-[#0088FF] font-semibold lowercase">
                  {zones.length} khu
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Nhấn vào thẻ Khu bất kỳ để vào xem sơ đồ chi tiết các dãy và phòng của khu đó
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Dưới 80% (Còn nhiều)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>80 - 95%</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>&gt; 95% (Gần đầy)</span>
            </span>
          </div>
        </div>

        {/* Danh sách Thẻ Phân Khu Tương Tác */}
        <div className="p-3.5 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {zoneStats.map((stat) => {
            const z = stat.zone;
            const isHighOccupancy = stat.occupancy > 90;
            const isMediumOccupancy = stat.occupancy >= 75 && stat.occupancy <= 90;

            return (
              <div
                key={z.id}
                onClick={() => onSelectZone(z.id)}
                className="group relative bg-[#FAFBFC] hover:bg-white rounded-lg border border-[#D3D5D7] hover:border-[#0088FF] p-4 sm:p-5 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                {/* Header Thẻ Khu */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#182538] text-white flex items-center justify-center font-black text-sm group-hover:bg-[#0088FF] transition-colors shadow-2xs shrink-0">
                        {z.code || z.name.replace('Khu ', '')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0088FF] transition-colors">
                            {z.name}
                          </h3>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {stat.blocksCount} Dãy
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {z.description || 'Ký túc xá công nhân'}
                        </p>
                      </div>
                    </div>

                    {/* Huy hiệu % lấp đầy & Nút xóa Khu */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                        isHighOccupancy 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : isMediumOccupancy
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-[#EBF7EE] text-[#1E8E3E] border border-green-200'
                      }`}>
                        {stat.occupancy}% lấp đầy
                      </span>

                      {onDeleteZone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoneToDelete(z);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title={`Xóa ${z.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Thanh tiến độ lấp đầy Khu */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Công nhân: <strong className="text-slate-900 font-bold">{stat.workersCount}</strong> / {stat.bedsCount} chỗ
                      </span>
                      <span className="text-[#1E8E3E] font-semibold">
                        Còn trống {stat.availableBeds} chỗ
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          isHighOccupancy ? 'bg-red-500' : isMediumOccupancy ? 'bg-amber-500' : 'bg-[#0088FF]'
                        }`}
                        style={{ width: `${Math.min(100, stat.occupancy)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Chi tiết tình trạng các phòng trong Khu */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center">
                    <div className="bg-white p-2 rounded border border-[#E4E8EC]">
                      <div className="text-[11px] text-slate-500">Phòng đầy (20/20)</div>
                      <div className="text-sm font-bold text-red-600 mt-0.5">{stat.fullRooms} phòng</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#E4E8EC]">
                      <div className="text-[11px] text-slate-500">Phòng còn chỗ</div>
                      <div className="text-sm font-bold text-[#0088FF] mt-0.5">{stat.availRooms} phòng</div>
                    </div>
                    <div className="bg-white p-2 rounded border border-[#E4E8EC]">
                      <div className="text-[11px] text-slate-500">Phòng trống 100%</div>
                      <div className="text-sm font-bold text-[#1E8E3E] mt-0.5">{stat.emptyRooms} phòng</div>
                    </div>
                  </div>

                  {/* Danh sách các Dãy trong Khu */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-400">Các dãy:</span>
                    {stat.blocks.map(b => (
                      <span key={b.id} className="text-[11px] font-medium px-2 py-0.5 rounded bg-white border border-[#D3D5D7] text-slate-700">
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer nút hành động: Nhấn để xem sơ đồ Khu */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Nam: <strong className="text-slate-800">{stat.zoneMale}</strong></span>
                    <span>•</span>
                    <span>Nữ: <strong className="text-slate-800">{stat.zoneFemale}</strong></span>
                  </div>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#0088FF] group-hover:text-[#0070E0] group-hover:translate-x-0.5 transition-all">
                    <span>Xem sơ đồ {z.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SƠ ĐỒ SO SÁNH LẤP ĐẦY & CƠ CẤU NHÂN SỰ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Biểu đồ so sánh trực quan các Khu (8 cột) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-[#E4E8EC] shadow-2xs overflow-hidden">
          <div className="p-3.5 border-b border-[#E4E8EC] bg-[#FAFBFC] flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Sơ đồ so sánh Tỷ lệ Lấp đầy giữa các Phân Khu
              </h3>
              <p className="text-xs text-slate-500">
                Tỷ lệ phần trăm chỗ ở đã phân bổ trên tổng công suất thiết kế
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="p-4 space-y-3.5">
            {zoneStats.map((stat) => (
              <div key={stat.zone.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => onSelectZone(stat.zone.id)}
                    className="font-bold text-slate-800 hover:text-[#0088FF] flex items-center gap-1.5 cursor-pointer text-left"
                  >
                    <span>{stat.zone.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({stat.roomsCount} phòng)</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">
                      {stat.workersCount}/{stat.bedsCount} CN
                    </span>
                    <span className="font-bold text-[#0088FF] w-10 text-right">
                      {stat.occupancy}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex cursor-pointer" onClick={() => onSelectZone(stat.zone.id)}>
                  <div 
                    className="bg-[#0088FF] h-3 rounded-l-full transition-all duration-500" 
                    style={{ width: `${stat.occupancy}%` }}
                    title={`Đang ở: ${stat.workersCount} công nhân`}
                  ></div>
                  <div 
                    className="bg-emerald-100 h-3 transition-all duration-500" 
                    style={{ width: `${100 - stat.occupancy}%` }}
                    title={`Còn trống: ${stat.availableBeds} chỗ`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Biểu đồ Cơ cấu Giới tính & Tình trạng Phòng (5 cột) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card: Cơ cấu Giới tính */}
          <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-2xs p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Cơ cấu Giới tính Công nhân KTX
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Tỷ lệ nam và nữ đang lưu trú toàn bộ các khu
            </p>

            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex mb-3">
              <div 
                className="bg-[#0088FF] h-4 text-[10px] font-bold text-white flex items-center justify-center transition-all duration-500"
                style={{ width: `${malePercent}%` }}
              >
                {malePercent > 15 ? `${malePercent}%` : ''}
              </div>
              <div 
                className="bg-pink-500 h-4 text-[10px] font-bold text-white flex items-center justify-center transition-all duration-500"
                style={{ width: `${femalePercent}%` }}
              >
                {femalePercent > 15 ? `${femalePercent}%` : ''}
              </div>
            </div>

            <div className="flex items-center justify-around text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-[#0088FF]"></span>
                <span className="font-medium text-slate-700">Nam: <strong>{maleCount}</strong> ({malePercent}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-pink-500"></span>
                <span className="font-medium text-slate-700">Nữ: <strong>{femaleCount}</strong> ({femalePercent}%)</span>
              </div>
            </div>
          </div>

          {/* Card: Tình trạng Phòng KTX */}
          <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-2xs p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              Tình trạng Phân bổ Phòng KTX
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Tổng số {rooms.length} phòng trên toàn bộ hệ thống
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  Phòng đầy (20/20)
                </span>
                <span className="font-bold text-slate-800">{totalFullRooms} phòng ({fullRoomPercent}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0088FF]"></span>
                  Phòng đang ở còn chỗ
                </span>
                <span className="font-bold text-slate-800">{totalAvailableRooms} phòng ({availRoomPercent}%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Phòng trống hoàn toàn
                </span>
                <span className="font-bold text-slate-800">{totalEmptyRooms} phòng ({emptyRoomPercent}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BẢNG TỔNG HỢP CHI TIẾT SỐ LIỆU PHÂN KHU (Bấm vào dòng để vào Khu) */}
      <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-2xs overflow-hidden">
        <div className="p-3.5 border-b border-[#E4E8EC] bg-[#FAFBFC] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Bảng Tổng hợp Số liệu Chi tiết Từng Phân Khu
            </h3>
            <p className="text-xs text-slate-500">
              Nhấp vào dòng bất kỳ hoặc nút "Xem sơ đồ" để chuyển sang giao diện phòng của khu đó
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {zones.length} Khu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#FAFBFC] text-slate-600 font-bold uppercase tracking-wider border-b border-[#E4E8EC]">
              <tr>
                <th className="py-3 px-4">Khu vực</th>
                <th className="py-3 px-4">Số dãy</th>
                <th className="py-3 px-4">Tổng số phòng</th>
                <th className="py-3 px-4">Công nhân hiện tại</th>
                <th className="py-3 px-4">Tổng sức chứa</th>
                <th className="py-3 px-4">Chỗ còn trống</th>
                <th className="py-3 px-4">Tỷ lệ lấp đầy</th>
                <th className="py-3 px-4 text-center">Phòng đầy (20/20)</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E8EC]">
              {zoneStats.map((stat) => (
                <tr 
                  key={stat.zone.id} 
                  onClick={() => onSelectZone(stat.zone.id)}
                  className="hover:bg-[#F0F7FF] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 group-hover:text-[#0088FF] transition-colors">
                      {stat.zone.name}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{stat.zone.description}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{stat.blocksCount} dãy</td>
                  <td className="py-3 px-4 text-slate-800">{stat.roomsCount} phòng</td>
                  <td className="py-3 px-4 font-bold text-[#0088FF]">{stat.workersCount} người</td>
                  <td className="py-3 px-4 text-slate-800">{stat.bedsCount} chỗ</td>
                  <td className="py-3 px-4 text-[#1E8E3E] font-semibold">{stat.availableBeds} chỗ</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold w-9">{stat.occupancy}%</span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectZone(stat.zone.id);
                        }}
                        className="px-2.5 py-1 rounded bg-[#E5F3FF] hover:bg-[#0088FF] text-[#0088FF] hover:text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem sơ đồ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {onDeleteZone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoneToDelete(stat.zone);
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={`Xóa ${stat.zone.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Phân bố theo Phân xưởng & Tổ trưởng */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phân xưởng sản xuất */}
        <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-2xs p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4E8EC]">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#0088FF]" />
              <span>Phân bố theo Phân xưởng</span>
            </h3>
            <span className="text-xs text-slate-500">{deptList.length} xưởng</span>
          </div>

          <div className="space-y-2">
            {deptList.map(([dept, count]) => {
              const pct = totalWorkers > 0 ? Math.round((count / totalWorkers) * 100) : 0;
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{dept}</span>
                    <span className="font-bold text-slate-900">{count} CN ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[#0088FF] h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tổ trưởng phụ trách */}
        <div className="bg-white rounded-lg border border-[#E4E8EC] shadow-2xs p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E4E8EC]">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Phân bố theo Tổ Trưởng</span>
            </h3>
            <span className="text-xs text-slate-500">{leaderList.length} tổ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {leaderList.map(([leader, data]) => (
              <div key={leader} className="p-2.5 rounded border border-[#E4E8EC] bg-[#FAFBFC] flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">{leader}</div>
                  <div className="text-[11px] text-slate-500 truncate">{data.phone || 'Tổ quản lý KTX'}</div>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-white border border-[#D3D5D7] text-[#0088FF] shrink-0">
                  {data.count} CN
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal xác nhận xóa Khu KTX */}
      {zoneToDelete && (
        <DeleteZoneModal
          isOpen={!!zoneToDelete}
          zone={zoneToDelete}
          workers={safeWorkers}
          onClose={() => setZoneToDelete(null)}
          onConfirmDelete={async (zoneId, workerHandling) => {
            if (onDeleteZone) {
              await onDeleteZone(zoneId, workerHandling);
            }
            setZoneToDelete(null);
          }}
        />
      )}
    </div>
  );
};
