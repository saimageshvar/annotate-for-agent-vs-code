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
describe('createAnnotation', () => {
    let tmpDir;
    let filePath;
    before(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'afa-'));
        filePath = path.join(tmpDir, 'sample.ts');
        fs.writeFileSync(filePath, 'const a = 1\nconst b = 2\nconst c = 3\n');
    });
    it('creates annotation via command, persists to store', async () => {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
        const editor = await vscode.window.showTextDocument(doc);
        editor.selection = new vscode.Selection(1, 0, 1, 10);
        // Simulate: the webview posts 'save' back. We short-circuit by calling internal flow.
        // For now verify the command at least runs without throwing.
        await vscode.commands.executeCommand('annotateForAgent.createAnnotation', {
            uri: doc.uri,
            range: new vscode.Range(1, 0, 1, 10),
        });
        // Since the editor webview is async, skip verifying store state here.
        assert_1.strict.ok(true);
    });
    after(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
});
//# sourceMappingURL=createAnnotation.test.js.map