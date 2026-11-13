# Gia Pha Viet - Hệ Thống Quản Trị Gia Phả

Ứng dụng web quản lý gia phả dòng họ, hỗ trợ hiển thị cây gia phả trực quan, quản lý thông tin thành viên, lịch gia đình với âm lịch/dương lịch, và trang quản trị bảo mật bằng mật khẩu.

## Demo

https://giaphahonguyen.app.nguyenvando.com/gia-pha

## Tech Stack

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Next.js | 16.1.6 | Framework React (App Router) |
| React | 19.2.3 | UI Library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Prisma | 5.22 | ORM |
| PostgreSQL | 14+ | Cơ sở dữ liệu |
| Zod | 4.3.6 | Validation |
| react-zoom-pan-pinch | 3.7.0 | Zoom/pan cho cây gia phả |
| lucide-react | 0.563.0 | Icons |
| react-hot-toast | 2.6.0 | Toast notifications |

---

## Tính Năng

### Đăng Nhập & Phân Quyền

Toàn bộ site yêu cầu đăng nhập — người ngoài dòng họ không xem được gì ngoài trang đăng nhập.

| Hình thức | Dành cho | Vào được | Ghi chú |
|-----------|----------|----------|---------|
| **Tài khoản cá nhân** (`/dang-nhap`) | Con cháu trong họ | Gia phả, lịch, thành viên (+ quản trị nếu có quyền) | Số điện thoại + mật khẩu |
| **Mã xem gia phả** (`/ma-xem`) | Các cụ già, người không lập tài khoản | Chỉ xem gia phả, lịch, thành viên | Mã 6 chữ số, nhập một lần, thiết bị nhớ 1 năm |
| **Mật khẩu quản trị cũ** (`/admin/login`) | Lối vào dự phòng | Toàn quyền quản trị | Dùng `ADMIN_PASSWORD`, nên chỉ giữ cho trường hợp khẩn cấp |

**Vai trò tài khoản**: `admin` (toàn quyền, quản lý tài khoản & mã mời) · `editor` (sửa dữ liệu gia phả) · `member` (chỉ xem + tương tác).

**Đăng ký**: người trong họ cần **mã mời** do quản trị phát (`/admin/ma-moi`), đăng ký xong quản trị duyệt tại `/admin/tai-khoan` (hoặc bật "tự động duyệt" trên mã mời).

**Tạo tài khoản quản trị đầu tiên**:

```bash
npm run create-admin -- "Nguyễn Văn A" 0912345678 matkhaucuaban
```

> Người trong gia phả (`Member`) và tài khoản (`User`) là hai thứ tách biệt: 360 cụ trong gia phả không cần tài khoản nào. Một tài khoản có thể liên kết tới một người trong gia phả, nhưng không bắt buộc.

---

### Trang Công Khai

#### Cây Gia Phả (`/gia-pha`)
- Hiển thị cây gia phả đa thế hệ dạng đồ họa
- Zoom in/out, kéo thả (pan) để di chuyển
- **Chọn số đời hiển thị**: Dropdown "Tất cả", "Đến Đời 1", "Đến Đời 2", ...
- **Tìm kiếm theo tên**: Gõ tên thành viên, cây tự động mở rộng đến kết quả và highlight bằng viền vàng
- Click vào thành viên để xem thông tin chi tiết (popup)
- Badge màu theo đời (16 màu xoay vòng)
- Hiển thị cặp vợ chồng cạnh nhau, nối bằng đường kẻ

#### Lịch Gia Đình (`/lich`)
- Tổng hợp các ngày quan trọng: ngày giỗ, sinh nhật, sự kiện
- Hỗ trợ **âm lịch** và **dương lịch** (hiển thị icon mặt trăng/mặt trời)
- Lọc theo loại: Tất cả / Ngày giỗ / Sinh nhật / Sự kiện
- Lọc theo loại lịch: Âm lịch / Dương lịch / Tất cả
- Tìm kiếm theo tên thành viên
- Thẻ thống kê tổng số ngày giỗ, sinh nhật, sự kiện

