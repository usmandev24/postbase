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
  async create(key,  title, body) {
    await connectDB()
    const isNote = await this.read(key);
    if (isNote) {
      return  isNote;
    }
    const note = await prisma.notes.create({
      data: {
        key: key,
        title: title,
        body: body
      }
    });
    return new Note(note.key, note.title, note.body)
  }

  async update (key, title, body) {
    await connectDB();
    const note = await prisma.notes.findUnique({ where: { key: key}});
    if (!note) {
      throw new Error('No note found for '+key);
    } else {
      await prisma.notes.update({ where: {key}, data: {key, title, body}})
      return await this.read(key);
    }
  }

  async read(key) {
    await connectDB();
    const note = await prisma.notes.findUnique({where: {key}})
    if (!note) {
      return undefined;
    } else {
      return new Note(note.key, note.title, note.body);
    }
  }

  async destroy(key) {
    await connectDB();
    await prisma.notes.delete({where: {key}})
  }

  async keylist() {
    await connectDB();
    const notes = await prisma.notes.findMany();
    const notekeys = notes.map(note => note.key);
    return notekeys;
  }

  async count() {
    await connectDB();
    return await prisma.notes.count();
  }
}