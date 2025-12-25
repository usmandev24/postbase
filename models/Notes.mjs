import EventEmitter from "events";
     

export class AbstractNotesStore extends EventEmitter {
    async update(key, title, body, autherId) { }
    async create(key, title, body, autherId) { }
    async read(key) { }
    async destroy(key) { }
    async keylist() { }
    async count() { }
    emitCreated(note) { this.emit('notecreated', note); }
    emitUpdated(note) { this.emit('noteupdated', note); }
    emitDestroyed(key) { this.emit('notedestroyed', key);} 
}