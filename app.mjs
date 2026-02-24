import '@dotenvx/dotenvx/config.js'
import { default as express } from 'express';
import { default as hbs } from 'hbs';
import * as path from 'path';
import serveFavicon from'serve-favicon';
import { default as logger } from 'morgan';
import { default as cookieParser } from 'cookie-parser';
import * as http from 'http';
import { approotdir } from './approotdir.mjs';
import { createStream } from 'rotating-file-stream';
const __dirname = approotdir;
import {
    normalizePort, onError, onListening, handle404, basicErrorHandler
} from './appsupport.mjs';

import passport from 'passport';
import { router as indexRouter, wsHomeListners } from './routes/index.mjs';
import { router as postsRouter, initSocket as initPostsSocket,  wsPostsListeners } from './routes/posts.mjs';
import { initPassport, router as usersRouter, assetRouter as userAssestRouter } from './routes/users.mjs'
import { default as DBG } from "debug";
import * as ws from 'ws';
import { wsSession } from './models/ws-session.mjs';
import { restoreSession } from './models/prisma-session.mjs';

const debug = DBG('posts:debug');
const dbgerror = DBG('posts:error')

export const sessionCookieName = "postsS!d"
export const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));

// uncomment after placing your favicon in /public
app.use(serveFavicon(path.join(__dirname, "public", "assets", "favicon", "favicon.ico")));
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev', {
    stream: process.env.REQUEST_LOG_FILE ? createStream(process.env.REQUEST_LOG_FILE, {
        size: '10M',
        interval: '1d',
        compress: 'gzip'
    }) : process.stdout
}))

app.use(express.json());
app.use(express.urlencoded());
app.use(express.raw({type: "application/octet-stream", limit: "3mb"}))
app.use(cookieParser(process.env.SESSION_COOKIE_SECRET));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets/vendor/feather-icons', express.static(path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));
app.use('/assets/vendor/trix-editor', express.static(path.join(__dirname, 'node_modules', 'trix', 'dist')))
app.use('/assets/users', userAssestRouter)

const mainRouter = express.Router()


mainRouter.use((req, res , next) => {
    const cookie = req.cookies;
    if (!cookie.cacheControl) {
        res.cookie("cacheControl", " ", {maxAge: 1000 * 60 * 30, httpOnly: true, path: '/', sameSite: 'lax'})
        res.cookie("cacheRefresh", " ", {maxAge: 1000 * 30 , httpOnly: true, path: '/', sameSite: 'lax' });
    }                
    next()
})


initPassport(mainRouter)

mainRouter.use(async (req, res, next) => {
    passport.authenticate('jwt', {session: false}, async (err, user, info) => {
        if (user){
            passport.authenticate('jwt', {session:false,})(req, res, next)
        }
        else {
            restoreSession(req, res, next)
        }
    })(req, res, next)
    
})

mainRouter.use('/', indexRouter);
mainRouter.use('/posts', postsRouter);
mainRouter.use('/users', usersRouter);
app.use(mainRouter)

// error handlers
// catch 404 and forward to error handler
app.use(handle404)

export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

export const server = http.createServer(app);
export const WsServer = new ws.WebSocketServer({ server })
server.listen(port);

WsServer.on("connection", async (socket, req) => {
    const rawCookies = req.headers.cookie;
    if (rawCookies)
        socket.user = await wsSession(rawCookies);
    socket.send(JSON.stringify({ type: 'connection', message: 'connected '+ JSON.stringify(socket.user) }))
    initPostsSocket(socket)
})
addWsListeners()

function addWsListeners() {
    wsHomeListners()
    wsPostsListeners()
}

server.on('error', onError);
server.on('listening', onListening);
server.on('request', (req, res) => {
    //debug(`${new Date().toISOString()} request ${req.method} ${req.url}`)
})
