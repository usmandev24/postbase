import { Router } from "express";
import { default as passport } from "passport";
import { default as passportLocal } from "passport-local";
import { default as passportJwt } from "passport-jwt";
import { default as passportGoogle } from "passport-google-oauth20";
import { EventEmitter } from "node:events";
import { TextEncoder } from "node:util";
import debug from "debug";
import jwt from 'jsonwebtoken';
import * as usersModel from "../models/user-superagent.mjs";
import { PrismaPostsUsersStore } from "../models/users-prisma.mjs";
import { sessionCookieName } from "../app.mjs";
import { genRefTokenHash, addSession } from "../models/prisma-session.mjs";
import { PrismaPictureStore } from "../models/picture-prisma.mjs";


const log = debug("posts:routes_users")
const logError = debug("posts:routes_users_error")
const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const googleStrategy = passportGoogle.Strategy;
export const postsUsersStore = new PrismaPostsUsersStore()
export const picStore = new PrismaPictureStore()

export const userRoutsEvents = new EventEmitter()
export const router = Router();
export const assetRouter = Router();
export function initPassport(app) {
  app.use(passport.initialize());
}

export function ensureAuthenticated(req, res, next) {
  if (req.user) return next();
  else res.redirect("/users/login");
  return;
}

router.get("/login", (req, res, next) => {
  res.render("login", {
    title: "Login to posts",
    user: req.user,
    level: req.query.level,
    massage: req.query.massage,
  });
});

router.get(
  "/oauth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
router.get(
  "/oauth/google/redirect",
  passport.authenticate("google", {
    failureRedirect:
      "/users/login?level=error&massage=" +
      encodeURIComponent("Wrong password or username"),
    session: false,
  }),
  async (req, res, next) => {
    const token = jwt.sign(req.user, process.env.SESSION_JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "15m",
      subject: req.user.id,
    });
    const [refTokenId, hashId] = genRefTokenHash();
    await addSession(hashId, req.user.id);

    res.cookie("sess_re_Tok", refTokenId, {
      httpOnly: true,
      sameSite: "lax", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30
    })

    res.cookie(sessionCookieName, token, {
      httpOnly: true, sameSite: "lax",
      maxAge: 1000 * 60 * 15,
      secure: true,
    })
    res.redirect("/users/profile/" + req.user.username)
  }
);

router.post(
  "/login",
  passport.authenticate("local", {
    session: false,
    failureRedirect: "/users/login?level=error&massage=" +
      encodeURIComponent("Wrong password or username"),
  }),
  async (req, res, next) => {
    const token = jwt.sign(req.user, process.env.SESSION_JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "15m",
      subject: req.user.id,
    });
    const [refTokenId, hashId] = genRefTokenHash();
    await addSession(hashId, req.user.id);

    res.cookie("sess_re_Tok", refTokenId, {
      httpOnly: true,
      sameSite: "lax", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30
    })

    res.cookie(sessionCookieName, token, {
      httpOnly: true, sameSite: "lax",
      maxAge: 1000 * 60 * 15, secure: true
    })

    res.redirect(`/users/profile/${req.user.username}`)
  }
);

router.get("/logout", async (req, res, next) => {

  res.clearCookie(sessionCookieName);
  res.clearCookie("sess_re_Tok")
  res.redirect(
    "/?level=warning&massage=" + encodeURIComponent("Logout Complete")
  );
});
router.get("/create", async (req, res, next) => {
  res.render("create-user", {
    title: "Create New Account",
    user: req.user,
    level: req.query.level,
    massage: req.query.massage,
  });
});
router.post("/create", async (req, res, next) => {
  try {
    const isUser = await usersModel.findUserName(req.body.username);
    if (isUser.username) {
      res.redirect(
        "/users/create?level=warning&massage=" +
        encodeURIComponent("!User Already Exit with this username")
      );
      return;
    }
  } catch (error) { }

  const user = await usersModel.create(
    req.body.username,
    req.body.password,
    "Local",
    null,
    req.body.fullName,
    req.body.fullName,
    req.body.firstName,
    req.body.lastName,
    req.body.email,
    null,
    "svg"
  );
  if (user) {
    res.redirect(
      "/users/login?level=success&massage=" +
      encodeURIComponent("User account created. Now you can Login.")
    );
  }
});


