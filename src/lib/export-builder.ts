import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/settings";

/**
 * Cấu trúc JSON export — tương thích hoàn toàn với API import (`/api/import`),
 * nên file export có thể dùng làm bản sao lưu và import lại nguyên trạng.
 */
export interface ExportEvent {
  title: string;
  date?: string;
  calendarType?: string;
  description?: string;
}

export interface ExportSpouse {
  fullName: string;
  gender: "male" | "female";
  birthDate?: string;
  birthDateType?: string;
  deathDate?: string;
  deathDateType?: string;
  isAlive: boolean;
  occupation?: string;
  address?: string;
  country?: string;
  province?: string;
  biography?: string;
  graveInfo?: string;
  deathAnniversary?: string;
  deathAnniversaryType?: string;
  notes?: string;
  photoUrl?: string;
  events?: ExportEvent[];
  marriageDate?: string;
  divorceDate?: string;
  isActive?: boolean;
  orderIndex: number;
}

export interface ExportMember extends Omit<ExportSpouse, "marriageDate" | "divorceDate" | "isActive" | "orderIndex"> {
  generation: number;
  birthOrder: number;
  /** Quan hệ với cha/mẹ trực tiếp: biological | adopted | step */
  relationshipType?: string;
  /**
   * orderIndex của những vợ/chồng (trong `spouses` của node cha/mẹ) cũng là cha/mẹ
   * của thành viên này — giúp import dựng lại đủ cả quan hệ với mẹ.
   */
  otherParents?: number[];
  spouses?: ExportSpouse[];
  children?: ExportMember[];
}

export interface ExportData {
  familyName: string;
  exportedAt: string;
  stats: {
    totalMembers: number;
    totalRelationships: number;
    totalMarriages: number;
    totalEvents: number;
  };
  root: ExportMember;
  /** Các nhánh không nối với cụ tổ (nếu có) — import cũng đọc được trường này */
  otherRoots?: ExportMember[];
}

type DbMember = {
  id: string;
  fullName: string;
  gender: string;
  generation: number;
  birthOrder: number;
  birthDate: string | null;
  birthDateType: string | null;
  deathDate: string | null;
  deathDateType: string | null;
  isAlive: boolean;
  occupation: string | null;
  address: string | null;
  country: string | null;
  province: string | null;
  biography: string | null;
  graveInfo: string | null;
  deathAnniversary: string | null;
  deathAnniversaryType: string | null;
  notes: string | null;
  photoUrl: string | null;
};

/** Bỏ các trường null/undefined để file JSON gọn gàng */
function clean<T extends Record<string, unknown>>(obj: T): T {
  const out = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0)) {
      out[key] = value;
    }
  }
  return out as T;
}

function baseFields(m: DbMember, events: ExportEvent[]) {
  return clean({
    fullName: m.fullName,
    gender: m.gender as "male" | "female",
    birthDate: m.birthDate ?? undefined,
    birthDateType: m.birthDate ? m.birthDateType ?? undefined : undefined,
    deathDate: m.deathDate ?? undefined,
    deathDateType: m.deathDate ? m.deathDateType ?? undefined : undefined,
    isAlive: m.isAlive,
    occupation: m.occupation ?? undefined,
    address: m.address ?? undefined,
    country: m.country ?? undefined,
    province: m.province ?? undefined,
    biography: m.biography ?? undefined,
    graveInfo: m.graveInfo ?? undefined,
    deathAnniversary: m.deathAnniversary ?? undefined,
    deathAnniversaryType: m.deathAnniversary ? m.deathAnniversaryType ?? undefined : undefined,
    notes: m.notes ?? undefined,
    photoUrl: m.photoUrl ?? undefined,
    events,
  });
}

/**
 * Dựng dữ liệu export từ database.
 * Mọi thành viên xuất hiện đúng một lần: hoặc là một node trong cây,
 * hoặc là vợ/chồng lồng trong node của bạn đời.
 */
