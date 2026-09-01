import { QrParsedCCCD } from '../types';

/**
 * Hàm phân tích chuỗi QR code trên thẻ Căn cước công dân (CCCD) gắn chip Việt Nam
 * Cấu trúc chuẩn QR CCCD:
 * [Số CCCD]|[Số CMND cũ]|[Họ và tên]|[Ngày sinh DDMMYYYY]|[Giới tính Nam/Nữ]|[Địa chỉ thường trú/Quê quán]|[Ngày cấp DDMMYYYY]
 * Ví dụ: 038096001234|187654321|NGUYEN VAN AN|15031996|Nam|Thôn 1, Xã Diễn Hùng, Huyện Diễn Châu, Tỉnh Nghệ An|10052021
 * Hoặc định dạng không có CMND cũ hoặc có ký tự dấu gạch dọc:
 * 038096001234||Nguyễn Văn An|15031996|Nam|Xã Diễn Hùng, Tỉnh Nghệ An|10052021
 */
export function parseVietnameseCCCDQr(qrText: string): QrParsedCCCD | null {
  if (!qrText || typeof qrText !== 'string') return null;
  const raw = qrText.trim();

  // Kiểm tra chuỗi chứa dấu gạch đứng |
  if (raw.includes('|')) {
    const parts = raw.split('|');
    if (parts.length >= 5) {
      const citizenId = parts[0]?.trim() || '';
      const oldCitizenId = parts[1]?.trim() || '';
      const fullName = parts[2]?.trim() || '';
      const rawBirthDate = parts[3]?.trim() || '';
      const rawGender = parts[4]?.trim() || '';
      const address = parts[5]?.trim() || '';
      const issueDate = parts[6]?.trim() || '';

      // Chuẩn hóa ngày sinh DDMMYYYY sang YYYY-MM-DD
      let birthDate = '';
      if (rawBirthDate.length === 8 && /^\d{8}$/.test(rawBirthDate)) {
        const day = rawBirthDate.slice(0, 2);
        const month = rawBirthDate.slice(2, 4);
        const year = rawBirthDate.slice(4, 8);
        birthDate = `${year}-${month}-${day}`;
      } else if (rawBirthDate.length === 4 && /^\d{4}$/.test(rawBirthDate)) {
        birthDate = `${rawBirthDate}-01-01`;
      }

      // Chuẩn hóa giới tính
      let gender: 'Nam' | 'Nữ' = 'Nam';
      if (rawGender.toLowerCase() === 'nữ' || rawGender.toLowerCase() === 'nu' || rawGender.toLowerCase() === 'female' || rawGender === 'Nữ') {
        gender = 'Nữ';
      }

      // Chuyển Họ tên sang dạng viết hoa đầu mỗi từ (Title Case) nếu là IN HOA TOÀN BỘ
      const formattedName = formatTitleCase(fullName);

      return {
        citizenId,
        oldCitizenId,
        fullName: formattedName,
        birthDate,
        gender,
        address,
        issueDate
      };
    }
  }

  // Trường hợp quét chỉ có số CCCD (12 chữ số)
  const cleanDigits = raw.replace(/\D/g, '');
  if (cleanDigits.length === 12) {
    return {
      citizenId: cleanDigits,
      fullName: '',
      birthDate: '',
      gender: 'Nam',
      address: ''
    };
  }

  return null;
}

function formatTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
