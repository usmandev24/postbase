
import { prisma } from "./prisma.mjs";
import { toRelativeTime } from "./timeage.js";
import debug from "debug";
const log = debug("notes:noteUsers-prisma")
export class PrismaNotesUsersStore {
  async create(userId, userName, displayName, firstName, email, provider, photo, photoType) {
    await prisma.$connect();
    const user = await prisma.notesUsers.create(
      {
        data: {
          id: userId,
          username: userName,
          displayName: displayName,
          firstName,
          email,
          provider: provider,
          photo: photo,
          photoType: photoType
        }
      }
    )
    return user
  }
  async update(userId, userName, displayName, firstName, email, provider, photo, photoType) {
    await prisma.$connect();
    const user = await prisma.notesUsers.update({
      where: { id: userId },
      data: {
        displayName,
        firstName,
        provider,
        email,
      },
    })
    return user
  }

  async read(userId) {
    await prisma.$connect();
    log(userId)
    const user = await prisma.notesUsers.findUnique({
      where: { id: userId },
      omit: { photo: true }
    })

    return user;
  }

  async updatePhoto(userId, photo, photoType) {
    await prisma.$connect()
    const user = await prisma.notesUsers.update({
      where: { id: userId },
      data: { photo, photoType },
      omit: { photo: true }
    })
    return user
  }
  async readByUserName(userName) {
    log(userName)
    await prisma.$connect();
    const user = await prisma.notesUsers.findUnique({
      where: { username: userName },
      omit: { photo: true }
    })

    return user;
  }

  async getAllData(userName) {
    log(userName)
    await prisma.$connect();
    const user = await prisma.notesUsers.findUnique({
      where: { username: userName },
      omit: { photo: true, email: true, id: true },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
          include: { auther: { select: { username: true } } }
        },
        comments: true
      }
    })
    return user
  }
  async getPublicData(userName) {
    log(userName)
    await prisma.$connect();
    let user = await prisma.notesUsers.findUnique({
      where: { username: userName },
      omit: { photo: true, email: true, id: true },
      include: {
        notes: {
          orderBy: { createdAt: "desc" },
          where: { public: true },
          include: { auther: { select: { username: true } } }
        }
      }
    })
    user.notes = user.notes.map(note => {
      note.updatedAt = toRelativeTime(note.updatedAt);
      return note;
    })
    return user;
  }
  async getPhotoByUserName(userName) {
    await prisma.$connect();
    const user = await prisma.notesUsers.findUnique({
      where: { username: userName },
    })
    return user;
  }
  async destroy(userId) {
    await prisma.$connect()
    await prisma.notesUsers.delete({
      where: { id: userId }
    })
  }
}