import { default as express } from "express";
import PrismaPostsStore from "../models/posts-prisma.mjs"
import { default as DBG } from "debug";
import { ensureAuthenticated } from "./users.mjs";
import { WsServer } from "../app.mjs"
import { PrismaCommentsStore } from "../models/comments-prisma.mjs";
import { PrimsaLikesStore } from "../models/likes-prisma.mjs";
import { PrismaPostCatgStore } from "../models/catg-prisma.mjs";
import * as crpto from 'node:crypto';
import sanitizeHtml from 'sanitize-html';
import multer from "multer"

const debug = DBG('posts:routs_posts.mjs')
const dbgerror = DBG('posts:error')
export const commentStore = new PrismaCommentsStore()
export const likeStore = new PrimsaLikesStore()
export const catgsStore = new PrismaPostCatgStore();
const posts = new PrismaPostsStore()
import { picStore } from "./users.mjs";
export const router = express.Router();

export function wsPostsListeners() {
  commentStore.events.on("commentcreated", (postkey, comment) => {
    WsServer.clients.forEach(socket => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: "commentcreated", postkey, comment }))
      }
    })
  })
  commentStore.events.on("commentdestroyed", (postkey, id) => {
    WsServer.clients.forEach(socket => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: "commentdestroyed", postkey, id }))
      }
    })
  })
  PrismaPostsStore.Events.on("postupdated", post => {
    WsServer.clients.forEach(socket => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: "postupdated", post }))
      }
    })
  })
}
export async function initSocket(socket) {
  socket.on("message", async (rawData) => {
    let req = JSON.parse(rawData.toString())
    if (req.type === "createcomment" && socket.user) {
      try {
        const comment = await commentStore.create(req.body.postkey, req.body.autherId, req.body.commentBody);

      } catch (error) {
        console.error(error)
      }
    }
  })
}

//Add posts.
router.get('/add', ensureAuthenticated, async (req, res, next) => {
  const catgNameList = (await catgsStore.getCategoriesNames()).map(v => {
    return { catgName: v }
  })
  res.render('postedit', {
    title: "Add a post",
    docreate: true,
    postkey: '',
    catgNameList,
    post: undefined,
    user: req.user ? req.user : undefined
  })
});

//save post (update)
const upload = multer({
  storage: multer.memoryStorage()
})
router.post('/save', ensureAuthenticated, upload.single("imageFile"), async (req, res, next) => {
  try {
    let post;
    let postkey;

    const cleanHtml = sanitizeHtml(req.body.body, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'strong', 'b', 'em', 'i', 'small',
        'sub', 'sup', 'mark', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'a', 'blockquote',
        'code', 'pre', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
        'img', 'figure', 'figcaption', 'video', 'audio', 'hr', 'br'
      ],
      allowedAttributes: {
        a: ['href', 'name', 'target', 'rel', 'title'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        '*': ['class', 'id', 'title'] // global attributes
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    })
    debug(req.body.docreate);

    if (req.body.docreate === "create") {
      postkey = crpto.randomUUID();
      let imageURL;

      if (req.file) {
        const fileBuffer = new Uint8Array(req.file.buffer)
        const pic = await picStore.add(fileBuffer, "/assets/posts/pictures/", req.file.mimetype.replace("image/", ""))
        imageURL = pic.url;
      } else if (req.body.imageURL) {
        imageURL = req.body.imageURL
      }

      post = await posts.create(postkey, req.body.title, cleanHtml, req.user.id, imageURL, req.body.catg1, req.body.catg2, req.body.catg3)
    } else {

      postkey = req.body.postkey
      post = await posts.read(postkey)

      if (post.autherId !== req.user.id) {
        res.redirect("/")
        return
      }
      let imageURL;

      if (req.file) {
        const fileBuffer = new Uint8Array(req.file.buffer)
        const pic = await picStore.add(fileBuffer, "/assets/posts/pictures/", req.file.mimetype.replace("image/", ""))
        imageURL = pic.url;
        await picStore.remove(post.coverPic)
      } else if (req.body.imageURL != post.coverPic) {
        imageURL = req.body.imageURL
        await picStore.remove(post.coverPic)
      } else {
        imageURL = post.coverPic
      }
      post = await posts.update(postkey, req.body.title, cleanHtml, req.user.id, imageURL)
    }
    res.redirect('/posts/view?key=' + postkey)
  } catch (err) {
    next(err)
  }
});

router.get('/view', async (req, res, next) => {
  try {
    let post = await posts.read(req.query.key);
    if (!post) res.redirect("/")
    let owner = false
    if (req.user)
      if (req.user.id === post.autherId) {
        owner = true
      }
    res.render('postview', {
      title: post ? post.title : "",
      postkey: req.query.key, post: post,
      user: req.user ? req.user : undefined,
      owner,
      wsURL: process.env.WS_URL
    })
  } catch (err) { next(err) }
})


//Edit post (update)
router.get('/edit', ensureAuthenticated, async (req, res, next) => {
  try {
    let post = await posts.read(req.query.key);
    if (post.autherId !== req.user.id) {
      res.redirect("/?level=error&massage=" +
        encodeURIComponent("! You can only Edit your posts."))
      return
    }
    res.render('postedit', {
      title: post ? ("Edit " + post.title) : "Add a post",
      docreate: false,
      postkey: req.query.key, post: post,
      user: req.user ? req.user : undefined
    })
  } catch (err) {
    next(err)
  }
})
//TO delelete posts 

router.get('/destroy', ensureAuthenticated, async (req, res, next) => {
  try {
    let post = await posts.read(req.query.key);
    if (post.autherId !== req.user.id) {
      res.redirect("/")
      return;
    }
    res.render('postdestroy', {
      title: post ? post.title : "",
      postkey: req.query.key, post: post,
      user: req.user ? req.user : undefined
    })
  } catch (err) {
    next(err)
  }
})

router.post('/destroy/confirm', ensureAuthenticated, async (req, res, next) => {
  try {
    let post = await posts.read(req.body.postkey);
    if (post.autherId !== req.user.id) {
      res.redirect("/?level=error&massage=" +
        encodeURIComponent("! You Cannot delete Other User posts"))
      return
    }
    await posts.destroy(req.body.postkey);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
})



router.get('/comment/destroy/:id', ensureAuthenticated, async (req, res, next) => {
  try {
    const comment = await commentStore.read(Number(req.params.id))
    if (comment.autherId === req.user.id) {
      await commentStore.destroy(comment.id, comment.postkey);
      res.status(200)
      res.send("success")
    } else {
      res.send("Not allowed")
    }

  } catch (error) {
    next(error)
  }
})
router.get("/categories-names-list", ensureAuthenticated, async (req, res, next) => {
  const catgsList = await catgsStore.getCategoriesNames()
  res.type("application/json");
  res.send(catgsList)
})
router.post('/likes/add', ensureAuthenticated, async (req, res, next) => {
  const postkey = req.body?.postkey;
  const userId = req.body?.userId
  if (postkey, userId) {
    const like = await likeStore.create(postkey, userId)
    res.status(200)
    res.end("Ok")
  }
})

router.post('/likes/destroy', ensureAuthenticated, async (req, res, next) => {
  const postkey = req.body?.postkey;
  const userId = req.body?.userId
  if (postkey, userId) {
    const like = await likeStore.destroy(postkey, userId)
    res.status(200)
    res.end("Ok")
  }
})


