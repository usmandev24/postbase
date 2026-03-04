
import { prisma } from "./prisma.js";

import debug from "debug";
import { cacheStore } from "./cache.mjs";
import Keyv from "keyv";
import PrismaPostsStore from "./posts-prisma.mjs";
import { PrismaCommentsStore } from "./comments-prisma.mjs";
import { PrimsaLikesStore } from "./likes-prisma.mjs";

const commentStore = new PrismaCommentsStore();
const postStore = new PrismaPostsStore();
const likestore = new PrimsaLikesStore()
const log = debug("posts:postUsers-prisma")

class UserCache {
  #locks
  constructor(store) {
    this.#locks = new Map();
    this.cache = new Keyv(store, { namespace: 'userCache' })
    this.attachEvents();
  }
  attachEvents() {
    likestore.events.on("likecreated", (postkey, userId) => {
      return this.lock(userId, async () => {

        const likeKeys = await this.getLikeKeys(userId); // String[] || null
        if (likeKeys) {
          likeKeys.push(postkey) ;
          return this.setLikes(userId, likeKeys)
        }
      })
    })
    likestore.events.on("likedestroyed", (postkey, userId) => {
      return this.lock(userId, async () => {
        /** @type {string []} */
        const likeKeys = await this.getLikeKeys(userId); // String[] || null
        if (likeKeys) {
          const updatedKeys = likeKeys.filter((key) => {
            return key !== postkey
          })
          return this.setLikes(userId, updatedKeys)
        }
      })
    })
  }
  async lock(key, task) {
    const previous = this.#locks.get(key) || Promise.resolve()
    const next = previous.then(async () => {
      try {
        await task()
      } catch (error) {
        console.error(error)
      }
    })

    this.#locks.set(key, next)
    return next.finally(() => {
      if (this.#locks.get(key) === next) this.#locks.delete(key)
    })
  }
  async setUser(userId, value, username) {
    await this.cache.set(userId, value)
    if (username) await this.cache.set(username, value)
  }
  async get(key) {
    return this.cache.get(key)
  }
  async destroy(userId, userName) {
    return this.cache.deleteMany([userId, userName, "likeskeys" + id]);
  }
  async setLikes(id, keys) {
    return this.cache.set("likekeys" + id, keys)
  }
  async getLikeKeys(id) {
    return this.cache.get("likekeys" + id)
  }
}

export const userCache = new UserCache(cacheStore)

export class PrismaPostsUsersStore {
  static #inFlight = new Map()
  async create(userId, userName, displayName, firstName, lastName, email, provider, photo, photoType) {
    ;
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
        omit: { photo: true }
      }
    )
    await userCache.setUser(user.id, user, user.username)
    return user
  }
  async updateAbout(userId, about) {
    ;
    const user = await prisma.postUser.update({
      where: { id: userId },
      data: {
        about
      },
      omit: { photo: true }
    })
    await userCache.setUser(user.id, user, user.username)

    return user
  }

  async updatePersonal(userId, displayName, firstName, lastName, about) {
    ;
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
    await userCache.setUser(user.id, user, user.username)
    return user
  }
  /** @param {String} feedCatg  */
  async updateFeed(userId, feedCatg) {
    const user = await prisma.postUser.update({
      where: {id: userId},
      data: {feedCatgs: feedCatg},
      omit: {photo: true}
    })
    await userCache.setUser(user.id, user, user.username)
    return user
  }
  async read(userId) {
    const cachedUser = await userCache.get(userId)
    if (cachedUser) return cachedUser

    ;
    log("DataBase read query: userId ")
    const user = await prisma.postUser.findUnique({
      where: { id: userId },
      omit: { photo: true }
    })
    if (!user) return null
    await userCache.setUser(user.id, user, user.username)
    return user;
  }

  async updatePhoto(userId, photo, photoType) {
    
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
    ;
    const user = await prisma.postUser.findUnique({
      where: { username: userName },
      omit: { photo: true }
    })
    if (!user) return null
    await userCache.setUser(user.id, user, user.username)
    return user;
  }

  async getAllData(userName) {

    const user = await this.readByUserName(userName)
    if (!user) return null;
    user.posts = await postStore.getUserPosts(user.id, false)
    user.comments = await commentStore.getAllByUser(user.id)
    return user
  }

  async getPublicData(userName) {

    const user = await this.readByUserName(userName)
    if (!user) return null;
    const posts = await postStore.getUserPosts(user.id, true)
    user.posts = posts
    return user;
  }
  async getUserPosts(username, onlyKeys) {
    const user = await this.readByUserName(username)
    if (!user) return null;
    return postStore.getUserPosts(user.id, false)
  }
  async getLikedPosts(username, onlyKeys) {
    const user = await this.readByUserName(username)
    if (!user) return null;
    
    let likesKeys;  // string[]
    if (await userCache.getLikeKeys(user.id)) {
      likesKeys = await userCache.getLikeKeys(user.id)
    } else {
      const likes = await likestore.getUserLikes(user.id);
      if (!likes) return null

      likesKeys = likes.map(like => {
        return like.postkey
      })
      await userCache.setLikes(user.id, likesKeys)
    }
    if (onlyKeys) return likesKeys;
    const likedPosts = likesKeys.map(key => {
      return postStore.readMin(key)
    })
    return await Promise.all(likedPosts)
  }
  
  async getPhotoByUserName(userName) {
    ;
    const user = await prisma.postUser.findUnique({
      where: { username: userName },
    })
    return user;
  }

  async destroy(userId) {
    
    const user = await prisma.postUser.delete({
      where: { id: userId },
      select: { username: true }
    })
    cacheStore.clear();
  }
}