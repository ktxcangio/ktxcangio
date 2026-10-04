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
  STORAGE_KEY_WORKERS,
  STORAGE_LOCAL_KEY_ZONES 
} from './data/dormitoryData';
import { matchVietnameseSearch } from './utils/vietnamese';
import { SapoSidebar } from './components/SapoSidebar';
import { SapoHeader } from './components/SapoHeader';
import { FilterBar } from './components/FilterBar';
import { RoomGridView } from './components/RoomGridView';
import { WorkerTableView } from './components/WorkerTableView';
import { RoomDetailModal } from './components/RoomDetailModal';
import { WorkerModal } from './components/WorkerModal';
import { TransferWorkerModal } from './components/TransferWorkerModal';
import { WorkerDetailModal } from './components/WorkerDetailModal';
import { StructureManagerModal } from './components/StructureManagerModal';
import { StatsDashboard } from './components/StatsDashboard';
import { OverviewDiagrams } from './components/OverviewDiagrams';
import { ZoneBlockSidebar } from './components/ZoneBlockSidebar';
import { RoomIdCardsModal } from './components/RoomIdCardsModal';
import { FirebaseSyncModal } from './components/FirebaseSyncModal';
import { 
  subscribeWorkers, 
  saveWorkerToFirestore, 
  deleteWorkerFromFirestore, 
  seedInitialDataIfEmpty,
  subscribeZones,
  saveZoneToFirestore,
  deleteZoneFromFirestore,
  seedZonesIfEmpty
} from './services/firestoreService';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, Database, FolderTree } from 'lucide-react';

