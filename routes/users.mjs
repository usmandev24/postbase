
import { Router } from "express";
import { default as passport } from "passport";
import { default as passportLocal } from "passport-local";
import { default as passportJwt } from "passport-jwt";
import { default as passportGoogle } from "passport-google-oauth20";
import { TextEncoder } from "node:util";
import debug from "debug";

import * as usersModel from "../models/user-superagent.mjs";
import { PrismaNotesUsersStore } from "../models/users-prisma.mjs";
import { sessionCookieName } from "../app.mjs";


export const router = Router();
const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy;
const googleStrategy = passportGoogle.Strategy;
const notesUsersStore = new PrismaNotesUsersStore()
export function initPassport(app) {
  app.use(passport.initialize());
  app.use(passport.session());
}

export function ensureAuthenticated(req, res, next) {
  if (req.user) next();
  else res.redirect("/users/login");
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
  }),
  (req, res, next) => {
    req.session.save((err) => {
      if (err) console.error(err);
    });
    res.redirect("/");
  }
);

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect:
      "/?level=success&massage=" + encodeURIComponent("Login Success"),
    failureRedirect:
      "/users/login?level=error&massage=" +
      encodeURIComponent("Wrong password or username"),
  })
);

router.get("/logout", async (req, res, next) => {
    req.logOut((err) => {
      console.error(err);
      req.session.destroy();
      res.clearCookie(sessionCookieName);
      res.redirect(
        "/?level=warning&massage=" + encodeURIComponent("Logout Complete")
      );
    });
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
    const isUser = await usersModel.find(req.body.username);
    if (isUser) {
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
    photo,
    "svg"
  );
  if (user) {
    res.redirect(
      "/users/login?level=success&massage=" +
      encodeURIComponent("User account created. Now you can Login.")
    );
  }
});

router.get("/about-user", async (req, res, next) => {
  res.render("about-user", {
    title: "About " + req.user.displayName,
    user: req.user,
  });
});
router.get("/destroy", async (req, res, next) => {
  try {
    await notesUsersStore.destroy(req.user.id)
    const apiRes = await usersModel.destroy(req.user.username);
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
        const photo =  await getPhoto(jsonProfile.picture)
        const user = await usersModel.findOrCreate({
          username: await genUserName(jsonProfile.given_name, 10, jsonProfile.email),
          password: "",
          provider: "google",
          pid: jsonProfile.sub,
          lastName: jsonProfile.family_name,
          firstName: jsonProfile.given_name,
          fullName: jsonProfile.name,
          displayName: jsonProfile.name,
          photoURL: jsonProfile.picture,
          photo: photo,
          photoType: 'png',
          email: jsonProfile.email,

        });
        done(
          null,
          user
        );
        const noteUser = await notesUsersStore.read(user.id);
        if (!noteUser)
          await notesUsersStore.create(user.id, user.username, user.displayName, user.fullName, user.provider, photo, user.photoType);
        else {
          await notesUsersStore.update(user.id, user.username, user.displayName, user.fullName, user.provider, photo, user.photoType)
        }
      } catch (err) {
        done(err);
      }
    }
  )
);

router.get('/photo/:username', async (req, res, next) => {
  if (req.headers["if-none-match"]) {
    res.status(304).end()
    return
  }
  console.log("Reading Database")
  const user = await notesUsersStore.readByUserName(req.params.username)
  res.type(user.photoType)
  let photo = user.photo
  photo = Object.values(photo);
  photo = new Uint8Array(photo)
  res.send(photo)
})

async function getPhoto(url) {
  const res = await fetch(url)
  const data = await res.blob()
  const blob = await data.bytes()

  return Buffer.from(blob).toString('base64');
}
async function genUserName(username, rounds, email) {
  if (email) {
    try {
      const user = await usersModel.findViaEmail(email)
      if (user) return username;
    } catch (error) {

    }
  }
  try {
    username = username.toLowerCase()
    const user = await usersModel.find(username);
    if (user) {
      rounds = rounds * 10;
      username = username + (Number(Math.random().toFixed(2)) * rounds).toFixed(0);
      return await genUserName(username, rounds);
    }
  } catch (error) {
    if (error.status === 404) {
      return username;
    } else {
      throw new Error(error);
    }
  }
}

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: (req) => {
        return req.cookies[sessionCookieName];
      },
      passReqToCallback: true,
      secretOrKey: "secret",
    },
    async (req, payload, done) => {
      try {
        const user = await usersModel.find(payload.username);
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
    },
    async (username, password, done) => {
      try {
        let check = await usersModel.passwordCheck(username, password);
        if (check.check) {
          const user = await usersModel.find(username);
          const noteUser = await notesUsersStore.read(user.id);
          if (!noteUser) {
            const photo = Buffer.from(new Uint8Array(Object.values(user.photo))).toString('base64') ;
            await notesUsersStore.create(user.id, user.username, user.displayName, user.fullName, user.provider, photo, 'svg' );
          }
          
          done(null, { username: check.username, id: check.username });
        } else {
          done(null, false, { message: check.message });
        }
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  try {
    if (user) {
      done(null, user.username);
    }
  } catch (error) {
    done(error);
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await usersModel.find(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

function createLogo(firstName , lastName) {
  if (!lastName) lastName = ''
  let text = firstName.charAt(0) + lastName.charAt(0)
  const encoder =new TextEncoder()
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
const buffer = Buffer.from(svg).toString('base64')
  return buffer
}