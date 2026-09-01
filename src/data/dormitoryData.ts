import { Zone, Block, Room, Worker } from '../types';

export const INITIAL_ZONES: Zone[] = [
  {
    id: 'zone-a',
    code: 'A',
    name: 'Khu A',
    description: 'Khu ký túc xá A (Nam) - Các dãy phòng tiêu chuẩn tối đa 20 người/phòng',
    blocks: [
      {
        id: 'block-a-1',
        zoneId: 'zone-a',
        name: 'Dãy 1',
        blockNumber: 1,
        rooms: generateInitialRooms('zone-a', 'block-a-1', 'A', 1, 15, 'Nam')
      },
      {
        id: 'block-a-2',
        zoneId: 'zone-a',
        name: 'Dãy 2',
        blockNumber: 2,
        rooms: generateInitialRooms('zone-a', 'block-a-2', 'A', 2, 15, 'Nam')
      },
      {
        id: 'block-a-3',
        zoneId: 'zone-a',
        name: 'Dãy 3',
        blockNumber: 3,
        rooms: generateInitialRooms('zone-a', 'block-a-3', 'A', 3, 15, 'Nam')
      }
    ]
  },
  {
    id: 'zone-b',
    code: 'B',
    name: 'Khu B',
    description: 'Khu ký túc xá B (Nữ) - Các dãy phòng tiêu chuẩn tối đa 20 người/phòng',
    blocks: [
      {
        id: 'block-b-1',
        zoneId: 'zone-b',
        name: 'Dãy 1',
        blockNumber: 1,
        rooms: generateInitialRooms('zone-b', 'block-b-1', 'B', 1, 15, 'Nữ')
      },
      {
        id: 'block-b-2',
        zoneId: 'zone-b',
        name: 'Dãy 2',
        blockNumber: 2,
        rooms: generateInitialRooms('zone-b', 'block-b-2', 'B', 2, 15, 'Nữ')
      }
    ]
  },
  {
    id: 'zone-c',
    code: 'C',
    name: 'Khu C',
    description: 'Khu ký túc xá C - Dãy phòng kỹ thuật & chuyên gia',
    blocks: [
      {
        id: 'block-c-1',
        zoneId: 'zone-c',
        name: 'Dãy 1',
        blockNumber: 1,
        rooms: generateInitialRooms('zone-c', 'block-c-1', 'C', 1, 15, 'Hỗn hợp')
      }
    ]
  },
  {
    id: 'zone-d',
    code: 'D',
    name: 'Khu D',
    description: 'Khu ký túc xá D (Khu mới mở rộng) - Sẵn sàng tiếp nhận thêm dãy & phòng mới',
    blocks: [
      {
        id: 'block-d-1',
        zoneId: 'zone-d',
        name: 'Dãy 1',
        blockNumber: 1,
        rooms: generateInitialRooms('zone-d', 'block-d-1', 'D', 1, 15, 'Nam')
      }
    ]
  }
];

export const ZONES_DATA = INITIAL_ZONES;

export function generateInitialRooms(
  zoneId: string,
  blockId: string,
  zoneCode: string,
  blockNum: number,
  count: number,
  type: 'Nam' | 'Nữ' | 'Hỗn hợp'
): Room[] {
  const rooms: Room[] = [];
  for (let i = 1; i <= count; i++) {
    rooms.push({
      id: `room-${zoneCode.toLowerCase()}-${blockNum}-${i}`,
      zoneId,
      blockId,
      roomNumber: i, // Số thứ tự phòng bắt đầu từ 1
      name: `Phòng ${i}`, // Ví dụ: Phòng 1, Phòng 2, Phòng 3...
      maxCapacity: 20,
      bedCount: 20,
      lockerCount: 20,
      genderType: type,
      floor: Math.ceil(i / 5)
    });
  }
  return rooms;
}

