import { prisma } from "./prisma.mjs";

export async function getSessionData(sid) {
  await prisma.$connect();
  const sd = await prisma.session.findUnique({where: { sid}})
  return sd;
}