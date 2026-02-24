
import EventEmitter from "events";
import { default as DBG } from "debug";
import { prisma } from "./prisma.mjs";
import { PrismaCommentsStore } from "./comments-prisma.mjs";
import { PrimsaLikesStore } from "./likes-prisma.mjs";
import Keyv from "keyv";
import { cacheStore } from "./cache.mjs";

const debug = DBG("posts:posts-prisma");
const dbgError = DBG("posts:error-prisma");

class PostCache {
  #locks;
  #cache;
  #inFlight;
  constructor(store, commentStore, likeStore) {
    this.#locks = new Map(); //Map<String, Promice<void>>
    this.#inFlight = new Map();
    this.#cache = new Keyv(store, { namespace: "postCache" });
    this.commentStore = commentStore;
    this.likeStore = new PrimsaLikesStore()
    this.attachEvents()

  }
  attachEvents() {
    this.commentStore.events.on("commentcreated", (postkey, comment) => {
      return this.lock(postkey, async () => {
        const post = await this.getPost(postkey);
        if (post) {
          post._count.comments += 1
          return this.set(postkey, post)
        }
      })
    })
    this.commentStore.events.on("commentdestroyed", (postkey, comment) => {
      return this.lock(postkey, async () => {
        const post = await this.getPost(postkey);
        if (post) {
          post._count.comments -= 1
          return this.set(postkey, post)
        }
      })
    })
    this.likeStore.events.on("likecreated", (postkey, userId) => {
      return this.lock(postkey, async () => {
        const post = await this.getPost(postkey);
        if (post) {
          post._count.likes += 1
          return this.set(postkey, post)
        }
      })
    })
    this.likeStore.events.on("likedestroyed", (postkey, userId) => {
      return this.lock(postkey, async () => {
        const post = await this.getPost(postkey);
        if (post) {
          post._count.likes -= 1
          return this.set(postkey, post)
        }
      })
    })
    
  }
  async lock(key, task) {
    const previous = this.#locks.get(key) || Promise.resolve()
    const next = previous.then(async () => {
      try {
        return await task()
      } catch (error) {
        console.error(error)
      }
    })

    this.#locks.set(key, next)
    return next.finally(() => {
      if (this.#locks.get(key) === next) {
        this.#locks.delete(key)
      }
    })
  }
  async setPost(postkey, post) {
    return this.lock(postkey, async () => {
      await this.#cache.set(postkey, post)
    })
  }
  async getPost(postkey) {
    return this.#cache.get(postkey)
  }
  async deletePost(postkey) {
    return this.#cache.delete(postkey)
  }
  async updateKeyList() {
    return this.#cache.delete("keyList")
  }
  
  async get(key) {
    return this.#cache.get(key)
  }
  async set(key, value) {
    return this.#cache.set(key, value)
  }
}

export async function connectDB() {
  await prisma.$connect();
}

const commentStore = new PrismaCommentsStore();
const postCache = new PostCache(cacheStore, commentStore);

export default  class PrismaPostsStore  {
  static #inFlight = new Map()  // Map<String, Promice<void>> Post which are being fetched from db.
  static Events = new EventEmitter()

  emitCreated(post) { PrismaPostsStore.Events.emit('postcreated', post); }
  emitUpdated(post) { PrismaPostsStore.Events.emit('postupdated', post); }
  emitDestroyed(key) { PrismaPostsStore.Events.emit('postdestroyed', key); }
  emitCatgCreated(catgName, postkey) { PrismaPostsStore.Events.emit("catgcreated", catgName, postkey) }
  emitCatgDestroyed(catgName, postkey) { PrismaPostsStore.Events.emit("catgdestroyed", catgName, postkey) }

  async close() {
    await prisma.$disconnect();
  }

