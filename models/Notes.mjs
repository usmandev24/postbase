

export class Note { 
    #_note_key;
    #_note_title;
    #_note_body;
    constructor(key, title, body) { 
        this.#_note_key = key; 
        this.#_note_title = title; 
        this.#_note_body = body; 
    } 

    get key() { return this.#_note_key; }
    get title() { return this.#_note_title; }
    set title(newTitle) { this.#_note_title = newTitle; }
    get body() { return this.#_note_body; }
    set body(newBody) { this.#_note_body = newBody; }
}

export class AbstractNotesStore {
    async update(key, title, body) { }
    async create(key, title, body) { }
    async read(key) { }
    async destroy(key) { }
    async keylist() { }
    async count() { }
}