import { default as express } from "express";
import { NotesStore as notes, NotesStore } from "../models/notes-store.mjs";
import { default as DBG } from "debug";
import { ensureAuthenticated } from "./users.mjs";
import { WsServer } from "../app.mjs"
import { PrismaCommentsStore } from "../models/comments-prisma.mjs";

const debug = DBG('notes:routs_notes.mjs')
const dbgerror = DBG('notes:error')
const commentStore = new PrismaCommentsStore()
export const router = express.Router();

export function addNoteListners() {
  commentStore.on("commentcreated", (notekey, comment) => {
    WsServer.clients.forEach(socket => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: "commentcreated", notekey, comment }))
      }
    })
  })
  notes.on("noteupdated", note => {
    WsServer.clients.forEach(socket => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: "noteupdated", note }))
      }
    })
  })
}
export async function init(socket) {
  socket.on("message",async (rawData) => {
    let req = JSON.parse(rawData.toString())
    if (req.type === "createcomment" && socket.user) {
      try {
        const comment = await commentStore.create(req.body.notekey, req.body.autherId, req.body.commentBody);
        
      } catch (error) {
        console.error(error)
      }
    }
  })
}

//Add Notes.
router.get('/add', ensureAuthenticated, (req, res, next) => {
  res.render('noteedit', {
    title: "Add a Note",
    docreate: true,
    notekey: '',
    note: undefined,
    user: req.user ? req.user : undefined
  })
});

//save Note (update)
router.post('/save', ensureAuthenticated, async (req, res, next) => {
  try {
    let note;
    let notekey = req.body.notekey;
    notekey = notekey.trim();
    debug(req.body.docreate);
    if (req.body.docreate === "create") {
      note = await notes.create(notekey, req.body.title, req.body.body, req.user.id)
    } else {
      note = await notes.read(notekey)
      if (note.autherId !== req.user.id) {
        res.redirect("/")
      }
      note = await notes.update(notekey, req.body.title, req.body.body, req.user.id)
    }
    res.redirect('/notes/view?key=' + notekey)
  } catch (err) {
    next(err)
  }
});

router.get('/view', async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key);
    res.render('noteview', {
      title: note ? note.title : "",
      notekey: req.query.key, note: note,
      user: req.user ? req.user : undefined
    })
  } catch (err) { next(err) }
})


//Edit note (update)
router.get('/edit', ensureAuthenticated, async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key);
    if (note.autherId !== req.user.id) {
      res.redirect("/")
    }
    res.render('noteedit', {
      title: note ? ("Edit " + note.title) : "Add a Note",
      docreate: false,
      notekey: req.query.key, note: note,
      user: req.user ? req.user : undefined
    })
  } catch (err) {
    next(err)
  }
})
//TO delelete notes 

router.get('/destroy', ensureAuthenticated, async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key);
    if (note.autherId !== req.user.id) {
      res.redirect("/")
    }
    res.render('notedestroy', {
      title: note ? note.title : "",
      notekey: req.query.key, note: note,
      user: req.user ? req.user : undefined
    })
  } catch (err) {
    next(err)
  }
})

router.post('/destroy/confirm', ensureAuthenticated, async (req, res, next) => {
  try {
    let note = await notes.read(req.body.notekey);
    if (note.autherId !== req.user.id) {
      res.redirect("/")
    }
    await notes.destroy(req.body.notekey);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
})



router.post('/comment/destroy', ensureAuthenticated, async (req, res, next) => {
  try {
    const comment = await commentStore.read(req.body.id)
    if (comment.id === req.user.id) {
      await commentStore.destroy(comment.id);
      res.send(comment)
    }
    res.end
  } catch (error) {
    next(error)
  }
})