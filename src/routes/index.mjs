import * as express from 'express';
import { WsServer } from '../app.mjs';
import { catgsStore } from './posts.mjs';
import PrismaPostsStore from "../models/posts-prisma.mjs";
import { postsUsersStore } from './users.mjs';

export const router = express.Router();
export const postsStore = new PrismaPostsStore()

export function wsHomeListners() {

  PrismaPostsStore.Events.on('postcreated', (post) => {
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: "postcreated", post: post }))
    })
  })
  PrismaPostsStore.Events.on('postdestroyed', (key) => {

    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: 'postdestroyed', key: key }));
    })
  })


}
router.get("/explore/:catgName", async (req, res, next) => {
  const keylist = await catgsStore.getPostKeysByCatg(req.params.catgName)
  const catgNameList = (await catgsStore.getCategoriesNames()).map(v => {
    return { catgName: v }
  })
  const postlist = await Promise.all(keylist.map(key => postsStore.read(key)))
  res.render("index", {
    title: "Exploring " + req.params.catgName,
    postlist: postlist,
    catgName: req.params.catgName,
    total: postlist.length,
    catgNameList,
    user: req.user ? req.user : undefined,
    level: req.query.level
  })

})
/* GET home page. */
router.get("/your-feed", async (req, res, next) => {

  if (!req.user) {
    res.redirect("/explore/All%20Posts")
    return
  }
  const user = await postsUsersStore.read(req.user.id) ;
  /** @type {String[]} */
  const feedCatgsList = JSON.parse(user.feedCatgs)

  const catgNameList = (await catgsStore.getCategoriesNames()).map(v => {

    if (feedCatgsList?.includes(v)) {
      return { catgName: v, checked: true }
    } else
      return { catgName: v, checked: false }
  })
  if (!user.feedCatgs) {
    res.render("index", {
      title: "Your Feed",
      postlist: false,
      feedPage: true,
      catgNameList,
      user: req.user ? req.user : undefined,
      level: req.query.level
    })
    return
  }
  
  const keylist = await catgsStore.getFeed(user.feedCatgs)
  const postlist = await Promise.all(keylist.map(key => postsStore.read(key)))
  res.render("index", {
    title: "Your Personal Feed",
    postlist: postlist,
    feedPage: true,
    catgNameList,
    user: req.user ? req.user : undefined,
    level: req.query.level
  })
})
router.get('/', async (req, res, next) => {
  try {

    const keylist = (await postsStore.keylist()).filter((v, i) => i <= 2);
    const keyPromises = keylist.map(key => {
      return postsStore.read(key);
    });

    let postlist = await Promise.all(keyPromises);
    if (postlist.length === 0) {
      postlist = false;
    }
    res.render('index', {
      title: 'PostBase', postlist: postlist,
      homepage: true,
      user: req.user ? req.user : undefined,
      level: req.query.level,
      massage: req.query.massage
    });
  } catch (err) {
    next(err);
  }
});

router.get("/privacy_policy", (req, res, next) => {
  res.render('privacy', {
    title: 'Privacy Policy',
    user: req.user ? req.user : undefined,
  })
})

router.get("/terms-of-services", (req, res, next) => {
  res.render('terms', {
    title: 'Terms of Services',
    user: req.user ? req.user : undefined,
  })
})

router.get("/about-postbase", (req, res, next) => {
  res.render('about-postbase', {
    title: 'About Postbase',
    user: req.user ? req.user : undefined,
  })
})