router.get('/profile/:username', async (req, res, next) => {
  if (req.user && req.params.username === req.user.username) {
    const user = await postsUsersStore.readByUserName(req.user.username);
    const postlist = await postsUsersStore.getUserPosts(req.params.username, false)
    const likedPostList = await postsUsersStore.getLikedPosts(req.params.username, false)
    res.render("about-user", {
      title: "About " + req.user.displayName,
      user: user,
      postlist: postlist,
      likedPostList: likedPostList,
      likedPostLength: likedPostList.length,
      postLength: postlist.length,
    });
  } else {
    const user = await postsUsersStore.getPublicData(req.params.username);
    if (!user) {
      res.redirect("/")
      return;
    }
    res.render("profile", {
      title: "About " + req.params.username,
      user: req.user,
      publicUser: user,
      postlist: user.posts
    })
  }

});
router.get("/likes/keys/", ensureAuthenticated, async (req, res, next) => {
  const likeKeys = await postsUsersStore.getLikedPosts(req.user.username, true)
  res.type('application/json')
  res.send(likeKeys)
})
router.post("/profile/update/feed", ensureAuthenticated, async (req, res, next) => {
  await postsUsersStore.updateFeed(req.user.id, JSON.stringify(Object.keys(req.body)));
  res.redirect("/your-feed")

})
router.post("/profile/update/about", ensureAuthenticated, async (req, res, next) => {
  const user = await postsUsersStore.updateAbout(req.user.id, req.body.about);
  res.end(user.about);
})
router.post("/profile/update/personal", ensureAuthenticated, async (req, res, next) => {
  const body = req.body;
  const user = await postsUsersStore.updatePersonal(req.user.id, body.displayName, body.firstName, body.lastName, body.about);
  res.end(JSON.stringify({
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    about: user.about
  }));
})
router.get('/request-data', ensureAuthenticated, async (req, res, next) => {
  const user = await postsUsersStore.getAllData(req.user.username)
  res.render("user-data", { user, title: user.username, layout: false }, (err, html) => {
    if (err) {
      console.error(err)
    }
    res.type("text/html");
    const headers = new Map(Object.entries({ "content-disposition": "attachment", "filename": `${user.username}_data.html` }))
    res.setHeaders(headers)
    res.end(html)
    return
  })
  new Map()

})
router.get("/destroy", ensureAuthenticated, async (req, res, next) => {
  try {
    await postsUsersStore.destroy(req.user.id)
    const apiRes = await usersModel.destroy(req.user.username);
    userRoutsEvents.emit("userdestroyed")
    res.clearCookie(sessionCookieName);
    res.clearCookie("sess_re_Tok")
    res.redirect(
      "/?level=warning&massage=" +
      encodeURIComponent("! User Account Deleted")
    );
  } catch (error) {
    next(error);
  }
});
passport.use(
  new googleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_AUTH_CALLBACKURL,

    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const jsonProfile = profile._json;
        const photo = await getPhoto(jsonProfile.picture)
        const genratedName = await genUserName(jsonProfile.given_name, 10, jsonProfile.email);
        log("Generated Name " + genratedName)
        const user = await usersModel.findOrCreate({
          username: genratedName,
          password: "",
          provider: "google",
          pid: jsonProfile.sub,
          lastName: jsonProfile.family_name,
          firstName: jsonProfile.given_name,
          fullName: jsonProfile.name,
          displayName: jsonProfile.name,
          photoURL: jsonProfile.picture,
          photoType: 'jpeg',
          email: jsonProfile.email,
        });

        let postUser = await postsUsersStore.read(user.id);
        if (!postUser) {
          const pic = await picStore.add(photo, "/assets/users/pictures/", user.photoType)
          postUser = await postsUsersStore.create(user.id, user.username, user.displayName, user.firstName, user.lastName, user.email, user.provider, user.photoType, pic.url);
        }
        else {

        }
        done(
          null,
          {
            id: user.id,
            username: user.username,
            provider: user.provider,
            displayName: user.displayName,
            firstName: user.firstName,
            email: user.email,
            photoURL: postUser.photoURL
          }
        );
      } catch (err) {
        done(err);
      }
    }
  )
);

