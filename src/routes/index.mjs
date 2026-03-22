import * as express from "express";
import { WsServer } from "../app.mjs";
import { catgsStore } from "./posts.mjs";
import PrismaPostsStore from "../models/posts-prisma.mjs";
import { postsUsersStore } from "./users.mjs";

export const router = express.Router();
export const postsStore = new PrismaPostsStore();

export function wsHomeListners() {
  PrismaPostsStore.Events.on("postcreated", (post) => {
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: "postcreated", post: post }));
    });
  });
  PrismaPostsStore.Events.on("postdestroyed", (key) => {
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: "postdestroyed", key: key }));
    });
  });
}
router.get("/explore/:catgName", async (req, res, next) => {
  /**@type {[]} */
  const keylist = await catgsStore.getPostKeysByCatg(req.params.catgName);
  const catgNameList = (await catgsStore.getCategoriesNames()).map((v) => {
    return { catgName: v };
  });

  const pageNo = req.query.page ? Number(req.query.page) : 1;
  const sort = req.query.sort === "oldest" ? "oldest" : "latest";
  if (sort === "oldest") keylist.reverse()
  const limit = req.query.limit ? Number(req.query.limit) : 5;

  let limitList = [{ limits: 3 }, { limits: 5 }, { limits: 7 }, { limits: 10 }]

  limitList = limitList.map(v => {
    if (v.limits === limit) return { limits: v.limits, checked: true }
    else return { limits: v.limits, checked: false }
  })
  const start = (pageNo - 1) * limit;
  const pageKeys = keylist.slice(start, start + limit);
  const postlist = await Promise.all(
    pageKeys.map((key) => postsStore.read(key)),
  );
  
  let baseUrl = req.url.substring(0, req.url.lastIndexOf("?"));

  res.render("index", {
    title: "Exploring " + req.params.catgName,
    postlist: postlist,
    catgName: req.params.catgName,
    total: keylist.length,
    limit: limit,
    limitList,
    sort: sort,
    latest: sort == "latest" ? true : false,
    current: pageNo,
    baseUrl: baseUrl,
    totalPages:  Math.ceil(keylist.length / limit) || 1,
    catgNameList: catgNameList,
    user: req.user ? req.user : undefined,
    level: req.query.level,
  });
});
/* GET home page. */
router.get("/your-feed", async (req, res, next) => {
  if (!req.user) {
    res.redirect("/explore/All%20Posts");
    return;
  }
  const user = await postsUsersStore.read(req.user.id);
  /** @type {String[]} */
  const feedCatgsList = JSON.parse(user.feedCatgs);

  const catgNameList = (await catgsStore.getCategoriesNames()).map((v) => {
    if (feedCatgsList?.includes(v)) {
      return { catgName: v, checked: true };
    } else return { catgName: v, checked: false };
  });
  if (!user.feedCatgs) {
    res.render("index", {
      title: "Your Feed",
      postlist: false,
      feedPage: true,
      catgNameList,
      user: req.user ? req.user : undefined,
      level: req.query.level,
    });
    return;
  }

  const keylist = await catgsStore.getFeed(user.feedCatgs);

  const pageNo = req.query.page ? Number(req.query.page) : 1;
  const sort = req.query.sort === "oldest" ? "oldest" : "latest";
  if (sort === "oldest") keylist.reverse()
  const limit = req.query.limit ? Number(req.query.limit) : 5;

  let limitList = [{ limits: 3 }, { limits: 5 }, { limits: 7 }, { limits: 10 }]

  limitList = limitList.map(v => {
    if (v.limits === limit) return { limits: v.limits, checked: true }
    else return { limits: v.limits, checked: false }
  })
  const start = (pageNo - 1) * limit;

  const pageKeys = keylist.slice(start, start + limit);
  const postlist = await Promise.all(
    pageKeys.map((key) => postsStore.read(key)),
  );

  const baseUrl = req.url.substring(0, req.url.lastIndexOf("?"));
  res.render("index", {
    title: "Your Personal Feed",
    postlist: postlist,
    feedPage: true,
    total: keylist.length,
    limit: limit,
    limitList,
    sort: sort,
    latest: sort == "latest" ? true : false,
    current: pageNo,
    baseUrl: baseUrl,
    totalPages:  Math.ceil(keylist.length / limit) || 1,
    catgNameList,
    user: req.user ? req.user : undefined,
    level: req.query.level,
  });
});
router.get("/", async (req, res, next) => {
  try {
    const keylist = (await postsStore.keylist()).filter((v, i) => i <= 2);
    const keyPromises = keylist.map((key) => {
      return postsStore.read(key);
    });

    let postlist = await Promise.all(keyPromises);
    if (postlist.length === 0) {
      postlist = false;
    }

    res.render("index", {
      title: "PostBase",
      postlist: postlist,
      homepage: true,
      user: req.user ? req.user : undefined,
      level: req.query.level,
      massage: req.query.massage,
      updates: true,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/privacy-policy", (req, res, next) => {
  res.render("privacy", {
    title: "Privacy Policy",
    user: req.user ? req.user : undefined,
  });
});

router.get("/terms-of-services", (req, res, next) => {
  res.render("terms", {
    title: "Terms of Services",
    user: req.user ? req.user : undefined,
  });
});

router.get("/about-postbase", (req, res, next) => {
  res.render("about-postbase", {
    title: "About Postbase",
    user: req.user ? req.user : undefined,
  });
});
