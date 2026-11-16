import { getCurrentUser, getViewer } from "@/lib/user-auth";
import { FundsClient } from "@/components/funds/funds-client";
import { NeedAccount } from "@/components/layout/need-account";

export const dynamic = "force-dynamic";

export default async function FundsPage() {
  const user = await getCurrentUser();

  if (!user) {
    const viewer = await getViewer();
    return <NeedAccount feature="Quỹ dòng họ" isLegacyAdmin={viewer?.kind === "legacy-admin"} />;
  }

  return <FundsClient />;
}
