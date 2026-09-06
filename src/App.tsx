import React, { useState, useEffect, useMemo } from 'react';
import { 
  Worker, 
  Zone, 
  Room, 
  FilterState, 
  ViewMode 
} from './types';
import { 
  ZONES_DATA, 
  generateRooms, 
  normalizeZones,
  INITIAL_WORKERS, 
  DEPARTMENTS, 
  STORAGE_KEY_WORKERS 
} from './data/dormitoryData';
import { matchVietnameseSearch } from './utils/vietnamese';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { RoomGridView } from './components/RoomGridView';
import { WorkerTableView } from './components/WorkerTableView';
import { RoomDetailModal } from './components/RoomDetailModal';
import { WorkerModal } from './components/WorkerModal';
import { TransferWorkerModal } from './components/TransferWorkerModal';
import { WorkerDetailModal } from './components/WorkerDetailModal';
import { StructureManagerModal } from './components/StructureManagerModal';
import { StatsDashboard } from './components/StatsDashboard';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { googleDriveService } from './services/googleDriveService';
import { 
  subscribeWorkers, 
  saveWorkerToFirestore, 
  deleteWorkerFromFirestore, 
  seedInitialDataIfEmpty,
  subscribeZones,
  saveZoneToFirestore,
  deleteZoneFromFirestore,
  seedZonesIfEmpty,
  testFirestoreConnection
} from './services/firestoreService';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, HardDrive } from 'lucide-react';

