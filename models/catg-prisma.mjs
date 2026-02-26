import { prisma } from "./prisma.mjs";
import EventEmitter from "node:events";
import PrismaPostsStore from "./posts-prisma.mjs";
import Keyv from "keyv";
import { cacheStore } from "./cache.mjs";

class PostCatgCache {
  #locks;
  constructor(cacheStore) {
    this.#locks = new Map(); // Map<String, Promise>
    this.cache = new Keyv(cacheStore, { namespace: "postCatgCache" });
    this.attachEvents();
  }
  attachEvents() {
    PrismaPostsStore.Events.on("catgcreated", (catgName, postkey) => {
      return this.lock(catgName, async () => {
        const keylist = await this.get(catgName);
        if (!keylist) return;
        keylist.unshift(postkey);
        return this.set(catgName, keylist)
      })
    })
    PrismaPostsStore.Events.on("catgdestroyed", (catgName, postkey) => {
      return this.lock(catgName, async () => {
        /** @type {String[]} */
        const keylist = await this.get(catgName);
        if (!keylist) return;
        const updatedList = keylist.filter(key => {
          return key !== postkey
        })
        return this.set(catgName, updatedList)
      })
    })
  }
  async lock(key, task) {
    const previous = this.#locks.get(key) || Promise.resolve();

    const next = previous.then(async () => {
      try {
        await task();
      } catch (error) {
        console.error(error);
      }
    });
    this.#locks.set(key, next);
    next.finally(() => {
      if (this.#locks.get(key) === next) {
        this.#locks.delete(key);
      }
    });
  }
  set(key, value) {
    return this.cache.set(key, value);
  }
  get(key) {
    return this.cache.get(key);
  }
}

const postCatgCache = new PostCatgCache(cacheStore);

export class PrismaPostCatgStore {
  static events = new EventEmitter();
  static inFlight = new Map(); // Map<String, Promice>

  async setFlight(key, task) {
    const cached = await postCatgCache.get(key);
    if (cached) return cached;

    if (PrismaPostCatgStore.inFlight.get(key)) {
      return PrismaPostCatgStore.inFlight.get(key);
    }
    const fetchTask = task();
    PrismaPostCatgStore.inFlight.set(key, fetchTask);
    return fetchTask;
  }



  async getPostKeysByCatg(catgName) {
    return this.setFlight(catgName, async () => {
      try {
        if (catgName === "All Posts") {
          const postkeys = await prisma.categoryToPosts
            .findMany({
              orderBy: { createdAt: "desc" },
            })
            .then((v) => {
              const keys = new Set();
              v.forEach(c => keys.add(c.postkey));
              return Array.from(keys.values())
            });

          postCatgCache.set(catgName, postkeys);

          return postkeys;
        } else {
          const postkeys = await prisma.categoryToPosts
            .findMany({
              where: { catgName },
              orderBy: { createdAt: "desc" },
            })
            .then((v) => v.map((c) => c.postkey));

          postCatgCache.set(catgName, postkeys);

          return postkeys;
        }

      } catch (error) {
        console.error(error);
      }
    });
  }
  /** @param {String} feedlist  */
  async getFeed(feedlist) {
    try {
      const postkeys = await prisma.categoryToPosts
        .findMany({
          where: { catgName: { in: JSON.parse(feedlist) } },
          orderBy: { createdAt: "desc" },
        })
        .then((v) => v.map((c) => c.postkey));
      return Array.from(new Set(postkeys).values());
    } catch (error) {
      console.log(error)
    }

  }
  async getCategoriesNames() {
    return this.setFlight("allCatgsNames", async () => {
      try {
        const categories = await prisma.categories
          .findMany({ select: { name: true } })
          .then((v) => v.map((c) => c.name));
        postCatgCache.set("allCatgsNames", categories);
        return categories;
      } catch (error) {
        console.error(error);
      }
    });
  }
}