export async function buildExportData(): Promise<ExportData | null> {
  const [members, parentChild, marriages, events] = await Promise.all([
    prisma.member.findMany({ orderBy: [{ generation: "asc" }, { birthOrder: "asc" }] }),
    prisma.parentChild.findMany(),
    prisma.marriage.findMany({ orderBy: { orderIndex: "asc" } }),
    prisma.event.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  if (members.length === 0) return null;

  const memberMap = new Map<string, DbMember>();
  members.forEach((m) => memberMap.set(m.id, m as DbMember));

  // memberId -> danh sách sự kiện
  const eventsOf = new Map<string, ExportEvent[]>();
  events.forEach((e) => {
    // Sự kiện chung của dòng họ không gắn với thành viên nào -> không nằm trong cây export
    if (!e.memberId) return;
    const list = eventsOf.get(e.memberId) || [];
    list.push(
      clean({
        title: e.title,
        date: e.date ?? undefined,
        calendarType: e.date ? e.calendarType ?? undefined : undefined,
        description: e.description ?? undefined,
      })
    );
    eventsOf.set(e.memberId, list);
  });

  // Quan hệ cha/mẹ - con
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, string[]>();
  const relTypeOf = new Map<string, string>();
  parentChild.forEach((pc) => {
    childrenOf.set(pc.parentId, [...(childrenOf.get(pc.parentId) || []), pc.childId]);
    parentsOf.set(pc.childId, [...(parentsOf.get(pc.childId) || []), pc.parentId]);
    relTypeOf.set(`${pc.parentId}-${pc.childId}`, pc.relationshipType);
  });

  // Hôn nhân theo từng thành viên
  type MarriageInfo = {
    partnerId: string;
    marriageDate: string | null;
    divorceDate: string | null;
    isActive: boolean;
    orderIndex: number;
    isPrimary: boolean; // true khi member là spouse1 (dòng chính)
  };
  const marriagesOf = new Map<string, MarriageInfo[]>();
  const addMarriage = (id: string, info: MarriageInfo) => {
    marriagesOf.set(id, [...(marriagesOf.get(id) || []), info]);
  };
  marriages.forEach((m) => {
    addMarriage(m.spouse1Id, {
      partnerId: m.spouse2Id,
      marriageDate: m.marriageDate,
      divorceDate: m.divorceDate,
      isActive: m.isActive,
      orderIndex: m.orderIndex,
      isPrimary: true,
    });
    addMarriage(m.spouse2Id, {
      partnerId: m.spouse1Id,
      marriageDate: m.marriageDate,
      divorceDate: m.divorceDate,
      isActive: m.isActive,
      orderIndex: m.orderIndex,
      isPrimary: false,
    });
  });

  const visited = new Set<string>();

  function buildNode(
    id: string,
    relationshipType?: string,
    otherParents?: number[]
  ): ExportMember | null {
    const member = memberMap.get(id);
    if (!member || visited.has(id)) return null;
    visited.add(id);

    // Vợ/chồng được lồng vào node này (nếu chưa được xuất ở nơi khác)
    const spouseInfos = (marriagesOf.get(id) || [])
      .filter((info) => !visited.has(info.partnerId) && memberMap.has(info.partnerId))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const spouses: ExportSpouse[] = spouseInfos.map((info, index) => {
      visited.add(info.partnerId);
      const partner = memberMap.get(info.partnerId)!;
      return clean({
        ...baseFields(partner, eventsOf.get(partner.id) || []),
        marriageDate: info.marriageDate ?? undefined,
        divorceDate: info.divorceDate ?? undefined,
        isActive: info.isActive === false ? false : undefined,
        orderIndex: info.orderIndex || index + 1,
      }) as ExportSpouse;
    });

    // Con của bản thân và của các vợ/chồng vừa lồng vào
    const childIds: string[] = [...(childrenOf.get(id) || [])];
    spouseInfos.forEach((info) => {
      (childrenOf.get(info.partnerId) || []).forEach((cid) => {
        if (!childIds.includes(cid)) childIds.push(cid);
      });
    });

    const children = childIds
      .filter((cid) => !visited.has(cid) && memberMap.has(cid))
      .map((cid) => ({ id: cid, birthOrder: memberMap.get(cid)!.birthOrder }))
      .sort((a, b) => a.birthOrder - b.birthOrder)
      .map((c) => {
        const relType =
          relTypeOf.get(`${id}-${c.id}`) ||
          spouseInfos
            .map((info) => relTypeOf.get(`${info.partnerId}-${c.id}`))
            .find(Boolean);
        // Vợ/chồng nào cũng là cha/mẹ của người con này
        const otherParentIndexes = spouseInfos
          .map((info, index) =>
            relTypeOf.has(`${info.partnerId}-${c.id}`)
              ? spouses[index]?.orderIndex ?? info.orderIndex ?? index + 1
              : null
          )
          .filter((value): value is number => value !== null);
        return buildNode(c.id, relType, otherParentIndexes);
      })
      .filter(Boolean) as ExportMember[];

    return clean({
      ...baseFields(member, eventsOf.get(member.id) || []),
      generation: member.generation,
      birthOrder: member.birthOrder,
      relationshipType:
        relationshipType && relationshipType !== "biological" ? relationshipType : undefined,
      otherParents: otherParents && otherParents.length > 0 ? otherParents : undefined,
      spouses,
      children,
    }) as ExportMember;
  }

  // Cụ tổ: đời nhỏ nhất, không có cha/mẹ, ưu tiên nam và không phải vợ/chồng của người khác
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

  const rootId = rootCandidates[0]?.id ?? members[0].id;
  const root = buildNode(rootId);
  if (!root) return null;

  // Các nhánh/thành viên rời rạc không nối với cụ tổ
  const otherRoots: ExportMember[] = [];
  const remaining = [
    ...rootCandidates.filter((m) => !visited.has(m.id)),
    ...members.filter((m) => !visited.has(m.id)),
  ];
  for (const m of remaining) {
    const node = buildNode(m.id);
    if (node) otherRoots.push(node);
  }

  const settings = await getSiteSettings();
  const surname = root.fullName.trim().split(/\s+/)[0];

  return clean({
    familyName:
      settings.familyName && settings.familyName !== "Gia Phả Việt"
        ? settings.familyName
        : `Họ ${surname}`,
    exportedAt: new Date().toISOString(),
    stats: {
      totalMembers: members.length,
      totalRelationships: parentChild.length,
      totalMarriages: marriages.length,
      totalEvents: events.length,
    },
    root,
    otherRoots,
  }) as ExportData;
}

/** Xuất danh sách thành viên dạng CSV (mở được bằng Excel) */
export async function buildMembersCsv(): Promise<string> {
  const [members, parentChild, marriages] = await Promise.all([
    prisma.member.findMany({ orderBy: [{ generation: "asc" }, { birthOrder: "asc" }, { fullName: "asc" }] }),
    prisma.parentChild.findMany(),
    prisma.marriage.findMany(),
  ]);

  const nameOf = new Map<string, { fullName: string; gender: string }>();
  members.forEach((m) => nameOf.set(m.id, { fullName: m.fullName, gender: m.gender }));

  const fathersOf = new Map<string, string[]>();
  const mothersOf = new Map<string, string[]>();
  parentChild.forEach((pc) => {
    const parent = nameOf.get(pc.parentId);
    if (!parent) return;
    const target = parent.gender === "female" ? mothersOf : fathersOf;
    target.set(pc.childId, [...(target.get(pc.childId) || []), parent.fullName]);
  });

  const spousesOf = new Map<string, string[]>();
  marriages
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .forEach((m) => {
      const s1 = nameOf.get(m.spouse1Id);
      const s2 = nameOf.get(m.spouse2Id);
      if (s1 && s2) {
        spousesOf.set(m.spouse1Id, [...(spousesOf.get(m.spouse1Id) || []), s2.fullName]);
        spousesOf.set(m.spouse2Id, [...(spousesOf.get(m.spouse2Id) || []), s1.fullName]);
      }
    });

  const headers = [
    "Đời",
    "Thứ tự",
    "Họ tên",
    "Giới tính",
    "Năm sinh",
    "Lịch sinh",
    "Tình trạng",
    "Năm mất",
    "Lịch mất",
    "Ngày giỗ",
    "Lịch giỗ",
    "Nghề nghiệp",
    "Nơi ở",
    "Tỉnh/Thành phố",
    "Quốc gia",
    "Cha",
    "Mẹ",
    "Vợ/Chồng",
    "Mộ phần",
    "Tiểu sử",
    "Ghi chú",
  ];

  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  };

  const calendar = (type: string | null | undefined) =>
    type === "lunar" ? "Âm lịch" : type === "solar" ? "Dương lịch" : "";

  const rows = members.map((m) =>
    [
      m.generation,
      m.birthOrder,
      m.fullName,
      m.gender === "male" ? "Nam" : "Nữ",
      m.birthDate,
      m.birthDate ? calendar(m.birthDateType) : "",
      m.isAlive ? "Còn sống" : "Đã mất",
      m.deathDate,
      m.deathDate ? calendar(m.deathDateType) : "",
      m.deathAnniversary,
      m.deathAnniversary ? calendar(m.deathAnniversaryType) : "",
      m.occupation,
      m.address,
      m.province,
      m.country,
      (fathersOf.get(m.id) || []).join(", "),
      (mothersOf.get(m.id) || []).join(", "),
      (spousesOf.get(m.id) || []).join(", "),
      m.graveInfo,
      m.biography,
      m.notes,
    ]
      .map(escape)
      .join(",")
  );

  // BOM để Excel nhận đúng UTF-8
  return "﻿" + [headers.map(escape).join(","), ...rows].join("\r\n");
}
