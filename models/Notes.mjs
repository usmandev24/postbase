import EventEmitter from "events";

export class Note {
    #_note_key;
    #_note_title;
    #_note_body;
    #_note_author_name;
    constructor(key, title, body, autherName) {
        this.#_note_key = key;
        this.#_note_title = title;
        this.#_note_body = body;
        this.#_note_author_name = autherName
    }

    get key() { return this.#_note_key; }
    get title() { return this.#_note_title; }
    set title(newTitle) { this.#_note_title = newTitle; }
    get body() { return this.#_note_body; }
    get autherName() { return this.#_note_author_name}
    set body(newBody) { this.#_note_body = newBody; }
    get JSON() {
        return JSON.stringify({
            key: this.key, title: this.title, body: this.body, autherName: this.autherName
        });
    }

    static fromJSON(json) {
        const data = JSON.parse(json);
        if (typeof data !== 'object'
            || !data.hasOwnProperty('key')
            || typeof data.key !== 'string'
            || !data.hasOwnProperty('title')
            || typeof data.title !== 'string'
            || !data.hasOwnProperty('body')
            || typeof data.body !== 'string'
            || !data.hasOwnProperty('autherName')
            || typeof data.autherName !== 'string') {
            throw new Error(`Not a Note: ${json}`);
        }
        const note = new Note(data.key, data.title, data.body, data.autherName);
        return note;
    }
}
        

export class AbstractNotesStore extends EventEmitter {
    async update(key, title, body, autherName) { }
    async create(key, title, body, autherName) { }
    async read(key) { }
    async destroy(key) { }
    async keylist() { }
    async count() { }
    async getAllbyAutherName () { }
    emitCreated(note) { this.emit('notecreated', note); }
    emitUpdated(note) { this.emit('noteupdated', note); }
    emitDestroyed(key) { this.emit('notedestroyed', key);} 
}