#### Bảng Tin Dòng Họ (`/feed`) — cần tài khoản
- Đăng bài kèm ảnh (tối đa 10 ảnh/bài), thả tim, bình luận
- Quản trị/biên tập đăng được **Thông báo** và ghim lên đầu bảng tin
- Cột bên phải: **ngày giỗ, sinh nhật, sự kiện sắp tới trong 45 ngày**
  - Ngày giỗ âm lịch được **quy đổi sang dương lịch** để biết còn bao nhiêu ngày
- Mã xem gia phả (các cụ) không vào được khu vực này

#### Album Ảnh Dòng Họ (`/anh`) — cần tài khoản
- Mọi thành viên tải ảnh lên (giỗ chạp, họp họ, nhà thờ họ...), có chú thích
- Xem ảnh lớn, xóa ảnh của mình (quản trị/biên tập xóa được mọi ảnh)
- Ảnh gắn với thành viên sẽ hiện trong trang chi tiết của người đó

#### Trò Chuyện Dòng Họ (`/chat`) — cần tài khoản
- Phòng chat chung cho con cháu, tin nhắn mới tự cập nhật (5 giây/lần)

#### Chi Tiết Thành Viên (`/thanh-vien/[id]`)
- Ảnh đại diện (hoặc icon mặc định theo giới tính)
- Thông tin: họ tên, năm sinh/mất, đời thứ, giới tính, nghề nghiệp, nơi ở
- Ngày giỗ (âm/dương lịch)
- Tiểu sử, ghi chú
- **Quan hệ gia đình**: Cha mẹ, vợ/chồng, con cái (click để xem chi tiết từng người)
- Sự kiện quan trọng
- Thông tin mộ phần (nếu đã mất)

---

### Trang Quản Trị (`/admin`)

> Trang quản trị được bảo vệ bằng mật khẩu. Truy cập `/admin` sẽ tự động chuyển đến trang đăng nhập.

#### Đăng Nhập (`/admin/login`)
- Nhập mật khẩu admin để truy cập
- Hỗ trợ hiện/ẩn mật khẩu
- Sau đăng nhập, chuyển về trang đích ban đầu

#### Tổng Quan (`/admin`)
- Thống kê: Tổng thành viên, quan hệ cha-con, hôn nhân, sự kiện
- Biểu đồ phân bố theo đời (thanh ngang + phần trăm)

#### Quản Lý Thành Viên (`/admin/thanh-vien`)
- Danh sách thành viên dạng bảng (sắp xếp theo đời + thứ tự)
- **Tìm kiếm theo tên** real-time
- Hiển thị: ảnh, tên, ngày sinh, đời, giới tính, nghề nghiệp, tình trạng
- Nút sửa (bút chì) và xóa (thùng rác) cho mỗi thành viên

#### Thêm / Sửa Thành Viên
- Form đầy đủ: họ tên, giới tính, đời thứ, thứ tự trong gia đình
- **Date picker thông minh** cho ngày sinh, ngày mất, ngày giỗ:
  - 3 chế độ: **Ngày đầy đủ** (DD/MM/YYYY) | **Tháng & năm** (MM/YYYY) | **Chỉ năm** (YYYY)
  - Dương lịch: Calendar popup để chọn ngày
  - Âm lịch: Dropdown chọn ngày/tháng/năm
  - Toggle âm lịch / dương lịch cho mỗi trường ngày
- Nghề nghiệp, nơi ở, tiểu sử, ghi chú
- Thông tin mộ phần (hiện khi chọn "Đã mất")
- Upload ảnh đại diện (JPEG/PNG/WebP, tối đa 5MB)

#### Quản Lý Quan Hệ (`/admin/quan-he`)
- **Quan hệ cha-con**: Chọn cha/mẹ + con từ dropdown, loại quan hệ (ruột/nuôi/kế)
- **Hôn nhân**: Chọn 2 người, ngày cưới, thứ tự (hỗ trợ đa thê)
- Danh sách tất cả quan hệ với nút xóa

#### Quản Lý Sự Kiện (`/admin/su-kien`)
- Thêm sự kiện: chọn thành viên, tiêu đề, ngày, loại lịch (âm/dương), mô tả
- Danh sách sự kiện với nút xóa

