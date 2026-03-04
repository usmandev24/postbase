import jwt from 'jsonwebtoken';
import { sessionCookieName } from '../app.mjs';
export async function wsSession(rawCookies) {
    const sessionEntry = rawCookies
        .split(";")
        .map(c => c.trim())
        .find(c => c.startsWith(`${sessionCookieName}=`));

    if (!sessionEntry) {
        return;
    }
    const encodedValue = sessionEntry.split("=")[1];
    const decodedValue = decodeURIComponent(encodedValue);
    const jwtToken = decodedValue
    const jwtPayload = jwt.verify(jwtToken, process.env.SESSION_JWT_SECRET, { maxAge: "15m" })
    return jwtPayload
}