
import { prisma } from "./prisma.mjs"


export class PrismaNotesUsersStore  {
  async create(userId, userName, displayName, fullName, provider, photo, photoType) {
    await prisma.$connect();
    const user = await prisma.notesUsers.create(
      {
        data: {
          id: userId,
          username: userName,
          displayName: displayName,
          fullName: fullName,
          provider: provider,
          photo: photo,
          photoType: photoType
        }
      }
    )
    return user
  }
  async update() {

  }

  async read(userId ) {
    await prisma.$connect();
    const user = await prisma.notesUsers.findUnique({
      where: {id: userId}
    })
    
    return user;
  }

  async readByUserName(userName) {
    await prisma.$connect();
    const user = await prisma.notesUsers.findUnique({
      where: {username: userName}
    })
    
    return user;
  }

  async destroy(userId) {
    await prisma.$connect()
    await prisma.notesUsers.delete({
      where: {id: userId}
    })
  }
}