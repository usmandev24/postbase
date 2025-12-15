import '@dotenvx/dotenvx/config.js'
import { default as express } from 'express';
import { default as hbs } from 'hbs';
import * as path from 'path';
// import * as favicon from'serve-favicon';
import { default as logger } from 'morgan';
import { default as cookieParser } from 'cookie-parser';
import * as http from 'http';
import { approotdir } from './approotdir.mjs';
import { createStream } from 'rotating-file-stream';
const __dirname = approotdir;
import {
    normalizePort, onError, onListening, handle404, basicErrorHandler
} from './appsupport.mjs';
import { useModel as useNotesModel } from './models/notes-store.mjs';
import session from 'express-session';
import sessionFileStore from "session-file-store"
import connectPgSimple from 'connect-pg-simple';
import { default as pg } from 'pg';
import { router as indexRouter, init as indexInit, addNoteListners as wsHomeListener } from './routes/index.mjs';
import { router as notesRouter } from './routes/notes.mjs';
import { initPassport, router as usersRouter } from './routes/users.mjs'
import { default as DBG } from "debug";

const debug = DBG('notes:debug');
const dbgerror = DBG('notes:error')

const _noteStore = await useNotesModel(process.env.NOTES_MODEL ? process.env.NOTES_MODEL :
    "memory"
);

const pgPool = new pg.Pool({
    user: process.env.SETTION_STORE_USER,
    password: process.env.SETTION_STORE_PASSWORD,
    database: process.env.SETTION_STORE_DATABASE,
    host: process.env.SETTION_STORE_HOST
})


export const sessionCookieName = "notesS!d"
export const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(path.join(__dirname, 'partials'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(process.env.REQUEST_LOG_FORMAT || 'dev', {
    stream: process.env.REQUEST_LOG_FILE ? createStream(process.env.REQUEST_LOG_FILE, {
        size: '10M',
        interval: '1d',
        compress: 'gzip'
    }) : process.stdout
}))
app.use(express.json());
app.use(express.urlencoded({ "extended": false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets/vendor/feather-icons', express.static(path.join(__dirname, 'node_modules', 'feather-icons', 'dist')));

const mainRouter = express.Router()

const connectPG = connectPgSimple(session)

mainRouter.use(session({
    store: new connectPG({
        pool: pgPool,
        createTableIfMissing: true,
    }),
    name: sessionCookieName,
    secret: process.env.SESSION_COOKIE_SECRET,
    cookie: { httpOnly: true, path: "/", sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 30 },
    saveUninitialized: false,
    resave: false
}))

initPassport(mainRouter)
/*
For JWT ------------------------------------
mainRouter.use((req, res, next) => {
    passport.authenticate('jwt', {session: false}, (err, user, info) => {
        if (user){
            passport.authenticate('jwt', {session:false})(req, res, next)
        }
        else {
            next()
        }
    })(req, res, next)
    
})
    ------------------------------------------
*/
mainRouter.use('/', indexRouter);
mainRouter.use('/notes', notesRouter);
mainRouter.use('/users', usersRouter);
app.use(mainRouter)

// error handlers
// catch 404 and forward to error handler


export const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

export const server = http.createServer(app);
server.listen(port);
server.on('upgrade', (req, socket, head)=> {
    indexInit(req, socket, head)
    //noteUpdateInit()
    //noteDestroyInit()
})
addWsListeners()
function addWsListeners() {
    wsHomeListener()
}

server.on('error', onError);
server.on('listening', onListening);
server.on('request', (req, res) => {
    //debug(`${new Date().toISOString()} request ${req.method} ${req.url}`)
})
