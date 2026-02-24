import { prisma } from "./prisma.mjs";
import * as crypto from "node:crypto"
import jwt from "jsonwebtoken";
import { sessionCookieName } from "../app.mjs";
import debug from "debug";

const log = debug("notes:prisma-session")

export async function addSession(hash, userId) {
  await prisma.$connect();
  const sess = await prisma.session.create({
    data: {
      id: hash,
      userId,
      expire: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });
  log("Session Add")
  return sess;
}

export async function getSession(id) {
  const hashId = crypto.createHash("sha256").update(id).digest("hex");
  await prisma.$connect();
  const sess = await prisma.session.findUnique({
    where: { id: hashId },
    include: { user: { omit: { photo: true, photoType: true, photo_updatedAt: true } } }
  })
  log("Session Read")
  return sess
}

export async function getNewToken(refreshToken) {
  const sess = await getSession(refreshToken);
  if (sess) {
    const user = sess.user;
    const newToken = jwt.sign(user, process.env.SESSION_JWT_SECRET, {
      algorithm: "HS256",
      subject: user.id,
      expiresIn: "15m"
    })
    return [newToken, user]
  }
  return [null, null]
}
export async function restoreSession(req, res, next) {
  if (req.cookies["sess_re_Tok"]) {
    const [newToken, user] = await getNewToken(req.cookies["sess_re_Tok"]);
    if (!newToken) next();
    req.user = user;
    res.cookie(sessionCookieName, newToken, {
      secure: true, sameSite: "lax", httpOnly: true, path: "/",
      maxAge: 1000 * 60 * 15
    })
  }
  next()
}
export function genRefTokenHash() {
  const token = crypto.randomBytes(25).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return [token, hash]
}
