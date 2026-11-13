import { prisma } from "@/lib/prisma";

export interface SiteSettingData {
  familyName: string;
  treeTitle: string | null;
  ancestralHome: string | null;
  address: string | null;
  description: string | null;
  contactPhone: string | null;
}

export const DEFAULT_SETTINGS: SiteSettingData = {
  familyName: "Gia Phả Việt",
  treeTitle: null,
  ancestralHome: null,
  address: null,
  description: null,
  contactPhone: null,
};

/** Thông tin dòng họ do quản trị khai báo; trả về mặc định nếu chưa thiết lập */
export async function getSiteSettings(): Promise<SiteSettingData> {
  const setting = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (!setting) return DEFAULT_SETTINGS;

  return {
    familyName: setting.familyName || DEFAULT_SETTINGS.familyName,
    treeTitle: setting.treeTitle,
    ancestralHome: setting.ancestralHome,
    address: setting.address,
    description: setting.description,
    contactPhone: setting.contactPhone,
  };
}
