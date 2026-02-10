export const VI_LABELS = {
  appName: "Gia Phả Việt",
  appDescription: "Hệ thống quản trị gia phả dòng họ",

  // Navigation
  giapha: "Gia Phả",
  quanTri: "Quản Trị",
  thanhVien: "Thành Viên",
  quanHe: "Quan Hệ",
  suKien: "Sự Kiện",
  tongQuan: "Tổng Quan",

  // Member fields
  hoTen: "Họ tên",
  ngaySinh: "Ngày sinh",
  ngayMat: "Ngày mất",
  gioiTinh: "Giới tính",
  nam: "Nam",
  nu: "Nữ",
  ngheNghiep: "Nghề nghiệp",
  noiO: "Nơi ở",
  tieuSu: "Tiểu sử",
  ghiChu: "Ghi chú",
  anhDaiDien: "Ảnh đại diện",
  thuTu: "Thứ tự trong gia đình",
  moiQuanHe: "Mối quan hệ",
  thongTinMoPhan: "Thông tin mộ phần",
  ngayGio: "Ngày giỗ",
  conSong: "Còn sống",
  daMat: "Đã mất",
  doi: "Đời",

  // Relationships
  cha: "Cha",
  me: "Mẹ",
  vo: "Vợ",
  chong: "Chồng",
  conRuot: "Con ruột",
  conNuoi: "Con nuôi",
  conGhe: "Con ghẻ",
  ngayCuoi: "Ngày cưới",

  // Actions
  themMoi: "Thêm mới",
  chinhSua: "Chỉnh sửa",
  xoa: "Xóa",
  luu: "Lưu",
  huy: "Hủy",
  timKiem: "Tìm kiếm",
  xemChiTiet: "Xem chi tiết",
  quayLai: "Quay lại",

  // Messages
  themThanhCong: "Thêm thành công!",
  suaThanhCong: "Cập nhật thành công!",
  xoaThanhCong: "Xóa thành công!",
  xacNhanXoa: "Bạn có chắc chắn muốn xóa?",
  khongTimThay: "Không tìm thấy dữ liệu",
  loiHeThong: "Đã xảy ra lỗi. Vui lòng thử lại.",
} as const;

export const GENDER_OPTIONS = [
  { value: "male", label: VI_LABELS.nam },
  { value: "female", label: VI_LABELS.nu },
] as const;

export const RELATIONSHIP_TYPES = [
  { value: "biological", label: VI_LABELS.conRuot },
  { value: "adopted", label: VI_LABELS.conNuoi },
  { value: "step", label: VI_LABELS.conGhe },
] as const;

export const CALENDAR_TYPE_OPTIONS = [
  { value: "solar", label: "Dương lịch" },
  { value: "lunar", label: "Âm lịch" },
] as const;

export const GENERATION_COLORS = [
  "bg-red-100 border-red-300 text-red-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-amber-100 border-amber-300 text-amber-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-lime-100 border-lime-300 text-lime-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-sky-100 border-sky-300 text-sky-800",
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-indigo-100 border-indigo-300 text-indigo-800",
  "bg-violet-100 border-violet-300 text-violet-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800",
  "bg-pink-100 border-pink-300 text-pink-800",
];
