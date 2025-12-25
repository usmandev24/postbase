import { AbstractNotesStore } from "./Notes.mjs";
import { default as DBG } from "debug";
import { prisma } from "./prisma.mjs";

const debug = DBG("notes:notes-prisma");
const dbgError = DBG("notes:error-prisma");

export async function connectDB() {
  await prisma.$connect();
}
export default class PrismaNotesStore extends AbstractNotesStore {
  async close() {
    await prisma.$disconnect();
  }
  async create(key, title, body, autherId) {
    await connectDB();
    const isNote = await this.read(key);
    if (isNote) {
      return isNote;
    }
    const note = await prisma.notes.create({
      data: {
        key: key,
        title: title,
        body: body,
        autherId: autherId,
      },
      include: { auther: true },
    });

    this.emitCreated(note);
    return note;
  }

  async update(key, title, body, autherId) {
    await connectDB();
    const note = await prisma.notes.findUnique({ where: { key } });
    if (!note) {
      throw new Error("No note found for " + key);
    } else {
      await prisma.notes.update({
        where: { key },
        data: { key, title, body, autherId },
      });
      const note = await this.read(key);
      this.emitUpdated(note);
      return note;
    }
  }

  async read(key) {
    await connectDB();
    let note = await prisma.notes.findUnique({
      where: { key },
      include: {
        auther: { omit: { photo: true } },
        comments: { include: { auther: { omit: { photo: true } } } }
      },
    });
    try {
      if (note.comments)
        note.commentsLength = note.comments.length;
    } catch {

    }

    if (!note) {
      return undefined;
    } else {
      return note;
    }
  }

  async destroy(key) {
    await connectDB();
    const deleteComments = prisma.comments.deleteMany({
      where: { noteNotekey: key },
    });
    const deleteNote = prisma.notes.delete({ where: { key: key } });
    await prisma.$transaction([deleteComments, deleteNote]);
    this.emitDestroyed(key);
  }

  async keylist() {
    await connectDB();
    const notes = await prisma.notes.findMany({
      orderBy: { updatedAt: "desc" },
    });
    const keys = notes.map((note) => note.key);
    return keys;
  }
  async getAllbyautherId(autherId) {
    await connectDB();
    const notes = await prisma.notes.findMany({
      where: { autherId: autherId },
      orderBy: { updatedAt: "desc" },
    });
    return notes.map((note) => {
      return note;
    });
  }
  async count() {
    await connectDB();
    return await prisma.notes.count();
  }
}
