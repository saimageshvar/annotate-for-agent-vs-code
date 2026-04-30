"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnotationStore = void 0;
const uuid_1 = require("uuid");
const KEY = 'annotateForAgent.annotations';
class AnnotationStore {
    memento;
    annotations = new Map();
    listeners = new Set();
    persistTimer;
    constructor(memento) {
        this.memento = memento;
    }
    async init() {
        const saved = this.memento.get(KEY) ?? [];
        for (const a of saved)
            this.annotations.set(a.id, a);
    }
    list() {
        return Array.from(this.annotations.values());
    }
    get(id) {
        return this.annotations.get(id);
    }
    async create(partial) {
        const now = Date.now();
        const a = { ...partial, id: (0, uuid_1.v4)(), createdAt: now, updatedAt: now };
        this.annotations.set(a.id, a);
        this.schedulePersist();
        this.emit();
        return a;
    }
    async update(id, patch) {
        const existing = this.annotations.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...patch, id, updatedAt: Date.now() };
        this.annotations.set(id, updated);
        this.schedulePersist();
        this.emit();
        return updated;
    }
    async remove(id) {
        if (this.annotations.delete(id)) {
            this.schedulePersist();
            this.emit();
        }
    }
    onDidChange(listener) {
        this.listeners.add(listener);
        return { dispose: () => this.listeners.delete(listener) };
    }
    async flush() {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = undefined;
        }
        await this.memento.update(KEY, this.list());
    }
    schedulePersist() {
        if (this.persistTimer)
            clearTimeout(this.persistTimer);
        this.persistTimer = setTimeout(() => {
            void this.memento.update(KEY, this.list());
            this.persistTimer = undefined;
        }, 500);
    }
    emit() {
        const snapshot = this.list();
        for (const l of this.listeners)
            l(snapshot);
    }
}
exports.AnnotationStore = AnnotationStore;
//# sourceMappingURL=AnnotationStore.js.map