#### Import JSON (`/admin/import`)
- Import dữ liệu gia phả từ file JSON
- Hỗ trợ paste JSON trực tiếp hoặc upload file
- Cấu trúc đệ quy: thành viên gốc → vợ/chồng → con cái → cháu...
- **Cảnh báo**: Import sẽ xóa toàn bộ dữ liệu cũ
- Hiển thị thống kê sau import

#### Export Gia Phả (`/admin/export`)
- **Export JSON**: tải toàn bộ gia phả (cây lồng nhau, đầy đủ thành viên, hôn nhân, quan hệ cha-mẹ-con, ngày giỗ, mộ phần, ảnh, sự kiện)
  - File export **import lại được nguyên trạng** qua trang Import → dùng làm bản sao lưu
  - Xem trước / copy JSON ngay trên trang
- **Export CSV**: danh sách thành viên dạng bảng (mở bằng Excel / Google Sheets, UTF-8 có BOM)
  - Mỗi thành viên một dòng, kèm tên cha, mẹ, vợ/chồng, ngày giỗ, nghề nghiệp, nơi ở
- Hiển thị thống kê số thành viên / quan hệ / hôn nhân / sự kiện sẽ được export

#### Thông Tin Dòng Họ (`/admin/cai-dat`) — chỉ quản trị
- Tên dòng họ, tiêu đề cây gia phả, nhà thờ họ/từ đường, **địa chỉ cụ thể**, SĐT liên hệ, giới thiệu
- Hiển thị ở đầu trang, trang cây gia phả và chân trang

#### Tài Khoản (`/admin/tai-khoan`) — chỉ quản trị
- Duyệt tài khoản mới đăng ký, khóa/mở khóa, đổi vai trò, đặt lại mật khẩu, xóa
- Tạo sẵn tài khoản cho người trong họ
- Luôn giữ ít nhất một quản trị đang hoạt động (không tự khóa/hạ quyền chính mình)

#### Mã Mời & Mã Xem (`/admin/ma-moi`) — chỉ quản trị
- **Mã mời**: tạo mã cho người trong họ tự đăng ký (giới hạn lượt dùng, hạn dùng, tùy chọn tự động duyệt)
- **Mã xem gia phả**: mã 6 chữ số cho các cụ, bật/tắt hoặc xóa bất cứ lúc nào

#### Sidebar
- Điều hướng: Tổng Quan, Thành Viên, Quan Hệ, Sự Kiện, Import JSON, Export JSON, Tài Khoản, Mã Mời, Thông Tin Dòng Họ
- Link "Xem Gia Phả" (mở trang công khai)
- Nút **Đăng Xuất**

---

## Cài Đặt

### Yêu cầu
- Node.js >= 18 (khuyến nghị v20+; script chuyển dữ liệu từ SQLite cần Node >= 22)
- PostgreSQL >= 14 (local, Docker, hoặc dịch vụ như Neon / Supabase / RDS)
- npm

### Các bước

```bash
# 1. Clone project
git clone <repository-url>
cd giaphaviet

# 2. Cài đặt dependencies
npm install

# 3. Tạo database PostgreSQL (ví dụ với psql)
createdb giaphaviet
# hoặc: docker run -d --name giaphaviet-db -e POSTGRES_PASSWORD=postgres \
#         -e POSTGRES_DB=giaphaviet -p 5432:5432 postgres:16

# 4. Tạo file .env và điền DATABASE_URL
cp .env.example .env

# 5. Tạo bảng và generate Prisma client
npx prisma generate
npx prisma migrate deploy      # production
# npx prisma migrate dev       # development

# 6. (Tùy chọn) Seed dữ liệu mẫu
npm run seed

# 7. Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### Build production

```bash
npm run build
npm run start
```

---

## Cấu Hình (.env)

```env
# Chuỗi kết nối PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/giaphaviet?schema=public"
# Dịch vụ cloud (Neon, Supabase, RDS...) thường cần thêm: &sslmode=require

# Mật khẩu đăng nhập admin (thay đổi cho production!)
ADMIN_PASSWORD=giaphaviet2024

