import { getCurrentUser, getViewer } from "@/lib/user-auth";
import { FundDetailClient } from "@/components/funds/fund-detail-client";
import { NeedAccount } from "@/components/layout/need-account";

export const dynamic = "force-dynamic";

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    const viewer = await getViewer();
    return <NeedAccount feature="Quỹ dòng họ" isLegacyAdmin={viewer?.kind === "legacy-admin"} />;
  }

  const { id } = await params;
  return <FundDetailClient fundId={id} />;
}
