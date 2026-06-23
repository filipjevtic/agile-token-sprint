import { getPrisma } from "../db.js";
import type { TeamRole } from "./team.js";

const INVITE_TTL_HOURS = 72;

export interface InviteInfo {
  id: string;
  token: string;
  projectId: string;
  projectName: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  email: string | null;
  expiresAt: Date;
  acceptedAt: Date | null;
}

export async function createInvite(input: {
  projectId: string;
  workspaceId: string;
  createdById: string;
  role: TeamRole;
  email?: string;
}): Promise<InviteInfo> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = await getPrisma() as any;

  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      createdById: input.createdById,
      role: input.role,
      email: input.email ?? null,
      expiresAt,
    },
    include: { project: true, workspace: true },
  });

  return {
    id: invite.id,
    token: invite.token,
    projectId: invite.projectId,
    projectName: invite.project.name,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    role: invite.role,
    email: invite.email,
    expiresAt: invite.expiresAt,
    acceptedAt: invite.acceptedAt,
  };
}

export async function getInvite(token: string): Promise<InviteInfo | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = await getPrisma() as any;

  const invite = await prisma.invite.findUnique({
    where: { token },
    include: { project: true, workspace: true },
  });

  if (!invite) return null;

  return {
    id: invite.id,
    token: invite.token,
    projectId: invite.projectId,
    projectName: invite.project.name,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    role: invite.role,
    email: invite.email,
    expiresAt: invite.expiresAt,
    acceptedAt: invite.acceptedAt,
  };
}

export async function acceptInvite(input: {
  token: string;
  email: string;
  displayName?: string;
  passwordHash?: string;
}): Promise<{ userId: string; role: string; workspaceId: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = await getPrisma() as any;

  const invite = await prisma.invite.findUnique({
    where: { token: input.token },
    include: { project: true, workspace: true },
  });

  if (!invite) throw new Error("Invite not found");
  if (invite.acceptedAt) throw new Error("Invite already used");
  if (invite.expiresAt < new Date()) throw new Error("Invite has expired");
  if (invite.email && invite.email !== input.email) {
    throw new Error("This invite is for a different email address");
  }

  const user = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: invite.workspaceId, email: input.email } },
    update: {
      displayName: input.displayName ?? undefined,
      passwordHash: input.passwordHash ?? undefined,
    },
    create: {
      workspaceId: invite.workspaceId,
      email: input.email,
      displayName: input.displayName ?? input.email,
      passwordHash: input.passwordHash ?? null,
      role: "member",
    },
  });

  await prisma.teamMember.upsert({
    where: { projectId_userId: { projectId: invite.projectId, userId: user.id } },
    update: { role: invite.role },
    create: { projectId: invite.projectId, userId: user.id, role: invite.role },
  });

  await prisma.invite.update({
    where: { token: input.token },
    data: { acceptedAt: new Date() },
  });

  return { userId: user.id, role: user.role, workspaceId: invite.workspaceId };
}
