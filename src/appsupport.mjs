import { port } from './app.mjs';
import { default as DBG } from "debug";

const debug =  DBG('posts:debug');
const dbgerror = DBG('posts:error');

/**
 * Normalize a port into a number, string, or false.
 */
export function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
export function onError(error) {
    dbgerror(error);
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        case 'EpostSSTORE':
            console.error(`posts date store initialization failure because
                ${error.error}`)
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
import { server } from './app.mjs';
export function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : addr.port;
    debug(`Listening on http://localhost:${bind}`);
}


export function handle404(req, res, next) {
    res.status(404)
    res.render("404", {
        user: req.user,
        title: "404"
    })
    
}

export function basicErrorHandler(err, req, res, next) {
    // Defer to built-in error handler if headersSent
    // See: http://expressjs.com/en/guide/error-handling.html
    if (res.headersSent) {
        return next(err)
    }
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
}

process.on('uncaughtException', function (error) {
    console.error(`I have crached!!! - ${(error.stack || error)}`)
})
import * as util from 'util'
import { title } from 'process';
process.on('unhandledRejection', (reason, p) => {
    console.error(`Unhandeled rejection at: ${util.inspect(p)} reason: ${reason}`)
});
