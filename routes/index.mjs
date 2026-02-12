import * as express from 'express';
import { postsStore as posts } from '../models/posts-store.mjs';
import { WsServer } from '../app.mjs';
import { commentStore } from './posts.mjs';
import { userRoutsEvents } from './users.mjs';

let cachedposts;
let changed = true;

export const router = express.Router();

export function wsHomeListners() {
  userRoutsEvents.on("userdestroyed", () => {changed = true } )
  commentStore.on("commentcreated", () => { changed = true })
  commentStore.on("commentdestroyed", () => { changed = true })
  posts.on('postcreated', (post) => {
    changed = true
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: "postcreated", post: post }))
    })
  })
  posts.on('postdestroyed', (key) => {
    changed = true
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: 'postdestroyed', key: key }));
    })
  })
  posts.on("postupdated", () => {
    changed = true
  })

}
/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    if (!changed) {
      res.render('index', {
        title: 'PostBase', postlist: cachedposts,
        homepage: true,
        user: req.user ? req.user : undefined,
        level: req.query.level,
        massage: req.query.massage,
        wsURL: process.env.WS_URL
      });
      return
    }

    const keylist = await posts.keylist();
    const keyPromises = keylist.map(key => {
      return posts.read(key);
    });

    let postlist = await Promise.all(keyPromises);
    cachedposts = postlist;
    changed = false;
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
    title: 'Privacy Policy', postlist: cachedposts,
    user: req.user ? req.user : undefined,
  })
})

router.get("/terms-of-services", (req, res, next) => {
  res.render('terms', {
    title: 'Terms of Services', postlist: cachedposts,
    user: req.user ? req.user : undefined,
  })
})

router.get("/about-postbase", (req, res, next) => {
  res.render('about-postbase', {
    title: 'What is PostBase?', postlist: cachedposts,
    user: req.user ? req.user : undefined,
  })
})