  async create(key, title, body, autherId, ...catgs) {
    const catgsData = [];
    catgs.forEach(catg => {
      if (catg) {
        catgsData.push({ catgName: catg })
      }
    })
    const post = await prisma.posts.create({
      data: {
        key: key,
        title: title,
        body: body,
        autherId: autherId,
        catgs: { createMany: { data: catgsData } }
      },

      include: {
        auther: { select: { username: true, id: true, displayName: true } },
        _count: { select: { comments: true, likes: true } },
        catgs: true
      },
    });
    if (post.catgs) {
      post.catgs.forEach(c => {
        this.emitCatgCreated(c.catgName, c.postkey)
      })
      this.emitCatgCreated("All", key)
    }
    await postCache.setPost(key, post)
    await postCache.updateKeyList(key, "created");
    this.emitCreated(post)
    return post;
  }

  async update(key, title, body, autherId) {

    const post = await prisma.posts.findUnique({ where: { key }, select: { key: true } });
    if (!post) {
      throw new Error("No post found for " + key);
    } else {
      const post = await prisma.posts.update({
        where: { key },
        data: { key, title, body, autherId },
        include: {
          auther: { select: { username: true, id: true, displayName: true } },
          _count: { select: { comments: true, likes: true } },
          catgs: true
        },
      });
      await postCache.setPost(key, post)
      this.emitUpdated(post);
      return post;
    }
  }

  async readMin(key) {
    const cached = await postCache.getPost(key);
    if (cached) return cached

    if (PrismaPostsStore.#inFlight.has(key)) {
      return PrismaPostsStore.#inFlight.get(key)
    }

    const toFetch = (async () => {
      try {
        debug("Database Read post key: ", key);

        const post = await prisma.posts.findUnique({
          where: { key },
          include: {
            auther: { select: { username: true, id: true, displayName: true } },
            _count: { select: { comments: true, likes: true } },
            catgs: true
          },
        });
        if (!post) return null;
        postCache.setPost(key, post)
        return post

      } catch (error) {
        console.error(error)

      } finally {
        PrismaPostsStore.#inFlight.delete(key)
      }
    })();

    PrismaPostsStore.#inFlight.set(key, toFetch)
    return toFetch;
  }

  async read(key) {
    const post = await this.readMin(key)
    if (!post) return null
    const comments = await commentStore.readByPost(key, 0)
    post.comments = comments
    return post
  }
  async onUserDestroyed(userId) {
    await postCache.deleteKeyList();
  }
  async destroy(key) {
    const post = await this.readMin(key)
    await prisma.posts.delete({ where: { key: key } });
    await postCache.deletePost(key);
    await postCache.updateKeyList(key, "destroyed")
    await commentStore.clearCacheByPost(key, post._count.comments)
    if (post.catgs) {
      post.catgs.forEach(c => {
        this.emitCatgDestroyed(c.catgName, c.postkey)
      })
      this.emitCatgDestroyed("All", key)
    }
    this.emitDestroyed(key);
  }

  async keylist() {

    const cacheList = await postCache.get("keyList");
    if (cacheList) return cacheList;

    if (PrismaPostsStore.#inFlight.has("keyList")) {
      return PrismaPostsStore.#inFlight.get("keyList")
    }

    const fetchTask = (async () => {
      try {

        debug("post key list read");
        const posts = await prisma.posts.findMany({
          orderBy: { updatedAt: "desc" },
          select: { key: true },
        });
        const keys = posts.map((post) => post.key);
        postCache.setPost("keyList", keys)
        return keys;
      } catch (error) {
        console.error(error)
      } finally {
        PrismaPostsStore.#inFlight.delete("keyList")
      }
    })();

    PrismaPostsStore.#inFlight.set("keyList", fetchTask)
    return fetchTask
  }

  async getUserPosts(autherId, pb) {
    let postKeys;
    if (pb) {
      postKeys = await prisma.posts.findMany({
        where: { autherId, public: pb },
        select: { key: true },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      postKeys = await prisma.posts.findMany({
        where: { autherId },
        select: { key: true },
        orderBy: { updatedAt: "desc" },
      });
    }
    const posts = postKeys.map((post) => {
      return this.readMin(post.key)
    });
    return Promise.all(posts)
  }

  async count() {
    return await prisma.posts.count();
  }
}