# Khóa bí mật cho session token (thay đổi cho production!)
AUTH_SECRET=thay-bang-chuoi-ngau-nhien-dai-32-ky-tu
```

Xem file mẫu [`.env.example`](.env.example).

> **Lưu ý**: Đổi `ADMIN_PASSWORD` và `AUTH_SECRET` khi deploy production. Thay đổi `AUTH_SECRET` sẽ đăng xuất tất cả session hiện tại.

### Chuyển dữ liệu từ bản SQLite cũ sang PostgreSQL

Bản trước dùng SQLite (`prisma/dev.db`). Để giữ nguyên dữ liệu khi chuyển sang PostgreSQL:

```bash
node scripts/sqlite-to-json.mjs prisma/dev.db gia-pha-backup.json
```

Sau đó tạo database PostgreSQL, chạy `npx prisma migrate deploy`, đăng nhập `/admin/import` và import file `gia-pha-backup.json`.
Script đọc trực tiếp file SQLite (cần Node >= 22) và xuất ra đúng định dạng của trang Import, giữ cả quan hệ với mẹ, con nuôi, ngày giỗ và sự kiện.

---

## Hướng Dẫn Sử Dụng

### Trang Công Khai

| Trang | URL | Mô tả |
|-------|-----|-------|
| Cây Gia Phả | `/gia-pha` | Xem cây gia phả, zoom/pan, tìm kiếm |
| Lịch Gia Đình | `/lich` | Xem ngày giỗ, sinh nhật, sự kiện |
| Chi Tiết Thành Viên | `/thanh-vien/[id]` | Xem thông tin chi tiết 1 thành viên |

### Trang Quản Trị

1. Truy cập `/admin` → tự động chuyển đến `/admin/login`
2. Nhập mật khẩu (mặc định: `giaphaviet2024`)
3. Sau đăng nhập, sử dụng sidebar để điều hướng:
   - **Tổng Quan**: Xem thống kê tổng quan
   - **Thành Viên**: Thêm/sửa/xóa thành viên, tìm kiếm theo tên
   - **Quan Hệ**: Thiết lập quan hệ cha-con và hôn nhân
   - **Sự Kiện**: Thêm sự kiện quan trọng cho thành viên
   - **Import JSON**: Import dữ liệu hàng loạt từ file JSON
   - **Export JSON**: Tải bản sao lưu toàn bộ gia phả (JSON) hoặc danh sách thành viên (CSV)
   - **Thông Tin Dòng Họ**: Khai báo tên dòng họ, nhà thờ họ, địa chỉ
4. Nhấn **Đăng Xuất** ở cuối sidebar khi hoàn tất

### Import JSON

Cấu trúc file JSON hỗ trợ:

```json
{
  "familyName": "Nguyễn",
  "root": {
    "fullName": "Nguyễn Văn A",
    "gender": "male",
    "generation": 1,
    "birthOrder": 1,
    "birthDate": "1920",
    "isAlive": false,
    "deathDate": "1990",
    "deathAnniversary": "10/03",
    "deathAnniversaryType": "lunar",
    "occupation": "Nông dân",
    "spouses": [
      {
        "fullName": "Trần Thị B",
        "gender": "female",
        "isAlive": false
      }
    ],
    "children": [
      {
        "fullName": "Nguyễn Văn C",
        "gender": "male",
        "generation": 2,
        "birthOrder": 1,
        "children": []
      }
    ]
  }
}
```

---

## Cấu Trúc Thư Mục

```
giaphaviet/
├── prisma/
│   ├── schema.prisma          # Database schema (5 bảng, PostgreSQL)
│   ├── migrations/            # Prisma migrations
│   └── seed.ts                # Dữ liệu mẫu
├── scripts/
│   └── sqlite-to-json.mjs     # Chuyển dữ liệu SQLite cũ -> JSON để import
├── public/
│   └── uploads/               # Ảnh upload
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home (redirect → /gia-pha)
│   │   ├── (public)/          # Trang công khai
│   │   │   ├── layout.tsx     # Header + Footer
│   │   │   ├── gia-pha/       # Cây gia phả
│   │   │   ├── lich/          # Lịch gia đình
│   │   │   └── thanh-vien/    # Chi tiết thành viên
│   │   ├── admin/             # Trang quản trị
│   │   │   ├── layout.tsx     # Sidebar layout (auth-aware)
│   │   │   ├── login/         # Đăng nhập
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── thanh-vien/    # CRUD thành viên
│   │   │   ├── quan-he/       # Quản lý quan hệ
│   │   │   ├── su-kien/       # Quản lý sự kiện
│   │   │   ├── import/        # Import JSON
│   │   │   └── export/        # Export JSON / CSV
│   │   └── api/               # API routes
│   │       ├── auth/          # Login/Logout
│   │       ├── members/       # CRUD thành viên
│   │       ├── relationships/ # Quan hệ cha-con
│   │       ├── marriages/     # Hôn nhân
│   │       ├── events/        # Sự kiện
│   │       ├── calendar/      # Lịch tổng hợp
│   │       ├── tree/          # Cây gia phả
│   │       ├── upload/        # Upload ảnh
│   │       ├── import/        # Import dữ liệu
│   │       └── export/        # Export dữ liệu
│   ├── components/
│   │   ├── layout/            # Header, Footer, AdminSidebar
│   │   ├── tree/              # FamilyTree, TreeBranch, TreeNode
│   │   ├── member/            # MemberForm, MemberList, EventManager
│   │   ├── calendar/          # CalendarList
│   │   └── ui/                # Button, Input, Card, DateInput, CalendarPopup...
│   ├── lib/
│   │   ├── auth.ts            # Authentication (HMAC token)
│   │   ├── prisma.ts          # Prisma client
│   │   ├── validators.ts      # Zod schemas
│   │   ├── constants.ts       # Hằng số, labels
│   │   ├── utils.ts           # Utility functions
│   │   └── tree-builder.ts    # Xây dựng cây từ DB
│   ├── types/                 # TypeScript types
│   └── middleware.ts          # Route protection
└── package.json
```

---

## API Routes

### Authentication
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/login` | Đăng nhập (password) | - |
| POST | `/api/auth/logout` | Đăng xuất | - |

