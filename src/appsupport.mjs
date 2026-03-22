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
    console.log(`Listening on http://localhost:${bind}`);
}


export function handle404(req, res, next) {
    res.status(404)
    res.end(`
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page Not Found</title>
    <style>
        body {
            margin: 0;
            font-family: Arial, sans-serif;
            
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 500px;
        }
        h1 {
            font-size: 6rem;
            margin: 0;
            
        }
        h2 {
            margin: 10px 0;
            font-weight: normal;
        }
        p {
      
        }
        a {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            
            border-radius: 5px;
            font-weight: bold;
        }
        a:hover {
           
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for does not exist or has been moved.</p>
        <a href="/">Go Back Home</a>
    </div>
</body>
</html>`)
    
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
