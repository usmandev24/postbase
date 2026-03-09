import { prisma } from "./prisma.js";
import { randomInt } from "node:crypto"

export class PrismaPictureStore {
  async add(blob, baseURL, type) {
    const id = randomInt(100000, 99999999) + `.${type}`;
    const pic = await prisma.picture.create({
      data: {
        id: id,
        blob,
        url: baseURL + id
      }
    })
    if (!pic) return null
    return pic
  }

  async remove(url) {
    try {
      await prisma.picture.delete({
        where: { url }
      })
    } catch (error) {
      console.error(error)
    }
  }

  async get(id) {
    const pic = await prisma.picture.findUnique({
      where: { id }
    })
    console.log("Read DB" + pic.url)
    return pic
  }
}