### Thành Viên
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/members` | Danh sách (search, pagination) | - |
| POST | `/api/members` | Thêm thành viên | Required |
| GET | `/api/members/[id]` | Chi tiết (kèm quan hệ) | - |
| PUT | `/api/members/[id]` | Cập nhật thành viên | Required |
| DELETE | `/api/members/[id]` | Xóa thành viên | Required |

### Quan Hệ
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/relationships` | Thêm quan hệ cha-con | Required |
| DELETE | `/api/relationships/[id]` | Xóa quan hệ | Required |

### Hôn Nhân
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/marriages` | Thêm hôn nhân | Required |
| PUT | `/api/marriages/[id]` | Cập nhật hôn nhân | Required |
| DELETE | `/api/marriages/[id]` | Xóa hôn nhân | Required |

### Sự Kiện
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/events` | Danh sách sự kiện | - |
| POST | `/api/events` | Thêm sự kiện | Required |
| PUT | `/api/events/[id]` | Cập nhật sự kiện | Required |
| DELETE | `/api/events/[id]` | Xóa sự kiện | Required |

### Tài khoản
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| POST | `/api/auth/login` | Đăng nhập (SĐT + mật khẩu) | - |
| POST | `/api/auth/register` | Đăng ký bằng mã mời | - |
| POST | `/api/auth/view-code` | Vào bằng mã xem gia phả | - |
| POST | `/api/auth/logout` | Đăng xuất | - |
| GET/POST | `/api/admin/users` | Danh sách / tạo tài khoản | Admin |
| PATCH/DELETE | `/api/admin/users/[id]` | Duyệt, khóa, đổi vai trò, xóa | Admin |
| GET/POST | `/api/admin/invites` | Danh sách / tạo mã mời | Admin |
| GET/POST | `/api/admin/view-code` | Danh sách / tạo mã xem | Admin |

