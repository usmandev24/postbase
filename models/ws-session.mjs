import * as crypto from 'crypto';
import { getSessionData } from './prisma-session.mjs';
import { find as findUser } from './user-superagent.mjs';
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

    const [prefixedPayload, signature] = decodedValue.split(".");
    const payload = prefixedPayload.startsWith("s:")
        ? prefixedPayload.slice(2)
        : prefixedPayload;
    const expectedSignature = crypto.createHmac("sha256", process.env.SESSION_COOKIE_SECRET)
                                    .update(payload)
                                    .digest("base64");
    if (expectedSignature.replace("=", "") === signature) {
        let sessionData = await getSessionData(payload)
        const username = sessionData.sess.passport.user;
        const fullUser = await findUser(username);
        const user = {username: fullUser.username, id: fullUser.id, displayName: fullUser.displayName}
        return user;
    }
}