router.post('/update/photo/:username', ensureAuthenticated, async (req, res, next) => {
  const type = req.headers.phototype;
  const pic = await picStore.add(req.body, "/assets/users/pictures/", type);
  
  await usersModel.updatePhoto(req.user.id, pic.url, type)
  await postsUsersStore.updatePhoto(req.user.id, pic.url, type);
  await picStore.remove(req.user.photoURL)
  res.clearCookie(sessionCookieName)
  res.end("success")
})

assetRouter.get('/users/pictures/:id', async (req, res, next) => {
  const pic = await picStore.get(req.params.id)
  res.type(req.params.id.substring(req.params.id.lastIndexOf(".") + 1))
  res.setHeader("cache-control", "public, max-age=31536000")
  res.send(pic.blob)
})
assetRouter.get('/posts/pictures/:id', async (req, res, next) => {
  const pic = await picStore.get(req.params.id)
  res.type(req.params.id.substring(req.params.id.lastIndexOf(".") + 1))
  res.setHeader("cache-control", "public, max-age=31536000")
  res.send(pic.blob)
})

async function getPhoto(url) {
  const res = await fetch(url);
  const bytes = await res.bytes()
  return bytes
}
async function genUserName(username, rounds, email) {
  if (email) {
    try {
      const user = await usersModel.findEmail(email)
      if (user.email) return user.username;
    } catch (error) {
      console.error(error)
    }
  }
  try {
    username = username.toLowerCase()
    const user = await usersModel.findUserName(username);
    if (user.username) {
      rounds = rounds * 10;
      username = username + (Number(Math.random().toFixed(2)) * rounds).toFixed(0);
      return await genUserName(username, rounds);
    } else if (!user.username) {
      return username
    }
  } catch (error) {
    throw new Error(error);
  }
}

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: (req) => {
        return req.cookies[sessionCookieName];
      },
      passReqToCallback: true,
      secretOrKey: process.env.SESSION_JWT_SECRET,
    },
    async (req, payload, done) => {
      try {
        const user = payload
        if (user) {
          done(null, user);
        } else {
          done(null, false);
        }
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
      session: false,
      passReqToCallback: true
    },
    async (req, username, password, done) => {
      try {
        let check = await usersModel.passwordCheck(username, password);
        if (check.check) {
          const user = await usersModel.find(check.id);
          let postUser = await postsUsersStore.read(user.id);
          if (!postUser) {
            const photo = createLogo(user.firstName, user.lastName)
            const pic = await picStore.add(photo, "/assets/users/pictures/", "svg")
            postUser = await postsUsersStore.create(user.id, user.username, user.displayName, user.firstName, user.lastName, user.email, user.provider, user.photoType, pic.url);
          }
          done(null, {
            id: user.id,
            username: user.username,
            provider: user.provider,
            displayName: user.displayName,
            firstName: user.firstName,
            email: user.email,
            photoURL: postUser.photoURL
          });
        } else {
          done(null, false, { message: check.message });
        }
      } catch (error) {
        done(error);
      }
    }
  )
);

function createLogo(firstName = '', lastName) {
  if (!lastName) lastName = ''
  let text = firstName.charAt(0) + lastName.charAt(0)
  const encoder = new TextEncoder()
  const svg = encoder.encode(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <text
    x="50%"
    y="50%"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="monospace"
    font-size="16"
    fill="#00ff00"
  >
    ${text}
  </text>
</svg>
`);
  const buffer = new Uint8Array(Buffer.from(svg))
  return buffer
}