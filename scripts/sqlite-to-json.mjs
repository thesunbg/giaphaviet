#!/usr/bin/env node
/**
 * Xuất dữ liệu từ database SQLite cũ (prisma/dev.db) ra file JSON
 * tương thích với trang Import của ứng dụng.
 *
 * Dùng khi chuyển từ SQLite sang PostgreSQL:
 *   1. node scripts/sqlite-to-json.mjs prisma/dev.db gia-pha-backup.json
 *   2. Tạo database PostgreSQL, đặt DATABASE_URL, chạy: npx prisma migrate deploy
 *   3. Vào /admin/import và import file JSON vừa tạo
 *
 * Yêu cầu Node.js >= 22 (dùng module built-in node:sqlite).
 */
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";

const dbPath = process.argv[2] || "prisma/dev.db";
const outPath = process.argv[3] || "gia-pha-backup.json";

const db = new DatabaseSync(dbPath, { readOnly: true });
const all = (sql) => db.prepare(sql).all();

const members = all("SELECT * FROM Member");
const parentChild = all("SELECT * FROM ParentChild");
const marriages = all("SELECT * FROM Marriage ORDER BY orderIndex ASC");
let events = [];
try {
  events = all("SELECT * FROM Event");
} catch {
  // bảng Event có thể không tồn tại ở bản cũ
}

if (members.length === 0) {
  console.error("Không tìm thấy thành viên nào trong", dbPath);
  process.exit(1);
}

const clean = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
    )
  );

const memberMap = new Map(members.map((m) => [m.id, m]));

const eventsOf = new Map();
for (const e of events) {
  const list = eventsOf.get(e.memberId) || [];
  list.push(
    clean({
      title: e.title,
      date: e.date,
      calendarType: e.date ? e.calendarType : undefined,
      description: e.description,
    })
  );
  eventsOf.set(e.memberId, list);
}

const childrenOf = new Map();
const parentsOf = new Map();
const relTypeOf = new Map();
for (const pc of parentChild) {
  childrenOf.set(pc.parentId, [...(childrenOf.get(pc.parentId) || []), pc.childId]);
  parentsOf.set(pc.childId, [...(parentsOf.get(pc.childId) || []), pc.parentId]);
  relTypeOf.set(`${pc.parentId}-${pc.childId}`, pc.relationshipType);
}

const marriagesOf = new Map();
const add = (id, info) => marriagesOf.set(id, [...(marriagesOf.get(id) || []), info]);
for (const m of marriages) {
  const base = {
    marriageDate: m.marriageDate,
    divorceDate: m.divorceDate,
    isActive: m.isActive === 0 ? false : true,
    orderIndex: m.orderIndex || 1,
  };
  add(m.spouse1Id, { ...base, partnerId: m.spouse2Id });
  add(m.spouse2Id, { ...base, partnerId: m.spouse1Id });
}

const baseFields = (m) =>
  clean({
    fullName: m.fullName,
    gender: m.gender,
    birthDate: m.birthDate,
    birthDateType: m.birthDate ? m.birthDateType : undefined,
    deathDate: m.deathDate,
    deathDateType: m.deathDate ? m.deathDateType : undefined,
    isAlive: m.isAlive === 1 || m.isAlive === true,
    occupation: m.occupation,
    address: m.address,
    biography: m.biography,
    graveInfo: m.graveInfo,
    deathAnniversary: m.deathAnniversary,
    deathAnniversaryType: m.deathAnniversary ? m.deathAnniversaryType : undefined,
    notes: m.notes,
    photoUrl: m.photoUrl,
    events: eventsOf.get(m.id) || [],
  });

const visited = new Set();

function buildNode(id, relationshipType, otherParents) {
  const member = memberMap.get(id);
  if (!member || visited.has(id)) return null;
  visited.add(id);

  const spouseInfos = (marriagesOf.get(id) || [])
    .filter((info) => !visited.has(info.partnerId) && memberMap.has(info.partnerId))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const spouses = spouseInfos.map((info, index) => {
    visited.add(info.partnerId);
    return clean({
      ...baseFields(memberMap.get(info.partnerId)),
      marriageDate: info.marriageDate,
      divorceDate: info.divorceDate,
      isActive: info.isActive === false ? false : undefined,
      orderIndex: info.orderIndex || index + 1,
    });
  });

  const childIds = [...(childrenOf.get(id) || [])];
  for (const info of spouseInfos) {
    for (const cid of childrenOf.get(info.partnerId) || []) {
      if (!childIds.includes(cid)) childIds.push(cid);
    }
  }

  const children = childIds
    .filter((cid) => !visited.has(cid) && memberMap.has(cid))
    .sort((a, b) => memberMap.get(a).birthOrder - memberMap.get(b).birthOrder)
    .map((cid) => {
      const relType =
        relTypeOf.get(`${id}-${cid}`) ||
        spouseInfos.map((info) => relTypeOf.get(`${info.partnerId}-${cid}`)).find(Boolean);
      const otherParentIndexes = spouseInfos
        .map((info, index) =>
          relTypeOf.has(`${info.partnerId}-${cid}`) ? info.orderIndex || index + 1 : null
        )
        .filter((v) => v !== null);
      return buildNode(cid, relType, otherParentIndexes);
    })
    .filter(Boolean);

  return clean({
    ...baseFields(member),
    generation: member.generation,
    birthOrder: member.birthOrder,
    relationshipType:
      relationshipType && relationshipType !== "biological" ? relationshipType : undefined,
    otherParents: otherParents && otherParents.length > 0 ? otherParents : undefined,
    spouses,
    children,
  });
}

const spouse2Ids = new Set(marriages.map((m) => m.spouse2Id));
const rootCandidates = members
  .filter((m) => (parentsOf.get(m.id) || []).length === 0)
  .sort((a, b) => {
    if (a.generation !== b.generation) return a.generation - b.generation;
    const aSpouse = spouse2Ids.has(a.id) ? 1 : 0;
    const bSpouse = spouse2Ids.has(b.id) ? 1 : 0;
    if (aSpouse !== bSpouse) return aSpouse - bSpouse;
    if (a.gender !== b.gender) return a.gender === "male" ? -1 : 1;
    return a.birthOrder - b.birthOrder;
  });

const root = buildNode(rootCandidates[0]?.id ?? members[0].id);

const otherRoots = [];
for (const m of [...rootCandidates, ...members]) {
  if (visited.has(m.id)) continue;
  const node = buildNode(m.id);
  if (node) otherRoots.push(node);
}

const data = clean({
  familyName: `Họ ${root.fullName.trim().split(/\s+/)[0]}`,
  exportedAt: new Date().toISOString(),
  stats: {
    totalMembers: members.length,
    totalRelationships: parentChild.length,
    totalMarriages: marriages.length,
    totalEvents: events.length,
  },
  root,
  otherRoots,
});

writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
console.log(
  `Đã xuất ${members.length} thành viên, ${parentChild.length} quan hệ cha-con, ` +
    `${marriages.length} hôn nhân, ${events.length} sự kiện -> ${outPath}`
);
if (otherRoots.length > 0) {
  console.log(`Lưu ý: có ${otherRoots.length} nhánh rời không nối với cụ tổ (đã đưa vào "otherRoots").`);
}
