"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaleTracker = void 0;
const vscode = __importStar(require("vscode"));
const hash_1 = require("../util/hash");
class StaleTracker {
    store;
    timers = new Map();
    disposables = [];
    constructor(store) {
        this.store = store;
        this.disposables.push(vscode.workspace.onDidChangeTextDocument(e => this.schedule(e.document)));
    }
    schedule(doc) {
        const key = doc.uri.toString();
        const existing = this.timers.get(key);
        if (existing)
            clearTimeout(existing);
        this.timers.set(key, setTimeout(() => {
            this.timers.delete(key);
            void this.check(doc);
        }, 300));
    }
    async check(doc) {
        const relPath = vscode.workspace.asRelativePath(doc.uri);
        const matching = this.store.list().filter(a => (a.filePath === relPath || a.filePath === doc.uri.fsPath) && a.status !== 'resolved');
        for (const a of matching) {
            const startLine = a.range.startLine - 1;
            const endLine = Math.min(a.range.endLine - 1, doc.lineCount - 1);
            if (startLine < 0 || startLine > endLine) {
                if (a.status !== 'stale')
                    await this.store.update(a.id, { status: 'stale' });
                continue;
            }
            const snippet = doc.getText(new vscode.Range(startLine, 0, endLine, Number.MAX_SAFE_INTEGER));
            const h = (0, hash_1.snippetHash)(snippet);
            if (h !== a.context.snippetHash && a.status !== 'stale') {
                await this.store.update(a.id, { status: 'stale' });
            }
        }
    }
    dispose() {
        for (const t of this.timers.values())
            clearTimeout(t);
        for (const d of this.disposables)
            d.dispose();
    }
}
exports.StaleTracker = StaleTracker;
//# sourceMappingURL=StaleTracker.js.map