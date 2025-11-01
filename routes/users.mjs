import path from "node:path";
import util from "node:util"
import { Router } from "express";
import { default as passport } from "passport";
import { default as passportLocal } from "passport-local";
import { default as passportJwt } from 'passport-jwt'
import { default as jwt } from 'jsonwebtoken';
import debug from "debug";
import * as usersModel from '../models/user-superagent.mjs';
import { sessionCookieName } from '../app.mjs';

export const router = Router();
const LocalStrategy = passportLocal.Strategy;
const JwtStrategy = passportJwt.Strategy

export function initPassport(app) {
  app.use(passport.initialize());
  //app.use(passport.session());
}

export function ensureAuthenticated(req, res, next) {
  if (req.user) next();
  else res.redirect('/users/login');
}

router.get('/login', (req, res, next) => {
  res.render('login', {
    title: "Login to Notes", user: req.user,
    level: req.query.level,
    massage: req.query.massage
  });
})
router.post('/login', async (req, res, next) => {
  try {
    let check = await usersModel.passwordCheck(req.body.username, req.body.password)
    if (check.check) {
      let token = jwt.sign({username: req.body.username}, 'secret', {expiresIn: 1000*60*16})
      res.cookie(sessionCookieName, token, {httpOnly: true, path: '/', sameSite: 'strict', maxAge: 1000*60*16})
      res.redirect('/')
    } else {
      res.redirect('/users/login?level=error&massage='+encodeURIComponent('Wrong password or username'))
    }
  } catch (error) {
    next(error)
  }
})

/*
router.post('/login', passport.authenticate('local', {
  successRedirect: '/?level=success&massage='+encodeURIComponent('Login Success'),
  failureRedirect: '/users/login?level=error&massage='+encodeURIComponent('Wrong password or username')
}))
*/


router.get('/logout', async (req, res, next) => {
  try {
    
      res.clearCookie(sessionCookieName);
      res.redirect('/?level=warning&massage=' + encodeURIComponent('Logout Complete'))
    
  } catch (error) {
    next(error)
  }
})
router.get('/create', async (req, res, next) => {
  res.render('create-user', {
    title: "Create New Account",
    user: req.user,
    level: req.query.level,
    massage: req.query.massage
  })
})
router.post('/create', async (req, res, next) => {
  try {
    const isUser = await usersModel.find(req.body.username)
    if (isUser) {
      res.redirect('/users/create?level=warning&massage=' + encodeURIComponent('!User Already Exit with this username'))
      return;
    }
  } catch (error) {

  }
  const user = await usersModel.create(req.body.username, req.body.password, "local", req.body.familyName, req.body.givenName, req.body.givenName, [req.body.email], []);
  if (user) {
    res.redirect('/users/login?level=success&massage=' + encodeURIComponent("User account created. Now you can Login."))
  }
})

passport.use(new JwtStrategy({
  jwtFromRequest: (req) => { return req.cookies[sessionCookieName] },
  passReqToCallback: true,
  secretOrKey: 'secret'
},async (req, payload, done) => {
  try {
    const user = await usersModel.find(payload.username)
    if (user) {
      done(null, user)
    } else {
      done(null, false)
    }
  } catch (error) {
    done(error)
  }
}))

/* 
passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async (username, password, done) => {
  try {
    let check = await usersModel.passwordCheck(username, password);
    if (check.check) {
      done(null, { username: check.username, id: check.username })
    } else {
      done(null, false, { message: check.message })
    }
  } catch (error) {
    done(error)
  }
}))

passport.serializeUser((user, done) => {
  try {
    if (user) {
      done(null, user.username)
    }
  } catch (error) {
    done(error)
  }
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await usersModel.find(id);
    done(null, user)
  } catch (error) {
    done(error)
  }
})
*/