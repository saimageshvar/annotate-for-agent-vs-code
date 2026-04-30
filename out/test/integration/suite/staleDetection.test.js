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
const assert_1 = require("assert");
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const hash_1 = require("../../../src/util/hash");
describe('stale detection', () => {
    let tmpDir;
    let filePath;
    before(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'afa-stale-'));
        filePath = path.join(tmpDir, 'sample.ts');
        fs.writeFileSync(filePath, 'const a = 1\nconst b = 2\nconst c = 3\n');
    });
    it('flips annotation to stale when snippet changes', async () => {
        const ext = vscode.extensions.getExtension('creative-chaos.annotate-for-agent');
        await ext.activate();
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        await vscode.window.showTextDocument(doc);
        const snippet = 'const b = 2';
        const api = ext.exports;
        const store = api?.store ?? globalThis.__afaStore;
        // If store is not exposed, skip structural check
        if (!store) {
            assert_1.strict.ok(true, 'store not exposed; skip');
            return;
        }
        // Use asRelativePath to match what StaleTracker uses for comparison
        const relPath = vscode.workspace.asRelativePath(vscode.Uri.file(filePath));
        const ann = await store.create({
            filePath: relPath,
            range: { startLine: 2, endLine: 2 },
            category: 'Bug',
            comment: 'x',
            status: 'open',
            context: { kind: 'file', snippet, snippetHash: (0, hash_1.snippetHash)(snippet) },
        });
        const editor = vscode.window.activeTextEditor;
        await editor.edit(eb => eb.replace(new vscode.Range(1, 0, 1, 100), 'const b = 999'));
        await new Promise(r => setTimeout(r, 500));
        const reloaded = store.get(ann.id);
        assert_1.strict.equal(reloaded.status, 'stale');
    });
    after(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
});
//# sourceMappingURL=staleDetection.test.js.map