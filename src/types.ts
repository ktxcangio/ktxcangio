export interface Worker {
  id: string;
  code: string; // 1. Mã nhân viên
  fullName: string; // 2. Họ và tên
  gender: 'Nam' | 'Nữ'; // 3. Giới tính (click chọn Nam hoặc Nữ)
  birthDate: string; // 4. Ngày, tháng, năm sinh (YYYY-MM-DD)
  address: string; // 5. Thôn/số nhà, Xã/Phường, Tỉnh/Thành Phố
  citizenId: string; // 6. Số CCCD (Quét QR để lấy số CCCD, nhập vào họ tên & địa chỉ)
  teamLeaderName: string; // 7. Tên tổ trưởng
  teamLeaderPhone: string; // 8. SĐT tổ trưởng
  photoUrl?: string; // Ảnh chụp chân dung công nhân
  
  // Vị trí lưu trú trong Ký túc xá (Khu > Dãy > Phòng)
  zoneId: string; // ID Khu (Khu A, B, C, D...)
  blockId: string; // ID Dãy (Dãy 1, Dãy 2...)
  roomId: string; // ID Phòng (Phòng 1, Phòng 2...)
  bedNumber: number; // Số giường (1 -> 20)
  lockerNumber?: number; // Số tủ đồ (1 -> 20 hoặc tự chọn)
  startDate?: string; // Ngày vào ở
  status: 'active' | 'temporary_leave'; // Đang ở | Tạm vắng
  notes?: string; // Ghi chú thêm
  avatarColor?: string;
}

export interface Room {
  id: string;
  zoneId: string;
  blockId: string;
  roomNumber: number;
  name: string; // Tên phòng (VD: Phòng 1, Phòng 2, Phòng P01...)
  maxCapacity: number; // Tối đa 20 người
  bedCount: number; // Số lượng giường ngủ (mặc định 20 hoặc tùy chỉnh)
  lockerCount: number; // Số lượng tủ đồ (mặc định 20 hoặc tùy chỉnh)
  genderType?: 'Nam' | 'Nữ' | 'Hỗn hợp';
  floor?: number;
}

export interface Block {
  id: string;
  zoneId: string;
  name: string; // Tên dãy (VD: Dãy 1, Dãy 2, Dãy A1...)
  blockNumber: number;
  rooms: Room[];
}

export interface Zone {
  id: string;
  code: string; // "A", "B", "C", "D"...
  name: string; // "Khu A", "Khu B", "Khu C", "Khu D"...
  description?: string;
  blocks: Block[];
}

export interface FilterState {
  searchQuery: string;
  zoneId: string; // 'all' or specific zoneId
  blockId: string; // 'all' or specific blockId
  roomStatus: 'all' | 'available' | 'full' | 'empty';
  gender: 'all' | 'Nam' | 'Nữ';
  teamLeaderName?: string;
}

export type ViewMode = 'grid' | 'table' | 'stats';

export interface QrParsedCCCD {
  citizenId: string;
  oldCitizenId?: string;
  fullName: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'Nam' | 'Nữ';
  address: string;
  issueDate?: string;
}
