import React, { useState } from 'react';
import { Plus, Building, Layers, DoorOpen, X, AlertCircle } from 'lucide-react';
import { Zone, Block, Room } from '../types';

interface ManageStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: Zone[];
  onAddZone: (name: string, code: string, description?: string) => void;
  onAddBlock: (zoneId: string, name: string) => void;
  onAddRoom: (zoneId: string, blockId: string, roomName: string, maxCapacity: number, bedCount: number, lockerCount: number, genderType: 'Nam' | 'Nữ' | 'Hỗn hợp') => void;
  onDeleteZone?: (zoneId: string) => void;
}

export const ManageStructureModal: React.FC<ManageStructureModalProps> = ({
  isOpen,
  onClose,
  zones,
  onAddZone,
  onAddBlock,
  onAddRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'zone' | 'block' | 'room'>('zone');

  // Form states - Add Zone
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDesc, setNewZoneDesc] = useState('');

  // Form states - Add Block
  const [selectedZoneForBlock, setSelectedZoneForBlock] = useState(zones[0]?.id || '');
  const [newBlockName, setNewBlockName] = useState('');

  // Form states - Add Room
  const [selectedZoneForRoom, setSelectedZoneForRoom] = useState(zones[0]?.id || '');
  const currentZoneBlocks = zones.find(z => z.id === selectedZoneForRoom)?.blocks || [];
  const [selectedBlockForRoom, setSelectedBlockForRoom] = useState(currentZoneBlocks[0]?.id || '');
  const [newRoomName, setNewRoomName] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [bedCount, setBedCount] = useState(20);
  const [lockerCount, setLockerCount] = useState(20);
  const [genderType, setGenderType] = useState<'Nam' | 'Nữ' | 'Hỗn hợp'>('Nam');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim() || !newZoneCode.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên và mã Khu (VD: Khu E, mã E)' });
      return;
    }

    onAddZone(newZoneName.trim(), newZoneCode.trim().toUpperCase(), newZoneDesc.trim());
    setMessage({ type: 'success', text: `Đã thêm thành công ${newZoneName}!` });
    setNewZoneCode('');
    setNewZoneName('');
    setNewZoneDesc('');
  };

  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneForBlock) {
      setMessage({ type: 'error', text: 'Vui lòng chọn Khu cần thêm Dãy' });
      return;
    }
    if (!newBlockName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên Dãy (VD: Dãy 5, Dãy E1...)' });
      return;
    }

    onAddBlock(selectedZoneForBlock, newBlockName.trim());
    setMessage({ type: 'success', text: `Đã thêm thành công ${newBlockName}!` });
    setNewBlockName('');
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZoneForRoom || !selectedBlockForRoom) {
      setMessage({ type: 'error', text: 'Vui lòng chọn Khu và Dãy cần thêm Phòng' });
      return;
    }
    if (!newRoomName.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên Phòng (VD: Phòng 1, Phòng 2...)' });
      return;
    }

    onAddRoom(
      selectedZoneForRoom,
      selectedBlockForRoom,
      newRoomName.trim(),
      maxCapacity,
      bedCount,
      lockerCount,
      genderType
    );
    setMessage({ type: 'success', text: `Đã thêm thành công ${newRoomName} (Sức chứa ${maxCapacity} người, ${bedCount} giường, ${lockerCount} tủ đồ)!` });
    setNewRoomName('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        id="modal-manage-structure"
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Mở Rộng Ký Túc Xá (Thêm Khu • Dãy • Phòng)
              </h3>
              <p className="text-xs text-slate-400">
                Linh hoạt tạo thêm Khu mới, Dãy nhà mới và Phòng ở theo nhu cầu thực tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab('zone'); setMessage(null); }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'zone'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>+ Thêm Khu Mới</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('block'); setMessage(null); }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'block'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>+ Thêm Dãy Mới</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('room'); setMessage(null); }}
            className={`flex-1 py-2 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'room'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>+ Thêm Phòng Mới</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[75vh] space-y-4">
          {message && (
            <div className={`p-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: THÊM KHU MỚI */}
          {activeTab === 'zone' && (
            <form onSubmit={handleCreateZone} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mã ký hiệu Khu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newZoneCode}
                    onChange={(e) => setNewZoneCode(e.target.value)}
                    placeholder="VD: E, F, G, K1..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên hiển thị Khu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="VD: Khu E (Nhà Ở Chuyên Gia), Khu F..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả / Ghi chú về khu vực này
                </label>
                <input
                  type="text"
                  value={newZoneDesc}
                  onChange={(e) => setNewZoneDesc(e.target.value)}
                  placeholder="VD: Khu lưu trú mới hoàn thành năm 2026..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Xác nhận thêm Khu mới</span>
                </button>
              </div>

              {/* Danh sách các Khu hiện có */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Các Khu hiện tại ({zones.length}):
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {zones.map(z => (
                    <div key={z.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800">{z.name}</div>
                      <div className="text-slate-500 text-[11px]">{z.blocks.length} dãy nhà</div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: THÊM DÃY MỚI */}
          {activeTab === 'block' && (
            <form onSubmit={handleCreateBlock} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chọn Khu để thêm Dãy <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedZoneForBlock}
                  onChange={(e) => setSelectedZoneForBlock(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer font-bold"
                >
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name} (Đang có {z.blocks.length} dãy)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Dãy mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  placeholder="VD: Dãy 4, Dãy 5, Dãy Mở Rộng..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-medium"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Xác nhận thêm Dãy</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: THÊM PHÒNG MỚI */}
          {activeTab === 'room' && (
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn Khu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedZoneForRoom}
                    onChange={(e) => {
                      setSelectedZoneForRoom(e.target.value);
                      const targetZ = zones.find(z => z.id === e.target.value);
                      if (targetZ && targetZ.blocks.length > 0) {
                        setSelectedBlockForRoom(targetZ.blocks[0].id);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chọn Dãy <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedBlockForRoom}
                    onChange={(e) => setSelectedBlockForRoom(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    {currentZoneBlocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (Đang có {b.rooms?.length || 0} phòng)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Phòng mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="VD: Phòng 1, Phòng 2, Phòng VIP 1..."
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phân loại đối tượng phòng
                  </label>
                  <select
                    value={genderType}
                    onChange={(e) => setGenderType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer"
                  >
                    <option value="Nam">Phòng Nam</option>
                    <option value="Nữ">Phòng Nữ</option>
                    <option value="Hỗn hợp">Phòng Kỹ thuật / Hỗn hợp</option>
                  </select>
                </div>
              </div>

              {/* Tùy chỉnh Sức chứa & Số giường & Tủ đồ */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Cấu hình Quy chuẩn Trang thiết bị Phòng:
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Sức chứa tối đa
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-blue-700 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Tối đa 20 người</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Số giường ngủ
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bedCount}
                      onChange={(e) => setBedCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">1 - 20 giường</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Số tủ đồ cá nhân
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={lockerCount}
                      onChange={(e) => setLockerCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Tùy chọn</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Xác nhận thêm Phòng</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