### Tương tác nội bộ
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET/POST | `/api/feed` | Bảng tin: danh sách / đăng bài | Tài khoản |
| PATCH/DELETE | `/api/feed/[id]` | Ghim / sửa / xóa bài | Tài khoản |
| POST | `/api/feed/[id]/comments` | Bình luận | Tài khoản |
| POST | `/api/feed/[id]/reactions` | Thả tim (bật/tắt) | Tài khoản |
| GET/POST | `/api/chat` | Phòng chat chung | Tài khoản |
| GET/POST | `/api/photos` | Album ảnh dòng họ | Tài khoản |
| GET | `/api/anniversaries?days=45` | Ngày giỗ/sinh nhật sắp tới (quy đổi âm → dương) | Đã đăng nhập |
| GET/PUT | `/api/admin/settings` | Thông tin dòng họ | Admin |

### Khác
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/tree` | Cây gia phả (đệ quy) | - |
| GET | `/api/calendar` | Lịch tổng hợp | - |
| POST | `/api/upload` | Upload ảnh (max 5MB) | Required |
| POST | `/api/import` | Import JSON (xóa dữ liệu cũ) | Required |
| GET | `/api/export?format=json` | Export toàn bộ gia phả (JSON, import lại được) | Required |
| GET | `/api/export?format=csv` | Export danh sách thành viên (CSV cho Excel) | Required |

---

## Database Schema

### Member (Thành viên)
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| id | String (cuid) | ID tự sinh |
| fullName | String | Họ tên đầy đủ |
| birthDate | String? | Ngày sinh (VD: "1990", "15/03/1990") |
| birthDateType | String? | "solar" hoặc "lunar" |
| deathDate | String? | Ngày mất |
| deathDateType | String? | "solar" hoặc "lunar" |
| isAlive | Boolean | Còn sống hay đã mất |
| gender | String | "male" hoặc "female" |
| generation | Int | Đời thứ mấy |
| birthOrder | Int | Thứ tự trong gia đình |
| occupation | String? | Nghề nghiệp |
| country | String? | Quốc gia đang sinh sống (mặc định "Việt Nam") |
| province | String? | Tỉnh/thành phố đang sinh sống — chọn từ **34 tỉnh/thành sau sáp nhập 2025** (Nghị quyết 202/2025/QH15) khi quốc gia là Việt Nam |
| address | String? | Nơi ở |
| biography | String? | Tiểu sử |
| graveInfo | String? | Thông tin mộ phần |
| deathAnniversary | String? | Ngày giỗ |
| deathAnniversaryType | String? | "solar" hoặc "lunar" |
| notes | String? | Ghi chú |
| photoUrl | String? | Đường dẫn ảnh |

### ParentChild (Quan hệ cha-con)
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| parentId | String | ID cha/mẹ |
| childId | String | ID con |
| relationshipType | String | "biological", "adopted", "step" |

### Marriage (Hôn nhân)
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| spouse1Id | String | ID vợ/chồng 1 |
| spouse2Id | String | ID vợ/chồng 2 |
| marriageDate | String? | Ngày cưới |
| divorceDate | String? | Ngày ly hôn |
| isActive | Boolean | Còn hiệu lực |
| orderIndex | Int | Thứ tự (hỗ trợ đa thê) |

### Event (Sự kiện)
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| memberId | String | ID thành viên |
| title | String | Tiêu đề sự kiện |
| date | String? | Ngày |
| calendarType | String? | "solar" hoặc "lunar" |
| description | String? | Mô tả chi tiết |

### Photo (Ảnh)
| Trường | Kiểu | Mô tả |
|--------|------|-------|
| memberId | String | ID thành viên |
| url | String | Đường dẫn file |
| caption | String? | Chú thích |
| isProfile | Boolean | Ảnh đại diện? |

---

## Bảo Mật

- Trang admin bảo vệ bằng middleware (cookie session + HMAC-SHA256 token)
- Cookie: `httpOnly`, `sameSite=lax`, `secure` (production)
- API mutation routes (POST/PUT/DELETE) yêu cầu đăng nhập
- API GET routes công khai (cho trang public sử dụng)
- Đổi `AUTH_SECRET` trong `.env` để đăng xuất tất cả session

---

## Scripts

```bash
npm run dev      # Chạy development server
npm run build    # Build production
npm run start    # Chạy production server
npm run lint     # Kiểm tra ESLint
npm run seed     # Seed dữ liệu mẫu vào database
```
