import EventEmitter from "events";
import { prisma } from "./prisma.mjs";
import { cacheStore } from "./cache.mjs";
import Keyv from "keyv";


const take = 20

class CommentCache {
  #byPostKey;
  #locks; // Map<string, Promise<void>>

  constructor(cacheStore) {
    this.#locks = new Map();
    this.#byPostKey = new Keyv(cacheStore, { namespace: "commentCacheByPostKey" });
  }

  // A helper to serialize operations per key
  async #lock(key, task) {
    // Get the current tail of the promise chain or start a fresh one
    const previous = this.#locks.get(key) || Promise.resolve();

    // Create the next link in the chain
    const next = previous.then(async () => {
      try {
        return await task();
      } catch (error) {
        console.error(`Cache operation failed for key ${key}:`, error);
      }
    });

    // Update the map so the next caller waits for "next"
    this.#locks.set(key, next);

    // Cleanup: Remove the lock once the chain is exhausted to prevent memory leaks
    return next.finally(() => {
      if (this.#locks.get(key) === next) {
        this.#locks.delete(key);
      }
    });
  }

  async addByPostKey(postkey, commentsList, collection = 0) {
    await this.#byPostKey.set(postkey + collection, commentsList);
  }

  async deleteComment(postkey, commentId, collection = 0) {
    const cacheKey = postkey + collection;
    return this.#lock(cacheKey, async () => {
      let commentList = await this.getByPostKey(postkey, collection);
      if (!commentList) return;

      const updatedList = commentList.filter(comment => comment.id !== commentId);
      await this.addByPostKey(postkey, updatedList, collection);
    });
  }

  async addNew(postkey, comment, collection = 0) {
    const cacheKey = postkey + collection;
    return this.#lock(cacheKey, async () => {
      let commentList = await this.getByPostKey(postkey, collection);
      if (!commentList) return;

      commentList.unshift(comment);
      await this.addByPostKey(postkey, commentList, collection);
    });
  }

  async getByPostKey(postkey, collection = 0) {
    return await this.#byPostKey.get(postkey + collection);
  }

  async dltAllByPostKey(postkey, collections) {
  
    const deletions = Array.from({ length: collections }, (_, i) => {
      const key = postkey + i;
      return this.#lock(key, () => this.#byPostKey.delete(key));
    });
    await Promise.all(deletions);
  }
}

const commentCache = new CommentCache(cacheStore)

export class PrismaCommentsStore {
  static #inFlight = new Map()
  static #events = new EventEmitter()
  get events () {
    return PrismaCommentsStore.#events;
  }
  async create(postkey, autherId, body) {
    const comment = await prisma.comments.create({
      data: {
        postkey: postkey,
        autherId: autherId,
        body: body
      },
      include: {
        auther: { select: { username: true, displayName: true } }
      }
    });

    await commentCache.addNew(postkey, comment, 0)
    PrismaCommentsStore.#events.emit("commentcreated", postkey, comment)
    return comment
  }

  async read(id) {
    const comment = await prisma.comments.findUnique({
      where: { id },
    })
    return comment
  }

  async readByPost(postkey, collection = 0) {
    const cacheKey = postkey + collection
    const cachedComments = await commentCache.getByPostKey(cacheKey)
    if (cachedComments) return cachedComments;

    if (PrismaCommentsStore.#inFlight.has(cacheKey)) {
      return PrismaCommentsStore.#inFlight.get(cacheKey);
    }
    const fetchTask = (async () => {
      try {
        const comments = await prisma.comments.findMany({
          where: { postkey },
          orderBy: { createdAt: "desc" },
          skip: collection * take,
          take: take,
          include: {
            auther: { select: { username: true, displayName: true } }
          }
        })
        await commentCache.addByPostKey(postkey, comments, collection)
        return comments
      } catch (error) {
        console.error(error)
      } finally {
        PrismaCommentsStore.#inFlight.delete(cacheKey)
      }
    })();

    PrismaCommentsStore.#inFlight.set(cacheKey, fetchTask)
    return fetchTask

  }

  async destroy(id, postkey, collection) {
    await prisma.comments.delete({ where: { id } })
    await commentCache.deleteComment(postkey, id, collection)
    PrismaCommentsStore.#events.emit("commentdestroyed", postkey, id)
  }
  async getAllByUser(autherId) {
    const comments = prisma.comments.findMany({
      where: {autherId},
      include: {post: {select: {title: true}}}
    })
  }
  async clearCacheByPost(postkey, totalComments) {
    const collections = Math.ceil(totalComments/take) ;
    await commentCache.dltAllByPostKey(postkey, collections)
  }
  
}