import * as express from 'express';
import * as util from "node:util";
import { NotesStore as notes } from '../models/notes-store.mjs';
import { WebSocketServer } from 'ws';



export const router = express.Router();
const ws = new WebSocketServer({ noServer: true })
export function init(req, socket, head) {
  if (req.url === "/home") {
    ws.handleUpgrade(req, socket, head, (socket, req) => {
      ws.emit('connection', socket, req)
    })
  }
}

ws.on('connection', (socket, req) => {
  socket.send(JSON.stringify({ type: 'connection', message: 'connected' }))
})
export function addNoteListners() {
  notes.on('notecreated', (note) => {
    ws.clients.forEach((socket) => {
      if (socket.readyState === socket.OPEN)
      socket.send(JSON.stringify({ type: "notecreated", note: note }))
    })
  })
  notes.on('notedestroyed', (key) => {
    ws.clients.forEach((socket) => {
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
      title: 'Notes', notelist: notelist,
      user: req.user ? req.user : undefined,
      level: req.query.level,
      massage: req.query.massage
    });
  } catch (err) {
    next(err);
  }
});