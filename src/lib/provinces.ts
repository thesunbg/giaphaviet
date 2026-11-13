/**
 * 34 đơn vị hành chính cấp tỉnh của Việt Nam sau sáp nhập
 * (Nghị quyết 202/2025/QH15, chính quyền mới hoạt động từ 01/7/2025):
 * 6 thành phố trực thuộc trung ương và 28 tỉnh.
 *
 * `mergedFrom` ghi các tỉnh/thành cũ đã nhập vào đơn vị mới, dùng để gợi ý
 * khi dữ liệu cũ còn ghi tên tỉnh trước sáp nhập.
 */

export interface Province {
  name: string;
  type: "city" | "province";
  mergedFrom?: string[];
}

export const VN_PROVINCES: Province[] = [
  // ===== 6 thành phố trực thuộc trung ương =====
  { name: "Hà Nội", type: "city" },
  { name: "Hải Phòng", type: "city", mergedFrom: ["Hải Dương"] },
  { name: "Huế", type: "city", mergedFrom: ["Thừa Thiên Huế"] },
  { name: "Đà Nẵng", type: "city", mergedFrom: ["Quảng Nam"] },
  { name: "TP. Hồ Chí Minh", type: "city", mergedFrom: ["Bình Dương", "Bà Rịa - Vũng Tàu"] },
  { name: "Cần Thơ", type: "city", mergedFrom: ["Sóc Trăng", "Hậu Giang"] },

  // ===== 28 tỉnh =====
  { name: "An Giang", type: "province", mergedFrom: ["Kiên Giang"] },
  { name: "Bắc Ninh", type: "province", mergedFrom: ["Bắc Giang"] },
  { name: "Cà Mau", type: "province", mergedFrom: ["Bạc Liêu"] },
  { name: "Cao Bằng", type: "province" },
  { name: "Điện Biên", type: "province" },
  { name: "Đắk Lắk", type: "province", mergedFrom: ["Phú Yên"] },
  { name: "Đồng Nai", type: "province", mergedFrom: ["Bình Phước"] },
  { name: "Đồng Tháp", type: "province", mergedFrom: ["Tiền Giang"] },
  { name: "Gia Lai", type: "province", mergedFrom: ["Bình Định"] },
  { name: "Hà Tĩnh", type: "province" },
  { name: "Hưng Yên", type: "province", mergedFrom: ["Thái Bình"] },
  { name: "Khánh Hòa", type: "province", mergedFrom: ["Ninh Thuận"] },
  { name: "Lai Châu", type: "province" },
  { name: "Lạng Sơn", type: "province" },
  { name: "Lào Cai", type: "province", mergedFrom: ["Yên Bái"] },
  { name: "Lâm Đồng", type: "province", mergedFrom: ["Đắk Nông", "Bình Thuận"] },
  { name: "Nghệ An", type: "province" },
  { name: "Ninh Bình", type: "province", mergedFrom: ["Hà Nam", "Nam Định"] },
  { name: "Phú Thọ", type: "province", mergedFrom: ["Hòa Bình", "Vĩnh Phúc"] },
  { name: "Quảng Ngãi", type: "province", mergedFrom: ["Kon Tum"] },
  { name: "Quảng Ninh", type: "province" },
  { name: "Quảng Trị", type: "province", mergedFrom: ["Quảng Bình"] },
  { name: "Sơn La", type: "province" },
  { name: "Tây Ninh", type: "province", mergedFrom: ["Long An"] },
  { name: "Thái Nguyên", type: "province", mergedFrom: ["Bắc Kạn"] },
  { name: "Thanh Hóa", type: "province" },
  { name: "Tuyên Quang", type: "province", mergedFrom: ["Hà Giang"] },
  { name: "Vĩnh Long", type: "province", mergedFrom: ["Bến Tre", "Trà Vinh"] },
];

export const VN_PROVINCE_NAMES = VN_PROVINCES.map((p) => p.name);

export const PROVINCE_OPTIONS = VN_PROVINCES.map((p) => ({
  value: p.name,
  label: p.type === "city" ? `${p.name} (TP)` : p.name,
}));

export const DEFAULT_COUNTRY = "Việt Nam";

export const COUNTRY_OPTIONS = [
  { value: "Việt Nam", label: "Việt Nam" },
  { value: "Hoa Kỳ", label: "Hoa Kỳ" },
  { value: "Úc", label: "Úc" },
  { value: "Canada", label: "Canada" },
  { value: "Nhật Bản", label: "Nhật Bản" },
  { value: "Hàn Quốc", label: "Hàn Quốc" },
  { value: "Đức", label: "Đức" },
  { value: "Pháp", label: "Pháp" },
  { value: "Nga", label: "Nga" },
  { value: "Khác", label: "Nước khác" },
];

export function isVietnam(country: string | null | undefined): boolean {
  if (!country) return true; // mặc định coi như Việt Nam
  const normalized = country.trim().toLowerCase();
  return ["việt nam", "vietnam", "viet nam", "vn"].includes(normalized);
}

/**
 * Chuyển tên tỉnh/thành cũ (trước sáp nhập) sang tên mới.
 * Trả về chính nó nếu đã là tên mới, null nếu không nhận ra.
 */
export function toCurrentProvince(name: string | null | undefined): string | null {
  if (!name) return null;
  const target = name.trim().toLowerCase().replace(/^(tỉnh|tp\.?|thành phố)\s+/i, "");

  for (const province of VN_PROVINCES) {
    if (province.name.toLowerCase() === target) return province.name;
    if (province.mergedFrom?.some((old) => old.toLowerCase() === target)) return province.name;
  }
  return null;
}
