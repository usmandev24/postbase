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
import { PrismaNotesUsersStore } from "../models/users-prisma.mjs";
import { sessionCookieName } from "../app.mjs";
import { genRefTokenHash, addSession } from "../models/prisma-session.mjs";

const log = debug("notes:routes_users")
const logError = debug("notes:routes_users_error")
const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const googleStrategy = passportGoogle.Strategy;
const notesUsersStore = new PrismaNotesUsersStore()

export const userRoutsEvents = new EventEmitter()
export const router = Router();
export const assetRouter = Router();
export function initPassport(app) {
  app.use(passport.initialize());
}

export function ensureAuthenticated(req, res, next) {
  if (req.user) next();
  else res.redirect("/users/login");
  return;
}

router.get("/login", (req, res, next) => {
  res.render("login", {
    title: "Login to Notes",
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
    await addSession( hashId, req.user.id);

    res.cookie("sess_re_Tok", refTokenId, {
      httpOnly: true,
      sameSite: "lax", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30
    })

    res.cookie(sessionCookieName, token, {
      httpOnly: true, sameSite: "lax",
      maxAge: 1000 * 60 * 15,
      secure: true,
    })
    res.redirect("/")
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
    await addSession( hashId, req.user.id);

    res.cookie("sess_re_Tok", refTokenId, {
      httpOnly: true,
      sameSite: "lax", secure: true, maxAge: 1000 * 60 * 60 * 24 * 30
    })

    res.cookie(sessionCookieName, token, {
      httpOnly: true, sameSite: "lax",
      maxAge: 1000 * 60 * 15, secure: true
    })

    res.redirect("/")
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

  const photo = createLogo(req.body.firstName, req.body.lastName)
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
    photo.toString('base64'),
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
    const user = await usersModel.findUserName(req.user.username);
    res.render("about-user", {
      title: "About " + req.user.displayName,
      user: user,
    });
  } else {
    const user = await notesUsersStore.getPublicData(req.params.username)
    res.render("profile", {
      title: "About " + req.params.username,
      user: req.user,
      publicUser: user,
      notelist: user.notes
    })
  }

});
router.get('/request-data', ensureAuthenticated, async (req, res, next) => {
  const user = await notesUsersStore.getAllData(req.user.username)
  res.type('applicaltion/json')
  res.send(user)

})
router.get("/destroy", ensureAuthenticated, async (req, res, next) => {
  try {
    await notesUsersStore.destroy(req.user.id)
    const apiRes = await usersModel.destroy(req.user.username);
    userRoutsEvents.emit("userdestroyed")
    req.logOut((err) => {
      if (err) console.error(err);
      req.session.destroy();
      res.clearCookie(sessionCookieName);
      res.redirect(
        "/?level=warning&massage=" +
        encodeURIComponent("! User Account Deleted")
      );
    });
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
        log("Generated Name "+ genratedName)
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
          photo: Buffer.from(photo).toString('base64'),
          photoType: 'png',
          email: jsonProfile.email,

        });
        const noteUser = await notesUsersStore.read(user.id);
        if (!noteUser)
          await notesUsersStore.create(user.id, user.username, user.displayName, user.firstName, user.email, user.provider, photo, user.photoType);
        else {
          await notesUsersStore.update(user.id, user.username, user.displayName, user.firstName, user.email, user.provider, photo, user.photoType)
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
          }
        );
      } catch (err) {
        done(err);
      }
    }
  )
);

router.post('/update/photo/:username', ensureAuthenticated, async (req, res, next) => {

  try {
    const noteUser = await notesUsersStore.read(req.user.id);
    if (noteUser.username === req.params.username) {
      const type = req.headers.phototype;
      await usersModel.updatePhoto(req.user.id, Buffer.from(req.body).toString("base64"), type)
      await notesUsersStore.updatePhoto(req.user.id, req.body, type);
    }
    res.clearCookie("cacheControl")
    res.status(200)
    res.end("success")
  } catch (error) {
    next(error)
  }

})

assetRouter.get('/photo/:username', async (req, res, next) => {
  if (!req.cookies.cacheRefresh && req.headers["if-none-match"]) {
    res.status(304).end()
    return
  }

  log("Reading Database, Getting Photo of " + req.params.username)
  const user = await notesUsersStore.getPhotoByUserName(req.params.username)
  res.type(user.photoType)
  res.send(user.photo)
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
      throw new error(error)
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
          const noteUser = await notesUsersStore.read(user.id);
          if (!noteUser) {
            const photo = Buffer.from(new Uint8Array(Object.values(user.photo)))
            await notesUsersStore.create(user.id, user.username, user.displayName, user.firstName, user.email, user.provider, photo, user.photoType);
          }
          done(null, {
            id: user.id,
            username: user.username,
            provider: user.provider,
            displayName: user.displayName,
            firstName: user.firstName,
            email: user.email,
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

function createLogo(firstName, lastName) {
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
  const buffer = Buffer.from(svg)
  return buffer
}