export default function App() {
  // 1. Quản lý dữ liệu Khu, Dãy, Phòng và Công nhân
  const [zones, setZones] = useState<Zone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LOCAL_KEY_ZONES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeZones(parsed);
        }
      }
    } catch (e) {
      console.error('LocalStorage zones read error:', e);
    }
    return ZONES_DATA;
  });

  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('LocalStorage workers read error:', e);
    }
    return INITIAL_WORKERS;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState<boolean>(false);

  // Tính danh sách phòng dựa trên các Khu và Dãy (mỗi dãy có 15 phòng)
  const rooms = useMemo(() => generateRooms(zones), [zones]);

  // Kết nối Firestore Realtime Sync
  useEffect(() => {
    let unsubscribeWorkers: (() => void) | undefined;
    let unsubscribeZones: (() => void) | undefined;

    async function initFirestore() {
      setSyncStatus('syncing');
      
      // Load local cache immediately for instant interactive UI
      try {
        const savedWorkers = localStorage.getItem(STORAGE_KEY_WORKERS);
        if (savedWorkers) {
          const parsed = JSON.parse(savedWorkers);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setWorkers(parsed);
          }
        }
        const savedZones = localStorage.getItem(STORAGE_LOCAL_KEY_ZONES);
        if (savedZones) {
          const parsed = JSON.parse(savedZones);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setZones(normalizeZones(parsed));
          }
        }
      } catch (e) {
        console.error('LocalStorage read error:', e);
      }

      // Subscribe to Realtime Updates immediately
      unsubscribeWorkers = subscribeWorkers(
        (updatedWorkers) => {
          if (updatedWorkers.length > 0) {
            setWorkers(updatedWorkers);
            try {
              localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(updatedWorkers));
            } catch (e) {
              console.error('LocalStorage write error:', e);
            }
          }
          setIsLoading(false);
          setSyncStatus('synced');
        },
        (err) => {
          console.warn('Firestore workers stream warning:', err);
          setSyncStatus('offline');
          setIsLoading(false);
        }
      );

      unsubscribeZones = subscribeZones(
        (updatedZones) => {
          if (updatedZones && updatedZones.length > 0) {
            const normalized = normalizeZones(updatedZones);
            setZones(normalized);
            try {
              localStorage.setItem(STORAGE_LOCAL_KEY_ZONES, JSON.stringify(normalized));
            } catch (e) {
              console.error(e);
            }
          }
        },
        (err) => {
          console.warn('Firestore zones stream warning:', err);
        }
      );

      // Seed initial data in background if Firestore is empty
      try {
        await seedZonesIfEmpty();
        await seedInitialDataIfEmpty();
      } catch (err) {
        console.warn('Firestore background seed notice:', err);
      }
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
  const [workerToEdit, setWorkerToEdit] = useState<Worker | null>(null);
  const [modalInitialRoomId, setModalInitialRoomId] = useState<string | undefined>(undefined);
  const [modalInitialBedNumber, setModalInitialBedNumber] = useState<number | undefined>(undefined);

  const [workerToTransfer, setWorkerToTransfer] = useState<Worker | null>(null);
  const [workerToViewProfile, setWorkerToViewProfile] = useState<Worker | null>(null);
  const [roomForIdCardsModal, setRoomForIdCardsModal] = useState<Room | null>(null);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState<boolean>(false);
  const [shortcutToast, setShortcutToast] = useState<{ message: string; key: string } | null>(null);

  // Lắng nghe phím tắt A, B, C, D, 1, 2, 3, 4, 0, Esc để chuyển nhanh các Khu KTX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi người dùng đang nhập liệu trong ô input / textarea
      const target = e.target as HTMLElement;
      if (!target) return;
      const tag = target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || target.isContentEditable) {
        return;
      }

      // Bỏ qua khi đang mở modal popup
      if (
        isWorkerModalOpen ||
        isStructureModalOpen ||
        isFirebaseModalOpen ||
        workerToEdit ||
        workerToTransfer ||
        workerToViewProfile ||
        roomForIdCardsModal ||
        selectedRoom
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      // Phím 0 hoặc Escape hoặc T: Quay về Tổng quan KTX
      if (e.key === '0' || e.key === 'Escape' || (e.altKey && key === '0') || (!e.ctrlKey && !e.metaKey && (e.key === 't' || e.key === 'T'))) {
        if (filters.zoneId !== 'all') {
          handleFilterChange({ zoneId: 'all', blockId: 'all' });
          setShortcutToast({ message: 'Đã quay về Tổng quan KTX', key: e.key === 'Escape' ? 'Esc' : '0' });
          setTimeout(() => setShortcutToast(null), 2000);
        }
        return;
      }

      // Kiểm tra phím A, B, C, D hoặc 1, 2, 3, 4
      if (!e.ctrlKey && !e.metaKey) {
        let matchedZone: Zone | undefined;

        // Khớp theo chữ cái A, B, C, D...
        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(key)) {
          matchedZone = zones.find(z => 
            (z.code && z.code.toUpperCase() === key) ||
            z.name.toUpperCase().includes(`KHU ${key}`) ||
            z.id.toUpperCase().endsWith(`-${key.toLowerCase()}`)
          );
        }
        // Khớp theo số 1, 2, 3, 4...
        else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
          const index = parseInt(e.key, 10) - 1;
          if (zones[index]) {
            matchedZone = zones[index];
          }
        }

        if (matchedZone) {
          e.preventDefault();
          handleFilterChange({ zoneId: matchedZone.id, blockId: 'all' });
          setShortcutToast({ 
            message: `Đã chuyển đến ${matchedZone.name}`, 
            key: matchedZone.code || key 
          });
          setTimeout(() => setShortcutToast(null), 2000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zones, filters.zoneId, isWorkerModalOpen, isStructureModalOpen, isFirebaseModalOpen, workerToEdit, workerToTransfer, workerToViewProfile, roomForIdCardsModal, selectedRoom]);

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
    } catch (err) {
      console.error('Lỗi khi lưu lên Firestore:', err);
      setSyncStatus('offline');
    }
  };

  const handleDeleteWorker = async (worker: Worker) => {
    setSyncStatus('syncing');
    // Optimistic delete
    const remainingWorkers = workers.filter(w => w.id !== worker.id);
    setWorkers(remainingWorkers);
    try {
      localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(remainingWorkers));
    } catch (e) {
      console.error(e);
    }
    if (workerToViewProfile?.id === worker.id) {
      setWorkerToViewProfile(null);
    }
    try {
      await deleteWorkerFromFirestore(worker.id);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Lỗi khi xóa trên Firestore:', err);
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
      lockerNumber: existing.lockerNumber !== undefined ? existing.lockerNumber : 1,
      zoneId: targetZoneId,
      blockId: targetBlockId,
    };

    // Optimistic UI update
    const updatedList = workers.map(w => w.id === workerId ? transferred : w);
    setWorkers(updatedList);

    try {
      await saveWorkerToFirestore(transferred);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Lỗi khi đổi phòng trên Firestore:', err);
    }
  };

  // Cập nhật ảnh mặt trước/mặt sau CCCD cho công nhân (từ modal xuất ảnh CCCD)
  const handleUpdateWorkerPhotos = async (workerId: string, frontUrl?: string, backUrl?: string) => {
    setSyncStatus('syncing');
    let updatedWorker: Worker | undefined;

    setWorkers(prev => prev.map(w => {
      if (w.id === workerId) {
        updatedWorker = {
          ...w,
          idCardFrontUrl: frontUrl,
          idCardBackUrl: backUrl,
          idCardUrl: frontUrl,
        };
        return updatedWorker;
      }
      return w;
    }));

    if (updatedWorker) {
      try {
        await saveWorkerToFirestore(updatedWorker);
        setSyncStatus('synced');
      } catch (e) {
        console.error('Save worker photo error:', e);
      }
    }
  };

  // Xóa Khu chuyên dụng (xử lý triệt để cả công nhân và cache)
  const handleDeleteZone = async (zoneId: string, workerHandling: 'unassign' | 'delete' = 'unassign') => {
    setSyncStatus('syncing');

    // 1. Cập nhật danh sách Zones
    const remainingZones = zones.filter(z => z.id !== zoneId);
    setZones(remainingZones);

    // Lưu vào LocalStorage ngay lập tức để không bao giờ bị phục hồi lại
    try {
      localStorage.setItem(STORAGE_LOCAL_KEY_ZONES, JSON.stringify(remainingZones));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }

    // 2. Xử lý công nhân đang thuộc Khu này
    if (workerHandling === 'delete') {
      const workersToDelete = workers.filter(w => w.zoneId === zoneId);
      const remainingWorkers = workers.filter(w => w.zoneId !== zoneId);
      setWorkers(remainingWorkers);
      try {
        localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(remainingWorkers));
        for (const w of workersToDelete) {
          await deleteWorkerFromFirestore(w.id);
        }
      } catch (err) {
        console.error('Lỗi khi xóa công nhân của Khu:', err);
      }
    } else {
      const affectedWorkers: Worker[] = [];
      const updatedWorkers = workers.map(w => {
        if (w.zoneId === zoneId) {
          const unassigned: Worker = {
            ...w,
            zoneId: '',
            blockId: '',
            roomId: '',
            bedNumber: 0,
            lockerNumber: 0,
            notes: (w.notes ? w.notes + ' • ' : '') + `Chưa xếp phòng (Đã giải phóng khi xóa khu)`
          };
          affectedWorkers.push(unassigned);
          return unassigned;
        }
        return w;
      });
      setWorkers(updatedWorkers);
      try {
        localStorage.setItem(STORAGE_KEY_WORKERS, JSON.stringify(updatedWorkers));
        for (const w of affectedWorkers) {
          await saveWorkerToFirestore(w);
        }
      } catch (err) {
        console.error('Lỗi khi cập nhật công nhân chưa xếp phòng:', err);
      }
    }

    // 3. Nếu đang xem Khu bị xóa, chuyển về tổng quan 'all'
    if (filters.zoneId === zoneId) {
      setFilters(prev => ({ ...prev, zoneId: 'all', blockId: 'all' }));
    }

    // 4. Đồng bộ xóa trên Google Cloud Firestore
    try {
      await deleteZoneFromFirestore(zoneId);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Lỗi khi xóa Khu trên Firestore:', err);
      setSyncStatus('offline');
    }
  };

  // Cập nhật cấu trúc Khu / Dãy / Phòng (Thêm & Xóa)
  const handleSaveZones = async (newZones: Zone[], deletedZoneIds?: string[]) => {
    setSyncStatus('syncing');
    setZones(newZones);

    try {
      localStorage.setItem(STORAGE_LOCAL_KEY_ZONES, JSON.stringify(newZones));
    } catch (e) {
      console.error(e);
    }

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
    } catch (err) {
      console.error('Lỗi khi lưu cấu trúc KTX lên Firestore:', err);
      setSyncStatus('offline');
    }
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

  // Khôi phục dữ liệu lên Google Firebase Firestore hoặc từ tệp sao lưu JSON
  const handleRestoreData = async (newWorkers: Worker[], newZones: Zone[]) => {
    setWorkers(newWorkers);
    setZones(newZones);
    setSyncStatus('syncing');
    try {
      for (const w of newWorkers) {
        await saveWorkerToFirestore(w);
      }
      for (const z of newZones) {
        await saveZoneToFirestore(z);
      }
      setSyncStatus('synced');
    } catch (err) {
      console.error('Lỗi khi lưu dữ liệu khôi phục lên Firestore:', err);
      setSyncStatus('offline');
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
      'Tổng Số Tủ',
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
        `"${w.lockerNumber !== undefined ? w.lockerNumber : 1}"`,
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
    <div className="min-h-screen bg-[#F4F6F8] text-slate-800 flex font-sans selection:bg-[#0088FF] selection:text-white">
      {/* Sapo Left Navigation Rail */}
      <SapoSidebar
        currentView={viewMode}
        onViewChange={setViewMode}
        totalWorkers={workers.length}
        totalRooms={rooms.length}
        syncStatus={syncStatus}
        onOpenStructureManager={() => setIsStructureModalOpen(true)}
        onOpenAddWorker={() => {
          setWorkerToEdit(null);
          setModalInitialRoomId(undefined);
          setModalInitialBedNumber(undefined);
          setIsWorkerModalOpen(true);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
      />

      {/* Main Sapo App Workspace */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 print:hidden ${
        isSidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-60'
      }`}>
        {/* Sapo Top Header */}
        <SapoHeader
          currentView={viewMode}
          totalWorkers={workers.length}
          totalRooms={rooms.length}
          maxCapacity={roomStats.totalCapacity}
          availableRoomsCount={roomStats.availableRoomsCount}
          fullRoomsCount={roomStats.fullRoomsCount}
          syncStatus={syncStatus}
          onViewChange={setViewMode}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAddWorker={() => {
            setWorkerToEdit(null);
            setModalInitialRoomId(undefined);
            setModalInitialBedNumber(undefined);
            setIsWorkerModalOpen(true);
          }}
          onExportCSV={handleExportCSV}
          onResetData={handleResetData}
          onOpenStructureManager={() => setIsStructureModalOpen(true)}
          onOpenCategorySidebar={() => setIsMobileSidebarOpen(true)}
          onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
        />

        {/* Content Workspace Area */}
        <main className="flex-1 w-full max-w-[1720px] mx-auto p-3 sm:p-5 space-y-3.5">
          {/* Sapo Filter & Status Tab Bar */}
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
            onOpenCategorySidebar={() => setIsMobileSidebarOpen(true)}
            isCategorySidebarOpen={isCategorySidebarOpen}
            onToggleCategorySidebar={() => setIsCategorySidebarOpen(prev => !prev)}
            onSelectWorker={(worker) => setWorkerToViewProfile(worker)}
            onSelectRoom={(room) => setSelectedRoom(room)}
          />

          {/* Sapo Layout: Optional Category Panel + Main Content */}
          <div className="flex flex-col lg:flex-row items-start gap-4">
            {/* Cột Danh mục Khu - Dãy (ẩn trên desktop khi chưa bật để tối ưu không gian) */}
            <ZoneBlockSidebar
              zones={zones}
              rooms={rooms}
              workers={workers}
              selectedZoneId={filters.zoneId}
              selectedBlockId={filters.blockId}
              onSelectZoneBlock={(zoneId, blockId) => handleFilterChange({ zoneId, blockId })}
              onOpenStructureManager={() => setIsStructureModalOpen(true)}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
              hideOnDesktop={!isCategorySidebarOpen || viewMode !== 'grid'}
              onCloseDesktop={() => setIsCategorySidebarOpen(false)}
            />

            {/* Vùng nội dung chính bên phải */}
            <div className="flex-1 min-w-0 w-full space-y-3.5">
              {/* Thanh hiển thị danh mục đang chọn (nếu có chọn Khu hoặc Dãy) */}
              {(filters.zoneId !== 'all' || filters.blockId !== 'all') && (
                <div className="bg-white rounded-lg p-2.5 px-3 border border-[#E4E8EC] shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleFilterChange({ zoneId: 'all', blockId: 'all' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-[#E5F3FF] text-slate-700 hover:text-[#0088FF] font-semibold transition-colors cursor-pointer border border-slate-200"
                    >
                      <span>‹ Sơ đồ tổng quát KTX</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500 font-medium">Đang xem:</span>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E5F3FF] text-[#0088FF] font-bold border border-[#BAE0FF]">
                      <span>{zones.find(z => z.id === filters.zoneId)?.name || 'Khu KTX'}</span>
                      {filters.blockId !== 'all' && (
                        <>
                          <span className="text-blue-300">›</span>
                          <span>{zones.find(z => z.id === filters.zoneId)?.blocks?.find(b => b.id === filters.blockId)?.name || 'Dãy'}</span>
                        </>
                      )}
                    </div>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <span className="text-slate-600">
                      <strong className="text-slate-800 font-bold">{filteredRooms.length}</strong> phòng, <strong className="text-slate-800 font-bold">{filteredWorkers.length}</strong> công nhân
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFilterChange({ zoneId: 'all', blockId: 'all' })}
                    className="text-xs text-[#0088FF] hover:text-[#0070E0] font-semibold cursor-pointer underline hover:no-underline"
                  >
                    Xem tất cả Khu (Sơ đồ tổng quát)
                  </button>
                </div>
              )}

              {isLoading && workers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3 bg-white rounded-lg border border-[#E4E8EC]">
                  <RefreshCw className="w-8 h-8 text-[#0088FF] animate-spin" />
                  <p className="text-sm font-semibold text-slate-600">Đang tải dữ liệu KTX từ Cloud Firestore...</p>
                </div>
              ) : (
                <>
                  {viewMode === 'grid' && (
                    filters.zoneId === 'all' && !filters.searchQuery.trim() ? (
                      <OverviewDiagrams
                        zones={zones}
                        rooms={rooms}
                        workers={workers}
                        onSelectZone={(zoneId) => handleFilterChange({ zoneId, blockId: 'all' })}
                        onOpenAddWorker={() => {
                          setWorkerToEdit(null);
                          setModalInitialRoomId(undefined);
                          setModalInitialBedNumber(undefined);
                          setIsWorkerModalOpen(true);
                        }}
                        onExportCSV={handleExportCSV}
                        onOpenStructureManager={() => setIsStructureModalOpen(true)}
                        onDeleteZone={handleDeleteZone}
                      />
                    ) : (
                      <RoomGridView
                        zones={zones}
                        rooms={filteredRooms}
                        workers={workers}
                        searchQuery={filters.searchQuery}
                        selectedZoneId={filters.zoneId}
                        selectedBlockId={filters.blockId}
                        onFilterBlock={(blockId) => handleFilterChange({ blockId })}
                        onSelectRoom={(room) => setSelectedRoom(room)}
                        onAddWorkerToRoom={(room) => handleOpenAddWorkerToRoom(room)}
                        onSelectWorker={(worker) => setWorkerToViewProfile(worker)}
                        onBackToOverview={() => handleFilterChange({ zoneId: 'all', blockId: 'all', searchQuery: '' })}
                        onSelectZone={(zoneId) => handleFilterChange({ zoneId, blockId: 'all' })}
                        onDeleteZone={handleDeleteZone}
                        onOpenIdCardsPrint={(room) => setRoomForIdCardsModal(room)}
                      />
                    )
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
                      onSelectRoom={(room) => setSelectedRoom(room)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>

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
          onOpenIdCardsPrint={() => setRoomForIdCardsModal(selectedRoom)}
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
        onDeleteZoneDirectly={handleDeleteZone}
      />

      {/* Modal 6: Xuất & In Ảnh Căn Cước Công Dân (2 Mặt) theo Phòng */}
      {roomForIdCardsModal && (
        <RoomIdCardsModal
          room={roomForIdCardsModal}
          zone={zones.find((z) => z.id === roomForIdCardsModal.zoneId)}
          block={zones.find((z) => z.id === roomForIdCardsModal.zoneId)?.blocks?.find((b) => b.id === roomForIdCardsModal.blockId)}
          workers={workers.filter((w) => w.roomId === roomForIdCardsModal.id)}
          isOpen={!!roomForIdCardsModal}
          onClose={() => setRoomForIdCardsModal(null)}
          onUpdateWorkerPhotos={handleUpdateWorkerPhotos}
        />
      )}

      {/* Modal 7: Lưu Trữ & Đồng Bộ Dữ Liệu Google Firebase Firestore */}
      <FirebaseSyncModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        workers={workers}
        zones={zones}
        rooms={rooms}
        onRestoreData={handleRestoreData}
        syncStatus={syncStatus}
      />

      {/* Floating Shortcut Toast Notification */}
      {shortcutToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div className="bg-[#111827] text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-[#0088FF] text-white flex items-center justify-center font-black font-mono text-xs shadow-xs">
              {shortcutToast.key}
            </div>
            <div className="text-xs font-bold text-slate-100">
              {shortcutToast.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
