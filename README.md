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
| SQLite | - | Cơ sở dữ liệu (file-based) |
| Zod | 4.3.6 | Validation |
| react-zoom-pan-pinch | 3.7.0 | Zoom/pan cho cây gia phả |
| lucide-react | 0.563.0 | Icons |
| react-hot-toast | 2.6.0 | Toast notifications |

---

## Tính Năng

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

#### Sidebar
- Điều hướng: Tổng Quan, Thành Viên, Quan Hệ, Sự Kiện, Import JSON
- Link "Xem Gia Phả" (mở trang công khai)
- Nút **Đăng Xuất**

---

## Cài Đặt

### Yêu cầu
- Node.js >= 18 (khuyến nghị v20+, đã test với v21.6.0)
- npm

### Các bước

```bash
# 1. Clone project
git clone <repository-url>
cd giaphaviet

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env
cp .env.example .env
# Hoặc tạo thủ công (xem phần Cấu hình bên dưới)

# 4. Tạo database và generate Prisma client
npx prisma generate
npx prisma db push

# 5. (Tùy chọn) Seed dữ liệu mẫu
npm run seed

# 6. Chạy development server
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
# Đường dẫn database SQLite
DATABASE_URL="file:./dev.db"

# Mật khẩu đăng nhập admin (thay đổi cho production!)
ADMIN_PASSWORD=giaphaviet2024

# Khóa bí mật cho session token (thay đổi cho production!)
AUTH_SECRET=thay-bang-chuoi-ngau-nhien-dai-32-ky-tu
```

> **Lưu ý**: Đổi `ADMIN_PASSWORD` và `AUTH_SECRET` khi deploy production. Thay đổi `AUTH_SECRET` sẽ đăng xuất tất cả session hiện tại.

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
│   ├── schema.prisma          # Database schema (5 bảng)
│   └── dev.db                 # SQLite database file
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
│   │   │   └── import/        # Import JSON
│   │   └── api/               # API routes
│   │       ├── auth/          # Login/Logout
│   │       ├── members/       # CRUD thành viên
│   │       ├── relationships/ # Quan hệ cha-con
│   │       ├── marriages/     # Hôn nhân
│   │       ├── events/        # Sự kiện
│   │       ├── calendar/      # Lịch tổng hợp
│   │       ├── tree/          # Cây gia phả
│   │       ├── upload/        # Upload ảnh
│   │       └── import/        # Import dữ liệu
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

### Khác
| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| GET | `/api/tree` | Cây gia phả (đệ quy) | - |
| GET | `/api/calendar` | Lịch tổng hợp | - |
| POST | `/api/upload` | Upload ảnh (max 5MB) | Required |
| POST | `/api/import` | Import JSON (xóa dữ liệu cũ) | Required |

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
