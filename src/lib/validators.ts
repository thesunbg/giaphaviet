import { z } from "zod";

const calendarTypeEnum = z.enum(["solar", "lunar"]).optional().nullable();

export const memberSchema = z.object({
  fullName: z.string().min(1, "Họ tên không được để trống"),
  birthDate: z.string().optional().nullable(),
  birthDateType: calendarTypeEnum.default("solar"),
  deathDate: z.string().optional().nullable(),
  deathDateType: calendarTypeEnum.default("solar"),
  isAlive: z.boolean().default(true),
  gender: z.enum(["male", "female"]),
  generation: z.number().int().min(1).default(1),
  birthOrder: z.number().int().min(1).default(1),
  occupation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  biography: z.string().optional().nullable(),
  graveInfo: z.string().optional().nullable(),
  deathAnniversary: z.string().optional().nullable(),
  deathAnniversaryType: calendarTypeEnum.default("lunar"),
  notes: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export const parentChildSchema = z.object({
  parentId: z.string().min(1, "Vui lòng chọn cha/mẹ"),
  childId: z.string().min(1, "Vui lòng chọn con"),
  relationshipType: z.enum(["biological", "adopted", "step"]).default("biological"),
});

export const marriageSchema = z.object({
  spouse1Id: z.string().min(1, "Vui lòng chọn người thứ nhất"),
  spouse2Id: z.string().min(1, "Vui lòng chọn người thứ hai"),
  marriageDate: z.string().optional().nullable(),
  orderIndex: z.number().int().min(1).default(1),
});

export const eventSchema = z.object({
  memberId: z.string().min(1, "Vui lòng chọn thành viên"),
  title: z.string().min(1, "Tên sự kiện không được để trống"),
  date: z.string().optional().nullable(),
  calendarType: calendarTypeEnum.default("solar"),
  description: z.string().optional().nullable(),
});

export type MemberFormData = z.infer<typeof memberSchema>;
export type ParentChildFormData = z.infer<typeof parentChildSchema>;
export type MarriageFormData = z.infer<typeof marriageSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
