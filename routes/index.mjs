import * as express from 'express';
import { NotesStore as notes } from '../models/notes-store.mjs';
import { WsServer } from '../app.mjs';

export const router = express.Router();

export function addNoteListners() {
  notes.on('notecreated', (note) => {
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: "notecreated", note: note }))
    })
  })
  notes.on('notedestroyed', (key) => {
    WsServer.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
        socket.send(JSON.stringify({ type: 'notedestroyed', key: key }));
    })
  })
}
/* GET home page. */
router.get('/', async (req, res, next) => {
  try {
    const keylist = await notes.keylist();
    //console.log(`keylist ${util.inspect(keylist)}`);
    const keyPromises = keylist.map(key => {
      return notes.read(key);
    });
    let notelist = await Promise.all(keyPromises);
    //console.log(util.inspect(notelist));
    if (notelist.length === 0) {
      notelist = false;
    }
    res.render('index', {
      title: 'OpenNotes', notelist: notelist,
      user: req.user ? req.user : undefined,
      level: req.query.level,
      massage: req.query.massage
    }); new Intl.RelativeTimeFormat()
  } catch (err) {
    next(err);
  }
});