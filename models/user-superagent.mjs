import { default as request } from "superagent";
import { default as bcrypt } from 'bcryptjs';
import * as util from "node:util";
import * as url from "node:url";
import debug from "debug";

const URL = url.URL;
const log = debug("notes:users-superagent");
const error = debug('notes:error-superagent');
const saltRound = 10;
async function genHash(password) {
  return await bcrypt.hash(password, saltRound)
}
var authid = process.env.USERS_AUTHID ;
var authcode =process.env.USERS_AUTHCODE ;

function reqURL(path) {
  const requrl = new URL(process.env.USER_SERVICE_URL);
  requrl.pathname = path
  return requrl.toString()
}

export async function create(username, password,
  provider, familyName, givenName, middleName,
  emails, photos) {
  password = await genHash(password)
  const res = await request.post(reqURL('/create-user'))
    .send({
      username, password,
      provider, familyName, givenName, middleName,
      emails, photos
    })
    .set("Content-type", "application/json")
    .set("Accept", "application/json")
    .auth(authid, authcode);
  return res.body
}

export async function update(username, password,
  provider, familyName, givenName, middleName,
  emails, photos) {
    password = await genHash(password)
  const res = await request.post(reqURL(`/update-user/${username}`))
    .send({
      username, password,
      provider, familyName, givenName, middleName,
      emails, photos
    })
    .set("Content-type", "application/json")
    .set("Accept", "application/json")
    .auth(authid, authcode);
  return res.body
}

export async function findOrCreate(profile) {
  var res = await request
    .post(reqURL('/find-or-create'))
    .send({
      username: profile.id, password: await genHash(profile.password),
      provider: profile.provider,
      familyName: profile.familyName,
      givenName: profile.givenName,
      middleName: profile.middleName,
      emails: profile.emails, photos: profile.photos
    }).set('Content-Type', 'application/json')
    .set('Acccept', 'application/json')
    .auth(authid, authcode);
  return res.body;
}
export async function passwordCheck(username, password) {
  const res = await request.post(reqURL(`/password-check`))
    .send({ username, password })
    .set("Content-type", "application/json")
    .set("Accept", "application/json")
    .auth(authid, authcode);
  return res.body;
}

export async function find(username) {
  const res = await request.get(reqURL(`/find/${username}`))
    .set("Content-type", "application/json")
    .set("Accept", "application/json")
    .auth(authid, authcode);
  return res.body;
}

export async function list() {
  const res = await request.get(reqURL(`/list`))
    .set("Content-type", "application/json")
    .set("Accept", "application/json")
    .auth(authid, authcode);
  return res.body;
}



