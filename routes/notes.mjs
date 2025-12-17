import { default as express } from "express";
import { NotesStore as notes } from "../models/notes-store.mjs";
import { default as DBG } from "debug";
import { ensureAuthenticated } from "./users.mjs";

const debug = DBG('notes:routs_notes.mjs')
const dbgerror = DBG('notes:error')
export const router = express.Router();

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
      note = await notes.create(notekey, req.body.title, req.body.body, req.user.username)
    } else {
      note = await notes.read(notekey)
      if (note.autherName !== req.user.username) {
        res.redirect("/")
      }
      note = await notes.update(notekey, req.body.title, req.body.body, req.user.username)
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
    if (note.autherName !== req.user.username) {
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
    if (note.autherName !== req.user.username) {
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
    let note = await notes.read(req.body.key);
    if (note.autherName !== req.user.username) {
      res.redirect("/")
    }
    await notes.destroy(req.body.notekey);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
})