export function generateRooms(zones: Zone[]): Room[] {
  const allRooms: Room[] = [];
  (zones || []).forEach((zone) => {
    (zone.blocks || []).forEach((block) => {
      if (block.rooms && block.rooms.length > 0) {
        // Chuẩn hóa đảm bảo số thứ tự phòng luôn bắt đầu từ 1 (Phòng 1, Phòng 2...)
        const normalized = block.rooms.map((r, idx) => {
          const roomNum = r.roomNumber && r.roomNumber > 0 ? r.roomNumber : idx + 1;
          let name = r.name;
          // Nếu dữ liệu cũ có dạng Phòng 101, 102, 201... thì đổi về Phòng 1, 2...
          if (/^Phòng\s+\d{3,}$/i.test(name)) {
            name = `Phòng ${roomNum}`;
          } else if (!name) {
            name = `Phòng ${roomNum}`;
          }
          return {
            ...r,
            roomNumber: roomNum,
            name,
          };
        });
        allRooms.push(...normalized);
      } else {
        const generated = generateInitialRooms(
          zone.id,
          block.id,
          zone.code || 'A',
          block.blockNumber || 1,
          15,
          'Nam'
        );
        allRooms.push(...generated);
      }
    });
  });
  return allRooms;
}

export function normalizeZones(zones: Zone[]): Zone[] {
  return (zones || []).map((zone) => ({
    ...zone,
    blocks: (zone.blocks || []).map((block) => ({
      ...block,
      rooms: (block.rooms || []).map((r, idx) => {
        const roomNum = r.roomNumber && r.roomNumber > 0 ? r.roomNumber : idx + 1;
        let name = r.name;
        if (/^Phòng\s+\d{3,}$/i.test(name)) {
          name = `Phòng ${roomNum}`;
        } else if (!name) {
          name = `Phòng ${roomNum}`;
        }
        return {
          ...r,
          roomNumber: roomNum,
          name,
        };
      })
    }))
  }));
}

export const DEPARTMENTS = [
  'Xưởng May 1',
  'Xưởng May 2',
  'Xưởng Cắt & Đóng gói',
  'Tổ Kiểm Phẩm QC',
  'Phòng Cơ Điện & Bảo Trì',
  'Kho Vận Logistics',
  'Hành Chính & Nhân Sự'
];

export const AVATAR_COLORS = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-indigo-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-purple-600',
  'bg-cyan-600',
];

