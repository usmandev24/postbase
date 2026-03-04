import { EventEmitter } from "node:events"
import { prisma} from "./prisma.js"

export class PrimsaLikesStore {
  static events = new EventEmitter();
  async create(postkey, userId) {
    const like = await prisma.like.create({
      data: {
        postkey, userId,
      }
    })
    if (!like) return null;
    PrimsaLikesStore.events.emit("likecreated", postkey, userId)
    return like
  }
  get events() { return PrimsaLikesStore.events}
  async destroy(postkey, userId) {
    await prisma.like.delete({
      where: {postkey_userId: {postkey, userId}}
    })
    PrimsaLikesStore.events.emit("likedestroyed", postkey, userId)
  }
  async getUserLikes(userId) {
    const likes = await prisma.like.findMany({where: {userId}})
    if (!likes) return null
    return likes
  }
}