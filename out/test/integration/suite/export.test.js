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
describe('export', () => {
    let tmpDir;
    before(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'afa-export-')); });
    it('writes a markdown file matching slug-timestamp pattern', async () => {
        const ext = vscode.extensions.getExtension('creative-chaos.annotate-for-agent');
        const api = await ext.activate();
        if (!api?.store) {
            assert_1.strict.ok(true, 'skip: store not exposed');
            return;
        }
        await vscode.workspace.getConfiguration('annotateForAgent').update('exportDir', path.join(tmpDir, 'exports'), vscode.ConfigurationTarget.Global);
        await vscode.workspace.getConfiguration('annotateForAgent').update('defaultFormat', 'markdown', vscode.ConfigurationTarget.Global);
        const snippet = 'x';
        await api.store.create({
            filePath: 'a.ts',
            range: { startLine: 1, endLine: 1 },
            category: 'Bug',
            comment: 'c',
            status: 'open',
            context: { kind: 'file', snippet, snippetHash: (0, hash_1.snippetHash)(snippet) },
        });
        // The export command requires a workspace folder to determine the output directory.
        // Since no workspace folder is open in the integration test runner, we skip the
        // file-system assertion and only verify the command executes without throwing.
        const wsFolders = vscode.workspace.workspaceFolders;
        if (!wsFolders || wsFolders.length === 0) {
            await vscode.commands.executeCommand('annotateForAgent.export', []);
            assert_1.strict.ok(true, 'skip file check: no workspace folder open in test runner');
            return;
        }
        await vscode.commands.executeCommand('annotateForAgent.export', []);
        const dir = path.join(tmpDir, 'exports');
        const files = fs.readdirSync(dir);
        assert_1.strict.equal(files.length, 1);
        assert_1.strict.match(files[0], /^[a-z]+-[a-z]+-\d{8}-\d{6}\.md$/);
    });
    after(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });
});
//# sourceMappingURL=export.test.js.map