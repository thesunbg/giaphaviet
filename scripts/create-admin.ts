/**
 * Tạo (hoặc cập nhật) tài khoản quản trị đầu tiên.
 *
 *   npm run create-admin -- "Nguyễn Văn A" 0912345678 matkhaucuaban
 *
 * Nếu số điện thoại đã có tài khoản, script sẽ nâng quyền quản trị,
 * kích hoạt tài khoản và đặt lại mật khẩu.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword, isValidPhone, normalizePhone } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  const [name, rawPhone, password] = process.argv.slice(2);

  if (!name || !rawPhone || !password) {
    console.error('Cách dùng: npm run create-admin -- "Họ Tên" 0912345678 matkhau');
    process.exit(1);
  }

  const phone = normalizePhone(rawPhone);

  if (!isValidPhone(phone)) {
    console.error(`Số điện thoại không hợp lệ: ${rawPhone} (ví dụ đúng: 0912345678)`);
    process.exit(1);
  }

  if (password.length < 6) {
    console.error("Mật khẩu phải có ít nhất 6 ký tự");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { phone } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        role: "admin",
        status: "active",
        passwordHash: hashPassword(password),
      },
    });
    console.log(`Đã cập nhật tài khoản quản trị: ${name} (${phone})`);
  } else {
    await prisma.user.create({
      data: {
        name,
        phone,
        role: "admin",
        status: "active",
        passwordHash: hashPassword(password),
      },
    });
    console.log(`Đã tạo tài khoản quản trị: ${name} (${phone})`);
  }

  console.log("Đăng nhập tại /dang-nhap bằng số điện thoại và mật khẩu vừa đặt.");
}

main()
  .catch((err) => {
    console.error("Lỗi:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
