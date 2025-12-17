import { Note, AbstractNotesStore} from "./Notes.mjs"
import { default as DBG } from 'debug';
import { prisma } from "./prisma.mjs";

const debug = DBG('notes:notes-prisma');
const dbgError = DBG('notes:error-prisma');


export async function connectDB() {
  await prisma.$connect()
}
export default class PrismaNotesStore extends AbstractNotesStore {
  async close () {
    await prisma.$disconnect();
  }
  async create(notekey,  title, body, autherName) {
    await connectDB()
    const isNote = await this.read(notekey);
    if (isNote) {
      return  isNote;
    }
    const note = await prisma.notes.create({
      data: {
        notekey: notekey,
        title: title,
        body: body,
        autherName: autherName
      }
    });
    this.emitCreated({key: note.notekey, title:note.title, body: note.body, autherName: note.autherName})
    return new Note(note.notekey, note.title, note.body, note.autherName)
  }

  async update (notekey, title, body, autherName) {
    await connectDB();
    const note = await prisma.notes.findUnique({ where: {notekey}});
    if (!note) {
      throw new Error('No note found for '+notekey);
    } else {
      await prisma.notes.update({ where: {notekey}, data: {notekey, title, body, autherName}})
      const note = await this.read(notekey);
      this.emitUpdated({key: note.notekey, title:note.title, body: note.body, autherName: note.autherName})
      return note;
    }
  }

  async read(notekey) {
    await connectDB();
    const note = await prisma.notes.findUnique({where: {notekey}})
    if (!note) {
      return undefined;
    } else {
      return new Note(note.notekey, note.title, note.body, note.autherName);
    }
  }

  async destroy(notekey) {
    await connectDB();
    await prisma.notes.delete({where: {notekey}})
    this.emitDestroyed(notekey)
  }

  async keylist() {
    await connectDB();
    const notes = await prisma.notes.findMany();
    const notekeys = notes.map(note => note.notekey);
    return notekeys;
  }
  async getAllbyAutherName (autherName) {
    await connectDB();
    const notes =await prisma.notes.findMany({
      where: {autherName: autherName}
    })
    return notes.map(note => {
      return new Note(note.key, note.title, note.body, note.autherName)
    })
  }
  async count() {
    await connectDB();
    return await prisma.notes.count();
  }
}