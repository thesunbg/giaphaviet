import { prisma } from "@/lib/prisma";
import { foldVietnamese } from "@/lib/utils";

export { foldVietnamese };

/**
 * Tìm kiếm thành viên: bỏ dấu, không phân biệt hoa/thường, xếp hạng theo độ khớp
 * (trùng đúng tên > bắt đầu bằng > khớp từng từ > chứa chuỗi), kèm thông tin
 * liên quan gần nhất: cha, mẹ, vợ/chồng, số con.
 */

export interface SearchHit {
  id: string;
  fullName: string;
  gender: string;
  generation: number;
  birthOrder: number;
  birthDate: string | null;
  deathDate: string | null;
  isAlive: boolean;
  occupation: string | null;
  address: string | null;
  province: string | null;
  photoUrl: string | null;
  /** Thông tin liên quan gần nhất */
  parents: string[];
  spouses: string[];
  childrenCount: number;
  score: number;
  /** Vì sao khớp: "Trùng tên", "Theo tên gọi", "Theo nghề nghiệp"... */
  matchedBy: string;
}

interface ScoreResult {
  score: number;
  matchedBy: string;
}

function scoreMember(
  foldedName: string,
  queryFolded: string,
  queryTokens: string[],
  extra: { occupation: string; address: string; province: string; notes: string }
): ScoreResult | null {
  if (!queryFolded) return null;

  const nameTokens = foldedName.split(" ");
  const callName = nameTokens[nameTokens.length - 1] || ""; // tên gọi (từ cuối)

  if (foldedName === queryFolded) return { score: 1000, matchedBy: "Trùng đúng tên" };
  if (callName === queryFolded) return { score: 900, matchedBy: "Trùng tên gọi" };
  if (foldedName.startsWith(queryFolded)) return { score: 800, matchedBy: "Tên bắt đầu bằng" };

  // Mọi từ trong câu tìm đều là đầu một từ trong tên: "van do" khớp "Nguyễn Văn Đô"
  const allTokensPrefix = queryTokens.every((token) =>
    nameTokens.some((part) => part.startsWith(token))
  );
  if (allTokensPrefix) {
    // càng ít từ thừa trong tên càng khớp sát
    const extraWords = Math.max(0, nameTokens.length - queryTokens.length);
    // gõ "van do" thì "Văn Độ" (tên gọi đúng chữ cuối) đứng trên "Văn Đông"
    const lastToken = queryTokens[queryTokens.length - 1];
    const callNameBonus = callName === lastToken ? 60 : 0;
    return {
      score: 700 + callNameBonus - extraWords * 5,
      matchedBy: "Khớp các từ trong tên",
    };
  }

  // Khớp giữa từ (vd gõ "oanh" ra "Doanh") chỉ nhận khi câu tìm đủ dài,
  // nếu không "yen" sẽ khớp cả "Nguyễn" và gây nhiễu
  const allowMidWord = queryFolded.replace(/\s/g, "").length >= 4;

  if (allowMidWord && foldedName.includes(queryFolded)) {
    return { score: 600, matchedBy: "Tên có chứa" };
  }

  if (allowMidWord && queryTokens.every((token) => foldedName.includes(token))) {
    return { score: 500, matchedBy: "Tên có chứa các từ" };
  }

  if (extra.occupation.includes(queryFolded)) return { score: 300, matchedBy: "Theo nghề nghiệp" };
  if (extra.province.includes(queryFolded)) return { score: 290, matchedBy: "Theo tỉnh/thành" };
  if (extra.address.includes(queryFolded)) return { score: 280, matchedBy: "Theo nơi ở" };
  if (extra.notes.includes(queryFolded)) return { score: 200, matchedBy: "Theo ghi chú" };

  return null;
}

export async function searchMembers(query: string, limit = 30): Promise<SearchHit[]> {
  const queryFolded = foldVietnamese(query);
  if (queryFolded.length === 0) return [];

  const queryTokens = queryFolded.split(" ").filter(Boolean);

  const [members, parentChild, marriages] = await Promise.all([
    prisma.member.findMany(),
    prisma.parentChild.findMany(),
    prisma.marriage.findMany(),
  ]);

  const nameOf = new Map(members.map((m) => [m.id, m.fullName]));

  const parentsOf = new Map<string, string[]>();
  const childCount = new Map<string, number>();
  parentChild.forEach((pc) => {
    const parentName = nameOf.get(pc.parentId);
    if (parentName) {
      parentsOf.set(pc.childId, [...(parentsOf.get(pc.childId) || []), parentName]);
    }
    childCount.set(pc.parentId, (childCount.get(pc.parentId) || 0) + 1);
  });

  const spousesOf = new Map<string, string[]>();
  marriages.forEach((m) => {
    const n1 = nameOf.get(m.spouse1Id);
    const n2 = nameOf.get(m.spouse2Id);
    if (n1 && n2) {
      spousesOf.set(m.spouse1Id, [...(spousesOf.get(m.spouse1Id) || []), n2]);
      spousesOf.set(m.spouse2Id, [...(spousesOf.get(m.spouse2Id) || []), n1]);
    }
  });

  const hits: SearchHit[] = [];

  for (const member of members) {
    const result = scoreMember(foldVietnamese(member.fullName), queryFolded, queryTokens, {
      occupation: foldVietnamese(member.occupation || ""),
      address: foldVietnamese(member.address || ""),
      province: foldVietnamese(member.province || ""),
      notes: foldVietnamese(member.notes || ""),
    });

    if (!result) continue;

    hits.push({
      id: member.id,
      fullName: member.fullName,
      gender: member.gender,
      generation: member.generation,
      birthOrder: member.birthOrder,
      birthDate: member.birthDate,
      deathDate: member.deathDate,
      isAlive: member.isAlive,
      occupation: member.occupation,
      address: member.address,
      province: member.province,
      photoUrl: member.photoUrl,
      parents: parentsOf.get(member.id) || [],
      spouses: spousesOf.get(member.id) || [],
      childrenCount: childCount.get(member.id) || 0,
      score: result.score,
      matchedBy: result.matchedBy,
    });
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.generation - b.generation ||
      a.birthOrder - b.birthOrder ||
      a.fullName.localeCompare(b.fullName, "vi")
  );

  return hits.slice(0, limit);
}