export default function App() {
  // 1. Quản lý dữ liệu Khu, Dãy, Phòng và Công nhân
  const [zones, setZones] = useState<Zone[]>(ZONES_DATA);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');

  // Tính danh sách phòng dựa trên các Khu và Dãy (mỗi dãy có 15 phòng)
  const rooms = useMemo(() => generateRooms(zones), [zones]);

  // Kết nối Firestore Realtime Sync
  useEffect(() => {
    let unsubscribeWorkers: (() => void) | undefined;
    let unsubscribeZones: (() => void) | undefined;

    async function initFirestore() {
      setIsLoading(true);
      setSyncStatus('syncing');
      
      const connected = await testFirestoreConnection();
      setIsCloudConnected(connected);

      // Seed initial data if Firestore is empty
      await seedZonesIfEmpty();
      await seedInitialDataIfEmpty();

      // Subscribe to Realtime Updates
      unsubscribeWorkers = subscribeWorkers(
        (updatedWorkers) => {
          setWorkers(updatedWorkers);
          setIsLoading(false);
          setSyncStatus('synced');
          // Backup to local storage
          try {
            localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(updatedWorkers));
          } catch (e) {
            console.error('LocalStorage write error:', e);
          }
        },
        (err) => {
          console.warn('Firestore workers stream warning:', err);
          setSyncStatus('offline');
          // Fallback to local storage if network glitch
          try {
            const saved = localStorage.getItem(STORAGE_KEY_WORKERS);
            if (saved) setWorkers(JSON.parse(saved));
          } catch (e) {}
          setIsLoading(false);
        }
      );

      unsubscribeZones = subscribeZones(
        (updatedZones) => {
          if (updatedZones && updatedZones.length > 0) {
            setZones(normalizeZones(updatedZones));
          }
        },
        (err) => {
          console.warn('Firestore zones stream warning:', err);
        }
      );
    }

    initFirestore();

    return () => {
      if (unsubscribeWorkers) unsubscribeWorkers();
      if (unsubscribeZones) unsubscribeZones();
    };
  }, []);

  // 2. State điều khiển View và Bộ lọc
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    zoneId: 'all',
    blockId: 'all',
    roomStatus: 'all',
    gender: 'all',
    department: 'all',
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      zoneId: 'all',
      blockId: 'all',
      roomStatus: 'all',
      gender: 'all',
      department: 'all',
    });
  };

  // 3. State điều khiển các Modal
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState<boolean>(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState<boolean>(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState<boolean>(false);
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [modalInitialRoomId, setModalInitialRoomId] = useState<string | undefined>(undefined);
  const [modalInitialBedNumber, setModalInitialBedNumber] = useState<number | undefined>(undefined);

  const [workerToTransfer, setWorkerToTransfer] = useState<Worker | null>(null);
  const [workerToViewProfile, setWorkerToViewProfile] = useState<Worker | null>(null);

  // Check Drive connection state
  useEffect(() => {
    setIsDriveConnected(googleDriveService.isConnected());
  }, [isGoogleDriveModalOpen]);

  // Helper auto-sync to Google Drive if connected and enabled
  const triggerBackgroundDriveSync = (updatedWorkers: Worker[], updatedZones: Zone[]) => {
    if (googleDriveService.isConnected() && googleDriveService.getAutoSyncSetting()) {
      googleDriveService.syncDataToDrive(updatedWorkers, updatedZones, false).catch((err) => {
        console.warn('Auto sync Google Drive in background error:', err);
      });
    }
  };

  // 4. Lọc danh sách công nhân theo Search (không dấu) & Filter
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      // 1. Tìm kiếm không dấu trên tất cả các trường: Tên, Mã NV, CCCD, SĐT, Quê quán, Tổ trưởng, SĐT tổ trưởng
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery;
        const matchesName = matchVietnameseSearch(worker.fullName || '', q);
        const matchesCode = matchVietnameseSearch(worker.code || '', q);
        const matchesCitizen = matchVietnameseSearch(worker.citizenId || '', q);
        const matchesPhone = matchVietnameseSearch(worker.phone || '', q);
        const matchesAddress = matchVietnameseSearch(worker.address || '', q);
        const matchesHometown = matchVietnameseSearch(worker.hometown || '', q);
        const matchesLeaderName = matchVietnameseSearch(worker.teamLeaderName || '', q);
        const matchesLeaderPhone = matchVietnameseSearch(worker.teamLeaderPhone || '', q);

        if (!matchesName && !matchesCode && !matchesCitizen && !matchesPhone && !matchesAddress && !matchesHometown && !matchesLeaderName && !matchesLeaderPhone) {
          return false;
        }
      }

      // 2. Lọc theo Khu
      if (filters.zoneId !== 'all' && worker.zoneId !== filters.zoneId) {
        return false;
      }

      // 3. Lọc theo Dãy
      if (filters.blockId !== 'all' && worker.blockId !== filters.blockId) {
        return false;
      }

      // 4. Lọc theo Giới tính
      if (filters.gender !== 'all' && worker.gender !== filters.gender) {
        return false;
      }

      // 5. Lọc theo Phân xưởng
      if (filters.department !== 'all' && worker.department !== filters.department) {
        return false;
      }

      return true;
    });
  }, [workers, filters]);

  // Lọc danh sách Phòng theo tiêu chí
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (filters.zoneId !== 'all' && room.zoneId !== filters.zoneId) return false;
      if (filters.blockId !== 'all' && room.blockId !== filters.blockId) return false;

      const roomWorkers = workers.filter((w) => w.roomId === room.id);
      const count = roomWorkers.length;
      const maxCap = room.maxCapacity || 20;

      if (filters.roomStatus === 'available' && count >= maxCap) return false;
      if (filters.roomStatus === 'full' && count < maxCap) return false;
      if (filters.roomStatus === 'empty' && count > 0) return false;

      return true;
    });
  }, [rooms, workers, filters]);

  // Thống kê nhanh cho Navbar
  const roomStats = useMemo(() => {
    let full = 0;
    let empty = 0;
    let available = 0;
    let totalCap = 0;

    rooms.forEach((r) => {
      const maxCap = r.maxCapacity || 20;
      totalCap += maxCap;
      const c = workers.filter((w) => w.roomId === r.id).length;
      if (c >= maxCap) full++;
      else if (c === 0) empty++;
      else available++;
    });

    return {
      fullRoomsCount: full,
      emptyRoomsCount: empty,
      availableRoomsCount: available,
      totalCapacity: totalCap || rooms.length * 20,
    };
  }, [rooms, workers]);

  // 5. Thao tác CRUD Công nhân với Google Cloud Firestore
  const handleSaveWorker = async (workerData: Partial<Worker>) => {
    setSyncStatus('syncing');
    let updatedWorker: Worker;

    if (workerToEdit) {
      updatedWorker = { ...workerToEdit, ...workerData } as Worker;
      // Optimistic update
      setWorkers(prev => prev.map(w => w.id === updatedWorker.id ? updatedWorker : w));
    } else {
      updatedWorker = workerData as Worker;
      // Optimistic update
      setWorkers(prev => [updatedWorker, ...prev]);
    }

    try {
      await saveWorkerToFirestore(updatedWorker);
      setSyncStatus('synced');
      triggerBackgroundDriveSync(
        workerToEdit
          ? workers.map(w => w.id === updatedWorker.id ? updatedWorker : w)
          : [updatedWorker, ...workers],
        zones
      );
    } catch (err) {
      console.error('Lỗi khi lưu lên Firestore:', err);
      setSyncStatus('offline');
    }
  };

  const handleDeleteWorker = async (worker: Worker) => {
    const confirm = window.confirm(
      `Bạn có chắc chắn muốn trả phòng và xóa hồ sơ nhân viên "${worker.fullName}" (${worker.code})? Dữ liệu sẽ được đồng bộ lên Google Cloud.`
    );
    if (confirm) {
      setSyncStatus('syncing');
      // Optimistic delete
      const remainingWorkers = workers.filter(w => w.id !== worker.id);
      setWorkers(remainingWorkers);
      if (workerToViewProfile?.id === worker.id) {
        setWorkerToViewProfile(null);
      }
      try {
        await deleteWorkerFromFirestore(worker.id);
        setSyncStatus('synced');
        triggerBackgroundDriveSync(remainingWorkers, zones);
      } catch (err) {
        console.error('Lỗi khi xóa trên Firestore:', err);
      }
    }
  };

  const handleConfirmTransfer = async (
    workerId: string,
    targetRoomId: string,
    targetBedNumber: number,
    targetZoneId: string,
    targetBlockId: string
  ) => {
    setSyncStatus('syncing');
    const existing = workers.find(w => w.id === workerId);
    if (!existing) return;

    const transferred: Worker = {
      ...existing,
      roomId: targetRoomId,
      bedNumber: targetBedNumber,
      lockerNumber: targetBedNumber,
      zoneId: targetZoneId,
      blockId: targetBlockId,
    };

    // Optimistic UI update
    const updatedList = workers.map(w => w.id === workerId ? transferred : w);
    setWorkers(updatedList);

    try {
      await saveWorkerToFirestore(transferred);
      setSyncStatus('synced');
      triggerBackgroundDriveSync(updatedList, zones);
    } catch (err) {
      console.error('Lỗi khi đổi phòng trên Firestore:', err);
    }
  };

  // Cập nhật cấu trúc Khu / Dãy / Phòng (Thêm & Xóa)
  const handleSaveZones = async (newZones: Zone[], deletedZoneIds?: string[]) => {
    setSyncStatus('syncing');
    setZones(newZones);

    try {
      if (deletedZoneIds && deletedZoneIds.length > 0) {
        for (const zoneId of deletedZoneIds) {
          await deleteZoneFromFirestore(zoneId);
        }
      }

      for (const zone of newZones) {
        await saveZoneToFirestore(zone);
      }
      setSyncStatus('synced');
      triggerBackgroundDriveSync(workers, newZones);
    } catch (err) {
      console.error('Lỗi khi lưu cấu trúc KTX lên Firestore:', err);
      setSyncStatus('offline');
    }
  };

  // Xử lý khi khôi phục dữ liệu từ Google Drive
  const handleDataRestoredFromDrive = async (restoredWorkers: Worker[], restoredZones: Zone[]) => {
    setSyncStatus('syncing');
    setWorkers(restoredWorkers);
    if (restoredZones && restoredZones.length > 0) {
      setZones(restoredZones);
      for (const z of restoredZones) {
        await saveZoneToFirestore(z);
      }
    }
    for (const w of restoredWorkers) {
      await saveWorkerToFirestore(w);
    }
    setSyncStatus('synced');
  };

  // Khôi phục dữ liệu mẫu
  const handleResetData = async () => {
    const confirm = window.confirm(
      'Bạn có chắc chắn muốn khôi phục lại dữ liệu mẫu ban đầu? Dữ liệu sẽ được cập nhật lên Google Firestore.'
    );
    if (confirm) {
      setWorkers(INITIAL_WORKERS);
      for (const w of INITIAL_WORKERS) {
        await saveWorkerToFirestore(w);
      }
    }
  };

  // Xuất file CSV (Excel tiếng Việt có BOM UTF-8)
  const handleExportCSV = () => {
    const headers = [
      '1. Mã Nhân Viên',
      '2. Họ và Tên',
      '3. Giới Tính',
      '4. Ngày Sinh',
      '5. Địa Chỉ (Thôn/Xã/Tỉnh)',
      '6. Số CCCD',
      '7. Tên Tổ Trưởng',
      '8. SĐT Tổ Trưởng',
      'Khu',
      'Dãy',
      'Phòng',
      'Số Giường',
      'Số Tủ Đồ',
      'Trạng Thái',
      'Ghi Chú',
    ];

    const rows = filteredWorkers.map((w) => {
      const room = rooms.find((r) => r.id === w.roomId);
      const zone = zones.find((z) => z.id === w.zoneId);
      const block = zone?.blocks.find((b) => b.id === w.blockId);

      return [
        `"${w.code}"`,
        `"${w.fullName}"`,
        `"${w.gender}"`,
        `"${w.birthDate || ''}"`,
        `"${w.address || ''}"`,
        `"${w.citizenId}"`,
        `"${w.teamLeaderName || ''}"`,
        `"${w.teamLeaderPhone || ''}"`,
        `"${zone?.name || ''}"`,
        `"${block?.name || ''}"`,
        `"${room?.name || ''}"`,
        `"${w.bedNumber}"`,
        `"${w.lockerNumber || w.bedNumber}"`,
        `"${w.status === 'active' ? 'Đang ở' : 'Tạm vắng'}"`,
        `"${w.notes || ''}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_sach_cong_nhan_ktx_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mở modal thêm công nhân vào phòng/giường cụ thể
  const handleOpenAddWorkerToRoom = (room: Room, bedNumber?: number) => {
    setWorkerToEdit(null);
    setModalInitialRoomId(room.id);
    setModalInitialBedNumber(bedNumber);
    setIsWorkerModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Bar with Brand & Counters */}
      <Navbar
        totalWorkers={workers.length}
        totalRooms={rooms.length}
        maxCapacity={roomStats.totalCapacity}
        fullRoomsCount={roomStats.fullRoomsCount}
        emptyRoomsCount={roomStats.emptyRoomsCount}
        availableRoomsCount={roomStats.availableRoomsCount}
        currentView={viewMode}
        onViewChange={setViewMode}
        onOpenAddWorker={() => {
          setWorkerToEdit(null);
          setModalInitialRoomId(undefined);
          setModalInitialBedNumber(undefined);
          setIsWorkerModalOpen(true);
        }}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        onOpenGoogleDrive={() => setIsGoogleDriveModalOpen(true)}
        isDriveConnected={isDriveConnected}
      />

      {/* Cloud Persistence & Realtime Indicator Bar */}
      <div className="bg-slate-800 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between border-b border-slate-700">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <Cloud className="w-3.5 h-3.5" />
              <span>Google Cloud:</span>
            </span>
            <span className="hidden sm:inline text-slate-300">
              Lưu trữ Firestore & Tự động sao lưu Google Drive
            </span>
            <span className="sm:hidden text-slate-300">Đồng bộ đám mây</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Drive Button */}
            <button
              onClick={() => setIsGoogleDriveModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-700/60 hover:bg-slate-700 cursor-pointer transition-colors"
            >
              <HardDrive className={`w-3 h-3 ${isDriveConnected ? 'text-emerald-400' : 'text-blue-400'}`} />
              <span>{isDriveConnected ? 'Drive: Đã kết nối' : 'Kết nối Drive'}</span>
            </button>

            {syncStatus === 'syncing' && (
              <span className="flex items-center gap-1 text-amber-300">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Đang đồng bộ...</span>
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Đã lưu an toàn</span>
              </span>
            )}
            {syncStatus === 'offline' && (
              <span className="flex items-center gap-1 text-rose-400">
                <AlertCircle className="w-3 h-3" />
                <span>Chế độ ngoại tuyến</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Filters Bar with Non-accent Search & Instant Suggestions */}
      <FilterBar
        zones={zones}
        rooms={rooms}
        workers={workers}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        departments={DEPARTMENTS}
        totalFilteredWorkers={filteredWorkers.length}
        totalFilteredRooms={filteredRooms.length}
        onOpenStructureManager={() => setIsStructureModalOpen(true)}
        onSelectWorker={(worker) => setWorkerToViewProfile(worker)}
        onSelectRoom={(room) => setSelectedRoom(room)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {isLoading && workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu KTX từ Google Cloud...</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <RoomGridView
                zones={zones}
                rooms={filteredRooms}
                workers={workers}
                searchQuery={filters.searchQuery}
                selectedZoneId={filters.zoneId}
                selectedBlockId={filters.blockId}
                onSelectRoom={(room) => setSelectedRoom(room)}
                onAddWorkerToRoom={(room) => handleOpenAddWorkerToRoom(room)}
                onSelectWorker={(worker) => setWorkerToViewProfile(worker)}
              />
            )}

            {viewMode === 'table' && (
              <WorkerTableView
                workers={filteredWorkers}
                zones={zones}
                rooms={rooms}
                searchQuery={filters.searchQuery}
                onSelectWorker={(worker) => setWorkerToViewProfile(worker)}
                onEditWorker={(worker) => {
                  setWorkerToEdit(worker);
                  setIsWorkerModalOpen(true);
                }}
                onTransferWorker={(worker) => setWorkerToTransfer(worker)}
                onDeleteWorker={handleDeleteWorker}
                onSelectRoomById={(roomId) => {
                  const r = rooms.find((room) => room.id === roomId);
                  if (r) setSelectedRoom(r);
                }}
              />
            )}

            {viewMode === 'stats' && (
              <StatsDashboard
                workers={workers}
                zones={zones}
                rooms={rooms}
              />
            )}
          </>
        )}
      </main>

      {/* Modal 1: Chi tiết Giường & Tủ đồ trong Phòng */}
      {selectedRoom && (
        <RoomDetailModal
          room={selectedRoom}
          zone={zones.find((z) => z.id === selectedRoom.zoneId)}
          block={zones.find((z) => z.id === selectedRoom.zoneId)?.blocks?.find((b) => b.id === selectedRoom.blockId)}
          workersInRoom={workers.filter((w) => w.roomId === selectedRoom.id)}
          onClose={() => setSelectedRoom(null)}
          onAddWorkerToBed={(bedNumber) => {
            handleOpenAddWorkerToRoom(selectedRoom, bedNumber);
          }}
          onSelectWorker={(worker) => setWorkerToViewProfile(worker)}
          onEditWorker={(worker) => {
            setWorkerToEdit(worker);
            setIsWorkerModalOpen(true);
          }}
          onTransferWorker={(worker) => setWorkerToTransfer(worker)}
          onDeleteWorker={handleDeleteWorker}
        />
      )}

      {/* Modal 2: Thêm mới / Chỉnh sửa Nhân viên với 8 trường & Quét QR CCCD */}
      <WorkerModal
        isOpen={isWorkerModalOpen}
        workerToEdit={workerToEdit}
        initialRoomId={modalInitialRoomId}
        initialBedNumber={modalInitialBedNumber}
        zones={zones}
        rooms={rooms}
        allWorkers={workers}
        onClose={() => {
          setIsWorkerModalOpen(false);
          setWorkerToEdit(null);
        }}
        onSaveWorker={handleSaveWorker}
      />

      {/* Modal 3: Chuyển phòng nhanh */}
      {workerToTransfer && (
        <TransferWorkerModal
          worker={workerToTransfer}
          zones={zones}
          rooms={rooms}
          allWorkers={workers}
          onClose={() => setWorkerToTransfer(null)}
          onConfirmTransfer={handleConfirmTransfer}
        />
      )}

      {/* Modal 4: Hồ sơ chi tiết đầy đủ 8 trường */}
      {workerToViewProfile && (
        <WorkerDetailModal
          worker={workerToViewProfile}
          zones={zones}
          rooms={rooms}
          onClose={() => setWorkerToViewProfile(null)}
          onEdit={(worker) => {
            setWorkerToEdit(worker);
            setIsWorkerModalOpen(true);
          }}
          onTransfer={(worker) => setWorkerToTransfer(worker)}
          onDelete={handleDeleteWorker}
          onViewRoom={(roomId) => {
            const r = rooms.find((room) => room.id === roomId);
            if (r) setSelectedRoom(r);
          }}
        />
      )}

      {/* Modal 5: Quản lý phân vùng KTX (Thêm & Xóa Khu, Dãy, Phòng) */}
      <StructureManagerModal
        isOpen={isStructureModalOpen}
        zones={zones}
        workers={workers}
        onClose={() => setIsStructureModalOpen(false)}
        onSaveZones={handleSaveZones}
      />

      {/* Modal 6: Lưu trữ & Sao lưu Google Drive */}
      <GoogleDriveModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
        workers={workers}
        zones={zones}
        onDataRestored={handleDataRestoredFromDrive}
        onSyncCompleted={() => setIsDriveConnected(true)}
      />
    </div>
  );
}
