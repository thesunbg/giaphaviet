export type CalendarType = "solar" | "lunar";

export interface MemberData {
  id: string;
  fullName: string;
  birthDate: string | null;
  birthDateType: CalendarType | null;
  deathDate: string | null;
  deathDateType: CalendarType | null;
  isAlive: boolean;
  gender: "male" | "female";
  generation: number;
  birthOrder: number;
  occupation: string | null;
  address: string | null;
  biography: string | null;
  graveInfo: string | null;
  deathAnniversary: string | null;
  deathAnniversaryType: CalendarType | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParentInfo {
  member: MemberData;
  relationshipType: string;
}

export interface ChildInfo {
  member: MemberData;
  relationshipType: string;
}

export interface SpouseInfo {
  member: MemberData;
  marriageDate: string | null;
  orderIndex: number;
  marriageId: string;
}

export interface EventData {
  id: string;
  memberId: string;
  title: string;
  date: string | null;
  calendarType: CalendarType | null;
  description: string | null;
}

export interface PhotoData {
  id: string;
  memberId: string;
  url: string;
  caption: string | null;
  isProfile: boolean;
}

export interface MemberWithRelations extends MemberData {
  parents: ParentInfo[];
  children: ChildInfo[];
  spouses: SpouseInfo[];
  events: EventData[];
  photos: PhotoData[];
}
