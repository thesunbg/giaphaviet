import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUser } from "@/lib/user-auth";

/** Mã mời dễ đọc, bỏ các ký tự dễ nhầm (0/O, 1/I) */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const invites = await prisma.inviteCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { id: true, name: true, phone: true, status: true } },
    },
  });

  return NextResponse.json({ data: invites });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const maxUses = Math.max(1, Math.min(Number(body.maxUses) || 1, 500));
  const expiresInDays = Number(body.expiresInDays) || 0;
  const current = await getCurrentUser();

  let code = generateCode();
  // Rất hiếm khi trùng, nhưng vẫn thử lại cho chắc
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.inviteCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateCode();
  }

  const invite = await prisma.inviteCode.create({
    data: {
      code,
      note: body.note ? String(body.note).trim() : null,
      maxUses,
      autoApprove: Boolean(body.autoApprove),
      expiresAt:
        expiresInDays > 0
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null,
      createdById: current?.id || null,
    },
  });

  return NextResponse.json({ data: invite }, { status: 201 });
}
