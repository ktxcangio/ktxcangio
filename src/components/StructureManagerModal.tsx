import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Bed, 
  Plus, 
  Trash2, 
  X, 
  Save, 
  AlertCircle,
  FolderPlus,
  Layers,
  DoorOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Zone, Block, Room, Worker } from '../types';
import { generateInitialRooms } from '../data/dormitoryData';

interface StructureManagerModalProps {
  isOpen: boolean;
  zones: Zone[];
  workers?: Worker[];
  onClose: () => void;
  onSaveZones: (newZones: Zone[], deletedZoneIds?: string[]) => Promise<void> | void;
}

export const StructureManagerModal: React.FC<StructureManagerModalProps> = ({
  isOpen,
  zones = [],
  workers = [],
  onClose,
  onSaveZones,
}) => {
  const [currentZones, setCurrentZones] = useState<Zone[]>(zones);
  const [deletedZoneIds, setDeletedZoneIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'zone' | 'block' | 'room'>('zone');
  
  // Selected IDs for hierarchical editing
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || '');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  // Form states - Add Zone
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCode, setNewZoneCode] = useState('');
  const [newZoneDescription, setNewZoneDescription] = useState('');
  const [initialBlockCount, setInitialBlockCount] = useState<number>(1);
  const [initialRoomsPerBlock, setInitialRoomsPerBlock] = useState<number>(15);
  const [initialGender, setInitialGender] = useState<'Nam' | 'Nữ' | 'Hỗn hợp'>('Nam');

  // Form states - Add Block
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockRoomCount, setNewBlockRoomCount] = useState<number>(15);
  const [newBlockGender, setNewBlockGender] = useState<'Nam' | 'Nữ' | 'Hỗn hợp'>('Nam');

  // Form states - Add Room
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(20);
  const [newRoomBedCount, setNewRoomBedCount] = useState<number>(20);
  const [newRoomLockerCount, setNewRoomLockerCount] = useState<number>(20);
  const [newRoomGender, setNewRoomGender] = useState<'Nam' | 'Nữ' | 'Hỗn hợp'>('Nam');

  // Feedback banner state
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  // Sync internal state if zones prop changes when reopening
  React.useEffect(() => {
    if (isOpen) {
      setCurrentZones(zones);
      setDeletedZoneIds([]);
      if (zones.length > 0 && !selectedZoneId) {
        setSelectedZoneId(zones[0].id);
      }
      setAlertMessage(null);
    }
  }, [isOpen, zones]);

  const activeZone = useMemo(() => {
    return currentZones.find(z => z.id === selectedZoneId) || currentZones[0];
  }, [currentZones, selectedZoneId]);

  const activeBlocks = useMemo(() => {
    return activeZone?.blocks || [];
  }, [activeZone]);

  const activeBlock = useMemo(() => {
    if (!activeBlocks.length) return null;
    return activeBlocks.find(b => b.id === selectedBlockId) || activeBlocks[0];
  }, [activeBlocks, selectedBlockId]);

  const activeRooms = useMemo(() => {
    if (!activeBlock) return [];
    if (activeBlock.rooms && activeBlock.rooms.length > 0) {
      return activeBlock.rooms;
    }
    // Fallback generate if empty
    return generateInitialRooms(
      activeZone?.id || 'zone-a',
      activeBlock.id,
      activeZone?.code || 'A',
      activeBlock.blockNumber || 1,
      15,
      'Nam'
    );
  }, [activeZone, activeBlock]);

  // Helper counts workers in a zone
  const getZoneWorkers = (zoneId: string) => {
    return workers.filter(w => w.zoneId === zoneId);
  };

  // Helper counts workers in a block
  const getBlockWorkers = (blockId: string) => {
    return workers.filter(w => w.blockId === blockId);
  };

  // Helper counts workers in a room
  const getRoomWorkers = (roomId: string) => {
    return workers.filter(w => w.roomId === roomId);
  };

  if (!isOpen) return null;

  // ==================== 1. THÊM & XÓA KHU (ZONE) ====================
  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim() || !newZoneCode.trim()) {
      setAlertMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ Tên Khu và Mã Khu' });
      return;
    }

    const cleanCode = newZoneCode.trim().toUpperCase();
    const zoneId = `zone-${cleanCode.toLowerCase()}`;

    if (currentZones.some(z => z.code === cleanCode || z.id === zoneId)) {
      setAlertMessage({ type: 'error', text: `Mã Khu "${cleanCode}" đã tồn tại! Vui lòng chọn ký hiệu mã khác.` });
      return;
    }

    const createdBlocks: Block[] = [];
    const blockCount = Math.max(1, Math.min(20, initialBlockCount));
    const roomsPerBlock = Math.max(1, Math.min(50, initialRoomsPerBlock));

    for (let b = 1; b <= blockCount; b++) {
      const blockId = `block-${cleanCode.toLowerCase()}-${b}`;
      createdBlocks.push({
        id: blockId,
        zoneId: zoneId,
        name: `Dãy ${b}`,
        blockNumber: b,
        rooms: generateInitialRooms(zoneId, blockId, cleanCode, b, roomsPerBlock, initialGender)
      });
    }

    const newZone: Zone = {
      id: zoneId,
      code: cleanCode,
      name: newZoneName.trim(),
      description: newZoneDescription.trim() || `Ký túc xá Khu ${cleanCode}`,
      blocks: createdBlocks
    };

    const updated = [...currentZones, newZone];
    setCurrentZones(updated);
    setSelectedZoneId(zoneId);
    setNewZoneName('');
    setNewZoneCode('');
    setNewZoneDescription('');
    setIsAddingZone(false);
    setAlertMessage({ type: 'success', text: `Đã thêm Khu mới "${newZone.name}" với ${blockCount} Dãy và ${blockCount * roomsPerBlock} Phòng!` });
  };

  const handleDeleteZone = (zoneToDelete: Zone) => {
    const occupants = getZoneWorkers(zoneToDelete.id);
    if (occupants.length > 0) {
      const warningText = `Khu "${zoneToDelete.name}" hiện đang có ${occupants.length} công nhân đang cư trú! Bạn có chắc chắn muốn xóa không? (Nên chuyển phòng cho công nhân trước khi xóa).`;
      if (!window.confirm(warningText)) return;
    } else {
      if (!window.confirm(`Xác nhận xóa "${zoneToDelete.name}" và toàn bộ các Dãy, Phòng trực thuộc?`)) return;
    }

    const updated = currentZones.filter(z => z.id !== zoneToDelete.id);
    setCurrentZones(updated);
    setDeletedZoneIds(prev => [...prev, zoneToDelete.id]);
    
    if (selectedZoneId === zoneToDelete.id) {
      setSelectedZoneId(updated[0]?.id || '');
    }
    setAlertMessage({ type: 'success', text: `Đã xóa "${zoneToDelete.name}" khỏi danh sách.` });
  };

  // ==================== 2. THÊM & XÓA DÃY (BLOCK) ====================
  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeZone) {
      setAlertMessage({ type: 'error', text: 'Vui lòng chọn Khu trước khi thêm Dãy' });
      return;
    }
    if (!newBlockName.trim()) {
      setAlertMessage({ type: 'error', text: 'Vui lòng nhập tên Dãy (VD: Dãy 1, Dãy 2...)' });
      return;
    }

    const nextBlockNum = (activeZone.blocks?.length || 0) + 1;
    const blockId = `block-${activeZone.code.toLowerCase()}-${Date.now()}`;
    const roomCount = Math.max(1, Math.min(50, Number(newBlockRoomCount) || 15));

    const newBlock: Block = {
      id: blockId,
      zoneId: activeZone.id,
      name: newBlockName.trim(),
      blockNumber: nextBlockNum,
      rooms: generateInitialRooms(
        activeZone.id,
        blockId,
        activeZone.code,
        nextBlockNum,
        roomCount,
        newBlockGender
      )
    };

    const updated = currentZones.map(z => {
      if (z.id === activeZone.id) {
        return {
          ...z,
          blocks: [...(z.blocks || []), newBlock]
        };
      }
      return z;
    });

    setCurrentZones(updated);
    setSelectedBlockId(blockId);
    setNewBlockName('');
    setIsAddingBlock(false);
    setAlertMessage({ type: 'success', text: `Đã thêm "${newBlock.name}" vào ${activeZone.name} với ${roomCount} phòng!` });
  };

  const handleDeleteBlock = (blockToDelete: Block) => {
    if (!activeZone) return;
    const occupants = getBlockWorkers(blockToDelete.id);
    if (occupants.length > 0) {
      const msg = `Dãy "${blockToDelete.name}" hiện đang có ${occupants.length} công nhân đang ở. Bạn có chắc chắn muốn xóa dãy này cùng toàn bộ các phòng bên trong?`;
      if (!window.confirm(msg)) return;
    } else {
      if (!window.confirm(`Xác nhận xóa "${blockToDelete.name}" và các phòng trực thuộc?`)) return;
    }

    const updated = currentZones.map(z => {
      if (z.id === activeZone.id) {
        return {
          ...z,
          blocks: (z.blocks || []).filter(b => b.id !== blockToDelete.id)
        };
      }
      return z;
    });

    setCurrentZones(updated);
    setSelectedBlockId('');
    setAlertMessage({ type: 'success', text: `Đã xóa "${blockToDelete.name}" khỏi ${activeZone.name}.` });
  };

  // ==================== 3. THÊM & XÓA PHÒNG (ROOM) ====================
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeZone || !activeBlock) {
      setAlertMessage({ type: 'error', text: 'Vui lòng chọn Khu và Dãy cần thêm Phòng' });
      return;
    }
    if (!newRoomName.trim()) {
      setAlertMessage({ type: 'error', text: 'Vui lòng nhập tên Phòng (VD: Phòng 16, Phòng VIP 1...)' });
      return;
    }

    const existingRooms = activeBlock.rooms || [];
    const nextRoomNum = existingRooms.length + 1;
    const roomId = `room-${activeZone.code.toLowerCase()}-${activeBlock.blockNumber || 1}-${Date.now()}`;

    const newRoom: Room = {
      id: roomId,
      zoneId: activeZone.id,
      blockId: activeBlock.id,
      roomNumber: nextRoomNum,
      name: newRoomName.trim(),
      maxCapacity: Math.max(1, Math.min(50, newRoomCapacity)),
      bedCount: Math.max(1, Math.min(50, newRoomBedCount)),
      lockerCount: Math.max(1, Math.min(50, newRoomLockerCount)),
      genderType: newRoomGender,
      floor: Math.ceil(nextRoomNum / 5)
    };

    const updated = currentZones.map(z => {
      if (z.id === activeZone.id) {
        return {
          ...z,
          blocks: (z.blocks || []).map(b => {
            if (b.id === activeBlock.id) {
              return {
                ...b,
                rooms: [...(b.rooms || []), newRoom]
              };
            }
            return b;
          })
        };
      }
      return z;
    });

    setCurrentZones(updated);
    setNewRoomName('');
    setIsAddingRoom(false);
    setAlertMessage({ type: 'success', text: `Đã thêm "${newRoom.name}" (Sức chứa ${newRoom.maxCapacity} người) vào ${activeBlock.name}!` });
  };

  const handleDeleteRoom = (roomToDelete: Room) => {
    if (!activeZone || !activeBlock) return;
    const occupants = getRoomWorkers(roomToDelete.id);
    if (occupants.length > 0) {
      const msg = `Phòng "${roomToDelete.name}" hiện đang có ${occupants.length} công nhân đang ở (${occupants.map(o => o.fullName).slice(0, 3).join(', ')}...). Vui lòng chuyển công nhân sang phòng khác trước khi xóa.`;
      alert(msg);
      return;
    }

    if (!window.confirm(`Xác nhận xóa "${roomToDelete.name}" khỏi ${activeBlock.name}?`)) return;

    const updated = currentZones.map(z => {
      if (z.id === activeZone.id) {
        return {
          ...z,
          blocks: (z.blocks || []).map(b => {
            if (b.id === activeBlock.id) {
              return {
                ...b,
                rooms: (b.rooms || []).filter(r => r.id !== roomToDelete.id)
              };
            }
            return b;
          })
        };
      }
      return z;
    });

    setCurrentZones(updated);
    setAlertMessage({ type: 'success', text: `Đã xóa "${roomToDelete.name}".` });
  };

  // Lưu toàn bộ thay đổi cấu trúc & Đồng bộ Firestore
  const handleSaveAll = async () => {
    try {
      await onSaveZones(currentZones, deletedZoneIds);
      setAlertMessage({ type: 'success', text: 'Đã lưu cấu trúc và đồng bộ thành công lên Google Cloud Firestore!' });
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setAlertMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu dữ liệu lên máy chủ.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Quản Lý Phân Vùng Ký Túc Xá</h2>
              <p className="text-xs text-slate-400">
                Thêm & Xóa linh hoạt các <strong>Khu</strong>, <strong>Dãy</strong>, và <strong>Phòng</strong> ở
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
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('zone'); setAlertMessage(null); }}
            className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'zone'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Quản Lý Khu ({currentZones.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('block'); setAlertMessage(null); }}
            className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'block'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>2. Quản Lý Dãy ({activeZone ? activeZone.blocks?.length || 0 : 0})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('room'); setAlertMessage(null); }}
            className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'room'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>3. Quản Lý Phòng ({activeRooms.length})</span>
          </button>
        </div>

        {/* Alert Feedback Banner */}
        {alertMessage && (
          <div className={`mx-4 sm:mx-6 mt-3 p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shrink-0 ${
            alertMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : alertMessage.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              {alertMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{alertMessage.text}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setAlertMessage(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* ======================= TAB 1: QUẢN LÝ KHU (ZONES) ======================= */}
          {activeTab === 'zone' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Danh sách tất cả các Khu Ký Túc Xá</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Khu lưu trú tổng thể (VD: Khu A, Khu B, Khu C, Khu D...)
                  </p>
                </div>

                {!isAddingZone && (
                  <button
                    type="button"
                    onClick={() => setIsAddingZone(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm Khu Mới</span>
                  </button>
                )}
              </div>

              {/* Form Thêm Khu Mới */}
              {isAddingZone && (
                <form onSubmit={handleCreateZone} className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <h4 className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-blue-600" />
                      <span>Thêm Khu Ký Túc Xá Mới</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingZone(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Mã Khu (Ký hiệu) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        value={newZoneCode}
                        onChange={e => setNewZoneCode(e.target.value.toUpperCase())}
                        placeholder="VD: E, F, G"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tên đầy đủ của Khu <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newZoneName}
                        onChange={e => setNewZoneName(e.target.value)}
                        placeholder="VD: Khu E - Ký Túc Xá Mở Rộng"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Số Dãy ban đầu</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={initialBlockCount}
                        onChange={e => setInitialBlockCount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Số phòng mỗi Dãy</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={initialRoomsPerBlock}
                        onChange={e => setInitialRoomsPerBlock(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Quy định Giới tính</label>
                      <select
                        value={initialGender}
                        onChange={e => setInitialGender(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Nam">Khu Nam</option>
                        <option value="Nữ">Khu Nữ</option>
                        <option value="Hỗn hợp">Khu Hỗn hợp / Kỹ thuật</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mô tả / Ghi chú</label>
                    <input
                      type="text"
                      value={newZoneDescription}
                      onChange={e => setNewZoneDescription(e.target.value)}
                      placeholder="VD: Dành cho công nhân xưởng may mới tuyển dụng..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={() => setIsAddingZone(false)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Xác nhận tạo Khu
                    </button>
                  </div>
                </form>
              )}

              {/* Danh sách các Khu hiện có */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentZones.map((zone) => {
                  const zoneWorkers = getZoneWorkers(zone.id);
                  const totalRooms = (zone.blocks || []).reduce((acc, b) => acc + (b.rooms?.length || 15), 0);
                  const isSelected = activeZone?.id === zone.id;

                  return (
                    <div
                      key={zone.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-100' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                            {zone.code}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{zone.name}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{zone.description || `Khu ${zone.code}`}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteZone(zone)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title={`Xóa ${zone.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600 mb-3">
                        <span className="font-semibold">
                          {(zone.blocks || []).length} Dãy &bull; {totalRooms} Phòng
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          zoneWorkers.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {zoneWorkers.length} người đang ở
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedZoneId(zone.id);
                            setActiveTab('block');
                          }}
                          className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-blue-700 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Quản lý Dãy</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================= TAB 2: QUẢN LÝ DÃY (BLOCKS) ======================= */}
          {activeTab === 'block' && (
            <div className="space-y-5">
              {/* Chọn Khu */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chọn Khu cần cấu hình Dãy:
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentZones.map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => {
                        setSelectedZoneId(z.id);
                        setSelectedBlockId('');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeZone?.id === z.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                        {z.code}
                      </span>
                      <span>{z.name}</span>
                      <span className="text-[10px] opacity-80">({z.blocks?.length || 0} Dãy)</span>
                    </button>
                  ))}
                </div>
              </div>

              {activeZone ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>Danh sách Dãy thuộc {activeZone.name}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tổng cộng {(activeZone.blocks || []).length} Dãy phòng
                      </p>
                    </div>

                    {!isAddingBlock && (
                      <button
                        type="button"
                        onClick={() => setIsAddingBlock(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Thêm Dãy Mới</span>
                      </button>
                    )}
                  </div>

                  {/* Form thêm Dãy mới */}
                  {isAddingBlock && (
                    <form onSubmit={handleCreateBlock} className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                        <h4 className="text-xs sm:text-sm font-bold text-blue-950 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-blue-600" />
                          <span>Thêm Dãy mới vào {activeZone.name}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddingBlock(false)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                        >
                          Hủy bỏ
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Tên Dãy <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newBlockName}
                            onChange={e => setNewBlockName(e.target.value)}
                            placeholder={`VD: Dãy ${(activeZone.blocks?.length || 0) + 1}`}
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Số lượng phòng</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={newBlockRoomCount}
                            onChange={e => setNewBlockRoomCount(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Loại phòng</label>
                          <select
                            value={newBlockGender}
                            onChange={e => setNewBlockGender(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="Nam">Phòng Nam</option>
                            <option value="Nữ">Phòng Nữ</option>
                            <option value="Hỗn hợp">Phòng Hỗn hợp</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-blue-200">
                        <button
                          type="button"
                          onClick={() => setIsAddingBlock(false)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          Tạo Dãy & Phòng
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Danh sách Dãy trong Khu */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeZone.blocks || []).map((b, idx) => {
                      const blockWorkers = getBlockWorkers(b.id);
                      const roomCount = b.rooms?.length || 15;

                      return (
                        <div
                          key={b.id || idx}
                          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-bold text-sm text-slate-900">{b.name}</span>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {roomCount} Phòng &bull; Sức chứa {roomCount * 20} người
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteBlock(b)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Xóa ${b.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              {blockWorkers.length} người đang ở
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBlockId(b.id);
                                setActiveTab('room');
                              }}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <span>Xem phòng</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Chưa có Khu nào. Vui lòng thêm Khu trước.
                </div>
              )}
            </div>
          )}

          {/* ======================= TAB 3: QUẢN LÝ PHÒNG (ROOMS) ======================= */}
          {activeTab === 'room' && (
            <div className="space-y-5">
              {/* Bộ 2 chọn: Khu & Dãy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1. Chọn Khu:</label>
                  <select
                    value={selectedZoneId}
                    onChange={e => {
                      setSelectedZoneId(e.target.value);
                      setSelectedBlockId('');
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {currentZones.map(z => (
                      <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2. Chọn Dãy:</label>
                  <select
                    value={activeBlock?.id || ''}
                    onChange={e => setSelectedBlockId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    {(activeZone?.blocks || []).map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.rooms?.length || 15} Phòng)</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeBlock ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <DoorOpen className="w-4 h-4 text-emerald-600" />
                        <span>Danh sách Phòng thuộc {activeBlock.name} ({activeZone?.name})</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Tổng cộng {activeRooms.length} Phòng ở (Mỗi phòng quy chuẩn 20 giường & 20 tủ đồ)
                      </p>
                    </div>

                    {!isAddingRoom && (
                      <button
                        type="button"
                        onClick={() => setIsAddingRoom(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Thêm Phòng Mới</span>
                      </button>
                    )}
                  </div>

                  {/* Form Thêm Phòng Mới */}
                  {isAddingRoom && (
                    <form onSubmit={handleCreateRoom} className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                          <Plus className="w-4 h-4 text-emerald-600" />
                          <span>Thêm Phòng mới vào {activeBlock.name}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddingRoom(false)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                        >
                          Hủy bỏ
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Tên Phòng <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newRoomName}
                            onChange={e => setNewRoomName(e.target.value)}
                            placeholder={`VD: Phòng ${activeRooms.length + 1}`}
                            required
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Loại Phòng</label>
                          <select
                            value={newRoomGender}
                            onChange={e => setNewRoomGender(e.target.value as any)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                          >
                            <option value="Nam">Phòng Nam</option>
                            <option value="Nữ">Phòng Nữ</option>
                            <option value="Hỗn hợp">Phòng Hỗn hợp / Kỹ thuật</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Sức chứa (người)</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={newRoomCapacity}
                            onChange={e => setNewRoomCapacity(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Số Giường</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={newRoomBedCount}
                            onChange={e => setNewRoomBedCount(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Số Tủ Đồ</label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={newRoomLockerCount}
                            onChange={e => setNewRoomLockerCount(Number(e.target.value))}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
                        <button
                          type="button"
                          onClick={() => setIsAddingRoom(false)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                          Xác nhận thêm Phòng
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Grid danh sách Phòng */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {activeRooms.map((room) => {
                      const roomWorkers = getRoomWorkers(room.id);
                      const isFull = roomWorkers.length >= (room.maxCapacity || 20);

                      return (
                        <div
                          key={room.id}
                          className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-2xs flex flex-col justify-between relative group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-bold text-xs text-slate-900">{room.name}</span>
                              <span className={`block text-[10px] font-semibold ${
                                room.genderType === 'Nữ' ? 'text-rose-600' : 'text-blue-600'
                              }`}>
                                {room.genderType || 'Nam'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room)}
                              className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={`Xóa ${room.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className={`font-bold ${isFull ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {roomWorkers.length}/{room.maxCapacity || 20}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {room.bedCount || 20}G &bull; {room.lockerCount || 20}T
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Vui lòng chọn hoặc thêm Dãy trước khi quản lý Phòng.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <span>Thao tác thêm & xóa sẽ được đồng bộ trực tiếp lên cơ sở dữ liệu.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleSaveAll}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu & Đồng Bộ Ngay</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
