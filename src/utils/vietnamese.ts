/**
 * Tiện ích xử lý chuỗi Tiếng Việt không dấu và tìm kiếm thông minh
 */

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu thanh
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-zA-Z0-9\s]/g, ' ') // Xóa ký tự đặc biệt nếu cần
    .toLowerCase()
    .trim();
}

/**
 * Kiểm tra chuỗi target có khớp với query tìm kiếm không dấu không
 */
export function matchVietnameseSearch(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const cleanTarget = removeVietnameseTones(target);
  const cleanQuery = removeVietnameseTones(query);

  // Tìm kiếm theo từng từ khóa (token search)
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
  return queryTokens.every(token => cleanTarget.includes(token));
}

/**
 * Format số điện thoại hiển thị đẹp
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Format ngày tháng DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}