export const INITIAL_WORKERS: Worker[] = [
  // Phòng 1 Dãy 1 Khu A
  {
    id: 'wk-001',
    code: 'NV-1001',
    fullName: 'Nguyễn Văn An',
    gender: 'Nam',
    birthDate: '1996-03-15',
    citizenId: '038096001234',
    address: 'Thôn 3, Xã Diễn Hùng, Tỉnh Nghệ An',
    teamLeaderName: 'Phạm Đức Thắng',
    teamLeaderPhone: '0988776655',
    zoneId: 'zone-a',
    blockId: 'block-a-1',
    roomId: 'room-a-1-1',
    bedNumber: 1,
    lockerNumber: 1,
    startDate: '2023-01-10',
    status: 'active',
    notes: 'Phó trưởng phòng 1, phụ trách an ninh trật tự',
    avatarColor: 'bg-blue-600'
  },
  {
    id: 'wk-002',
    code: 'NV-1002',
    fullName: 'Trần Văn Bình',
    gender: 'Nam',
    birthDate: '1998-07-22',
    citizenId: '038098002345',
    address: 'Xã Hoằng Hóa, Huyện Hoằng Hóa, Tỉnh Thanh Hóa',
    teamLeaderName: 'Phạm Đức Thắng',
    teamLeaderPhone: '0988776655',
    zoneId: 'zone-a',
    blockId: 'block-a-1',
    roomId: 'room-a-1-1',
    bedNumber: 2,
    lockerNumber: 2,
    startDate: '2023-02-15',
    status: 'active',
    avatarColor: 'bg-emerald-600'
  },
  {
    id: 'wk-003',
    code: 'NV-1003',
    fullName: 'Lê Hoàng Long',
    gender: 'Nam',
    birthDate: '2001-11-05',
    citizenId: '036201003456',
    address: 'Xã Xuân Hồng, Huyện Xuân Trường, Tỉnh Nam Định',
    teamLeaderName: 'Nguyễn Văn Hùng',
    teamLeaderPhone: '0912345678',
    zoneId: 'zone-a',
    blockId: 'block-a-1',
    roomId: 'room-a-1-1',
    bedNumber: 3,
    lockerNumber: 3,
    startDate: '2023-04-01',
    status: 'active',
    avatarColor: 'bg-indigo-600'
  },
  {
    id: 'wk-004',
    code: 'NV-1004',
    fullName: 'Phạm Đức Thắng',
    gender: 'Nam',
    birthDate: '1992-09-18',
    citizenId: '034092004567',
    address: 'Số 45 Đường Lý Thường Kiệt, TP. Thái Bình, Tỉnh Thái Bình',
    teamLeaderName: 'Phạm Đức Thắng',
    teamLeaderPhone: '0988776655',
    zoneId: 'zone-a',
    blockId: 'block-a-1',
    roomId: 'room-a-1-1',
    bedNumber: 4,
    lockerNumber: 4,
    startDate: '2023-01-20',
    status: 'active',
    notes: 'Tổ trưởng xưởng may 1',
    avatarColor: 'bg-amber-600'
  },
  {
    id: 'wk-005',
    code: 'NV-1005',
    fullName: 'Vũ Minh Tuấn',
    gender: 'Nam',
    birthDate: '1999-12-30',
    citizenId: '024099005678',
    address: 'Thôn Yên Ninh, Xã Tân An, Huyện Yên Dũng, Tỉnh Bắc Giang',
    teamLeaderName: 'Nguyễn Văn Hùng',
    teamLeaderPhone: '0912345678',
    zoneId: 'zone-a',
    blockId: 'block-a-1',
    roomId: 'room-a-1-1',
    bedNumber: 5,
    lockerNumber: 5,
    startDate: '2023-05-12',
    status: 'active',
    avatarColor: 'bg-teal-600'
  },

  // Phòng 1 Dãy 1 Khu B (Nữ)
  {
    id: 'wk-b01',
    code: 'NV-2001',
    fullName: 'Nguyễn Thị Mai',
    gender: 'Nữ',
    birthDate: '1997-08-14',
    citizenId: '038097005432',
    address: 'Thôn 5, Xã Nghi Phú, TP. Vinh, Tỉnh Nghệ An',
    teamLeaderName: 'Lê Thị Thu Thảo',
    teamLeaderPhone: '0977665544',
    zoneId: 'zone-b',
    blockId: 'block-b-1',
    roomId: 'room-b-1-1',
    bedNumber: 1,
    lockerNumber: 1,
    startDate: '2023-02-01',
    status: 'active',
    notes: 'Trưởng phòng 1',
    avatarColor: 'bg-rose-600'
  },
  {
    id: 'wk-b02',
    code: 'NV-2002',
    fullName: 'Trần Thị Thúy',
    gender: 'Nữ',
    birthDate: '2000-04-19',
    citizenId: '037200006543',
    address: 'Xã Quảng Xương, Huyện Quảng Xương, Tỉnh Thanh Hóa',
    teamLeaderName: 'Lê Thị Thu Thảo',
    teamLeaderPhone: '0977665544',
    zoneId: 'zone-b',
    blockId: 'block-b-1',
    roomId: 'room-b-1-1',
    bedNumber: 2,
    lockerNumber: 2,
    startDate: '2023-03-10',
    status: 'active',
    avatarColor: 'bg-purple-600'
  },
  {
    id: 'wk-b03',
    code: 'NV-2003',
    fullName: 'Lê Thị Thu Thảo',
    gender: 'Nữ',
    birthDate: '1995-10-25',
    citizenId: '036095007654',
    address: 'Số 12 Phố Hàng Cấp, TP. Nam Định, Tỉnh Nam Định',
    teamLeaderName: 'Lê Thị Thu Thảo',
    teamLeaderPhone: '0977665544',
    zoneId: 'zone-b',
    blockId: 'block-b-1',
    roomId: 'room-b-1-1',
    bedNumber: 3,
    lockerNumber: 3,
    startDate: '2023-01-15',
    status: 'active',
    notes: 'Tổ trưởng tổ kiểm tra chất lượng (QC)',
    avatarColor: 'bg-cyan-600'
  }
];

export const STORAGE_KEY_WORKERS = 'ktx_workers_cloud_backup_v2';
export const STORAGE_LOCAL_KEY_WORKERS = 'ktx_workers_cloud_backup_v2';
export const STORAGE_LOCAL_KEY_ZONES = 'ktx_zones_cloud_backup_v2';
