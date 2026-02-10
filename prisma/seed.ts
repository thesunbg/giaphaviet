import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.photo.deleteMany();
  await prisma.event.deleteMany();
  await prisma.parentChild.deleteMany();
  await prisma.marriage.deleteMany();
  await prisma.member.deleteMany();

  // Đời 1: Ông bà tổ
  const ongTo = await prisma.member.create({
    data: {
      fullName: "Nguyễn Văn An",
      birthDate: "1920",
      deathDate: "1995",
      isAlive: false,
      gender: "male",
      generation: 1,
      birthOrder: 1,
      occupation: "Nông dân",
      address: "Thái Bình",
      biography: "Ông tổ dòng họ Nguyễn, là người khai hoang lập nghiệp tại Thái Bình.",
      graveInfo: "Nghĩa trang làng Đồng Xuân, Thái Bình",
      deathAnniversary: "Mùng 10 tháng 3 âm lịch",
      notes: "Người sáng lập dòng họ",
    },
  });

  const baTo = await prisma.member.create({
    data: {
      fullName: "Trần Thị Bình",
      birthDate: "1922",
      deathDate: "2000",
      isAlive: false,
      gender: "female",
      generation: 1,
      birthOrder: 1,
      occupation: "Nội trợ",
      address: "Thái Bình",
      deathAnniversary: "Mùng 5 tháng 7 âm lịch",
    },
  });

  // Hôn nhân đời 1
  await prisma.marriage.create({
    data: {
      spouse1Id: ongTo.id,
      spouse2Id: baTo.id,
      marriageDate: "1940",
      orderIndex: 1,
    },
  });

  // Đời 2: Con cái
  const conTruong = await prisma.member.create({
    data: {
      fullName: "Nguyễn Văn Cường",
      birthDate: "1942",
      deathDate: "2020",
      isAlive: false,
      gender: "male",
      generation: 2,
      birthOrder: 1,
      occupation: "Giáo viên",
      address: "Hà Nội",
      biography: "Con trai cả, làm giáo viên tại Hà Nội.",
      deathAnniversary: "15 tháng 10 âm lịch",
    },
  });

  const conThu2 = await prisma.member.create({
    data: {
      fullName: "Nguyễn Thị Dung",
      birthDate: "1945",
      isAlive: true,
      gender: "female",
      generation: 2,
      birthOrder: 2,
      occupation: "Y tá",
      address: "Thái Bình",
    },
  });

  const conThu3 = await prisma.member.create({
    data: {
      fullName: "Nguyễn Văn Em",
      birthDate: "1948",
      isAlive: true,
      gender: "male",
      generation: 2,
      birthOrder: 3,
      occupation: "Thợ mộc",
      address: "Hải Phòng",
    },
  });

  // Dâu/rể đời 2
  const voConTruong = await prisma.member.create({
    data: {
      fullName: "Lê Thị Hoa",
      birthDate: "1944",
      isAlive: true,
      gender: "female",
      generation: 2,
      birthOrder: 1,
      occupation: "Nội trợ",
      address: "Hà Nội",
    },
  });

  const voConThu3 = await prisma.member.create({
    data: {
      fullName: "Phạm Thị Mai",
      birthDate: "1950",
      isAlive: true,
      gender: "female",
      generation: 2,
      birthOrder: 1,
      occupation: "Buôn bán",
      address: "Hải Phòng",
    },
  });

  // Quan hệ cha-con đời 1 -> đời 2
  await prisma.parentChild.createMany({
    data: [
      { parentId: ongTo.id, childId: conTruong.id, relationshipType: "biological" },
      { parentId: ongTo.id, childId: conThu2.id, relationshipType: "biological" },
      { parentId: ongTo.id, childId: conThu3.id, relationshipType: "biological" },
      { parentId: baTo.id, childId: conTruong.id, relationshipType: "biological" },
      { parentId: baTo.id, childId: conThu2.id, relationshipType: "biological" },
      { parentId: baTo.id, childId: conThu3.id, relationshipType: "biological" },
    ],
  });

  // Hôn nhân đời 2
  await prisma.marriage.createMany({
    data: [
      { spouse1Id: conTruong.id, spouse2Id: voConTruong.id, marriageDate: "1965", orderIndex: 1 },
      { spouse1Id: conThu3.id, spouse2Id: voConThu3.id, marriageDate: "1972", orderIndex: 1 },
    ],
  });

  // Đời 3: Cháu
  const chau1 = await prisma.member.create({
    data: {
      fullName: "Nguyễn Văn Phúc",
      birthDate: "1968",
      isAlive: true,
      gender: "male",
      generation: 3,
      birthOrder: 1,
      occupation: "Kỹ sư",
      address: "Hà Nội",
      biography: "Kỹ sư xây dựng, làm việc tại Hà Nội.",
    },
  });

  const chau2 = await prisma.member.create({
    data: {
      fullName: "Nguyễn Thị Quỳnh",
      birthDate: "1970",
      isAlive: true,
      gender: "female",
      generation: 3,
      birthOrder: 2,
      occupation: "Bác sĩ",
      address: "Hà Nội",
    },
  });

  const chau3 = await prisma.member.create({
    data: {
      fullName: "Nguyễn Văn Sơn",
      birthDate: "1975",
      isAlive: true,
      gender: "male",
      generation: 3,
      birthOrder: 1,
      occupation: "Lập trình viên",
      address: "TP. Hồ Chí Minh",
    },
  });

  const conNuoi = await prisma.member.create({
    data: {
      fullName: "Nguyễn Văn Tài",
      birthDate: "1978",
      isAlive: true,
      gender: "male",
      generation: 3,
      birthOrder: 2,
      occupation: "Kinh doanh",
      address: "Hải Phòng",
      notes: "Con nuôi",
    },
  });

  // Quan hệ cha-con đời 2 -> đời 3
  await prisma.parentChild.createMany({
    data: [
      { parentId: conTruong.id, childId: chau1.id, relationshipType: "biological" },
      { parentId: conTruong.id, childId: chau2.id, relationshipType: "biological" },
      { parentId: voConTruong.id, childId: chau1.id, relationshipType: "biological" },
      { parentId: voConTruong.id, childId: chau2.id, relationshipType: "biological" },
      { parentId: conThu3.id, childId: chau3.id, relationshipType: "biological" },
      { parentId: conThu3.id, childId: conNuoi.id, relationshipType: "adopted" },
      { parentId: voConThu3.id, childId: chau3.id, relationshipType: "biological" },
      { parentId: voConThu3.id, childId: conNuoi.id, relationshipType: "adopted" },
    ],
  });

  // Sự kiện mẫu
  await prisma.event.createMany({
    data: [
      {
        memberId: ongTo.id,
        title: "Khai hoang lập nghiệp",
        date: "1945",
        description: "Ông An đã khai hoang vùng đất mới tại Thái Bình sau chiến tranh.",
      },
      {
        memberId: chau1.id,
        title: "Tốt nghiệp Đại học Bách Khoa",
        date: "1990",
        description: "Tốt nghiệp loại giỏi ngành Xây dựng.",
      },
    ],
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
