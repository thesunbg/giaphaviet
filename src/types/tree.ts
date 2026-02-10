import type { MemberData } from "./member";

export interface TreeSpouseInfo {
  member: MemberData;
  marriageDate: string | null;
  orderIndex: number;
}

export interface TreeNode {
  member: MemberData;
  spouses: TreeSpouseInfo[];
  children: TreeNode[];
  generation: number;
}
