import * as express from 'express';
import { NotesStore as notes } from '../models/notes-store.mjs';
import { WsServer } from '../app.mjs';
import { commentStore } from './notes.mjs';
import { userRoutsEvents } from './users.mjs';

let cachedNotes;
let changed = true;

export const router = express.Router();

export function wsHomeListners() {
  userRoutsEvents.on("userdestroyed", () => {changed = true } )
  commentStore.on("commentcreated", () => { changed = true })
  commentStore.on("commentdestroyed", () => { changed = true })
  notes.on('notecreated', (note) => {
    changed = true
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: "notecreated", note: note }))
    })
  })
  notes.on('notedestroyed', (key) => {
    changed = true
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: 'notedestroyed', key: key }));
    })
  })
  notes.on("noteupdated", () => {
    changed = true
  })

}
/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    if (!changed) {
      res.render('index', {
        title: 'OpenNotes', notelist: cachedNotes,
        user: req.user ? req.user : undefined,
        level: req.query.level,
        massage: req.query.massage
      });
      return
    }

    const keylist = await notes.keylist();
    const keyPromises = keylist.map(key => {
      return notes.read(key);
    });

    let notelist = await Promise.all(keyPromises);
    cachedNotes = notelist;
    changed = false;
    if (notelist.length === 0) {
      notelist = false;
    }
    res.render('index', {
      title: 'OpenNotes', notelist: notelist,
      user: req.user ? req.user : undefined,
      level: req.query.level,
      massage: req.query.massage
    });
  } catch (err) {
    next(err);
  }
});