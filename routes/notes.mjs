import { default as express } from "express";
import { NotesStore as notes } from "../models/notes-store.mjs";
import { title } from "node:process";
export const router = express.Router();

//Add Notes.
router.get('/add', (req, res, next) => {
  res.render('noteedit', {
    title: "Add a Note",
    docreate: true,
    notekey: '',
    note: undefined
  })
});
//save Note (update)
router.post('/save', async (req, res, next) => {
  try {
    console.log(req.body.title)
    let note;
    if (req.body.docreate === "create") {
      note = await notes.create(req.body.notekey, req.body.title, req.body.body)
    } else {
      note = await notes.update(req.body.notekey, req.body.title, req.body.body)
    }
    res.redirect('/notes/view?key='+req.body.notekey)
  } catch (err) {
    next(err)
  }
});

router.get('/view', async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key);
    res.render('noteview', {
      title: note ? note.title : "",
      notekey: req.query.key, note: note
    })
  } catch (err) { next(err) }
})

//Edit note (update)
router.get('/edit', async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key);
    res.render('noteedit', {
      title: note ? ("Edit "+note.title) : "Add a Note",
      docreate : false,
      notekey: req.query.key, note: note
    })
  } catch (err) {
    next(err)
  }
})
//TO delelete notes 

router.get('/destroy', async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key);
    res.render('notedestroy', {
      title: note ? note.title : "",
      notekey: req.query.key, note: note
    })
  } catch (err) {
    next(err)
  }
})

router.post('/destroy/confirm', async (req, res, next) => {
  try { console.log(req.body.notekey)
    await notes.destroy(req.body.notekey);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
})