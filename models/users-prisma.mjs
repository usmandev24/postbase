
import { prisma } from "./prisma.mjs";

import debug from "debug";
import { cacheStore } from "./cache.mjs";
import Keyv from "keyv";
import PrismaPostsStore from "./posts-prisma.mjs";
import { PrismaCommentsStore } from "./comments-prisma.mjs";

export const userCache = new Keyv(cacheStore, { namespace: "userCache", });
const commentStore = new PrismaCommentsStore();
const postStore = new PrismaPostsStore();
const log = debug("posts:postUsers-prisma")


export class PrismaPostsUsersStore {
  static #inFlight  = new Map()
  async create(userId, userName, displayName, firstName, lastName, email, provider, photo, photoType) {
    await prisma.$connect();
    const user = await prisma.postUser.create(
      {
        data: {
          id: userId,
          username: userName,
          displayName: displayName,
          firstName,
          lastName,
          email,
          provider: provider,
          photo: photo,
          photoType: photoType
        },
        omit: {photo: true}
      }
    )
    await userCache.set(userId, user)
    await userCache.set(userName, user)
    return user
  }
  async updateAbout(userId, about) {
    await prisma.$connect();
    const user = await prisma.postUser.update({
      where: { id: userId },
      data: {
        about
      },
      omit: {photo: true}
    })
    await userCache.set(userId, user)
    await userCache.set(user.username, user)
    return user
  }

  async updatePersonal(userId, displayName, firstName, lastName, about) {
    await prisma.$connect();
    const user = await prisma.postUser.update({
      where: { id: userId },
      data: {
        displayName,
        firstName,
        lastName,
        about,
      },
      omit: { photo: true }
    })
    await userCache.set(userId, user)
    await userCache.set(user.username, user)
    return user
  }

  async read(userId) {
    const cachedUser = await userCache.get(userId)
    if (cachedUser) return cachedUser
    
    await prisma.$connect();
    log("DataBase read query: userId ")
    const user = await prisma.postUser.findUnique({
      where: { id: userId },
      omit: { photo: true }
    })
    await userCache.set(userId, user)
    await userCache.set(user.username, user)
    return user;
  }

  async updatePhoto(userId, photo, photoType) {
    await prisma.$connect()
    const user = await prisma.postUser.update({
      where: { id: userId },
      data: { photo, photoType },
      omit: { photo: true }
    })
    return user
  }
  async readByUserName(userName) {
    const cachedUser = await userCache.get(userName)
    if (cachedUser) return cachedUser;

    log("DataBase read query username: " + userName)
    await prisma.$connect();
    const user = await prisma.postUser.findUnique({
      where: { username: userName },
      omit: { photo: true }
    })
    
    await userCache.set(user.id, user)
    await userCache.set(userName, user)
    return user;
  }

  async getAllData(userName) {
    
    const user = await this.readByUserName(userName) 
    user.posts = await postStore.getUserPosts(user.id, false)
    user.comments = await commentStore.getAllByUser(user.id)
    return user
  }

  async getPublicData(userName) {

    const user = await this.readByUserName(userName)
    const posts = await postStore.getUserPosts(user.id, true)
    user.posts = posts
    return user;
  }
  
  async getPhotoByUserName(userName) {
    await prisma.$connect();
    const user = await prisma.postUser.findUnique({
      where: { username: userName },
    })
    return user;
  }

  async destroy(userId) {
    await prisma.$connect()
    const user = await prisma.postUser.delete({
      where: { id: userId },
      select: {username: true}
    })
    await userCache.delete(userId);
    await userCache.delete(user.username);
    await postStore.onUserDestroyed(userId);
  }
}