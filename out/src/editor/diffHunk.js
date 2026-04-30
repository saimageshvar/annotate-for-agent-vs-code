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
exports.captureDiffContext = captureDiffContext;
const vscode = __importStar(require("vscode"));
const hash_1 = require("../util/hash");
async function getGitApi() {
    const ext = vscode.extensions.getExtension('vscode.git');
    if (!ext)
        return undefined;
    if (!ext.isActive)
        await ext.activate();
    return ext.exports.getAPI(1);
}
function findRepo(api, fileUri) {
    return api.repositories.find(r => fileUri.fsPath.startsWith(r.rootUri.fsPath));
}
async function captureDiffContext(fileUri, startLine, endLine) {
    const api = await getGitApi();
    if (!api)
        return undefined;
    const repo = findRepo(api, fileUri);
    if (!repo)
        return undefined;
    const relPath = vscode.workspace.asRelativePath(fileUri);
    const diff = await repo.diffWithHEAD(relPath);
    if (!diff)
        return undefined;
    const hunkRe = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@.*$/gm;
    let match;
    const hunks = [];
    while ((match = hunkRe.exec(diff))) {
        const newStart = parseInt(match[3], 10);
        const newCount = match[4] ? parseInt(match[4], 10) : 1;
        hunks.push({ header: match[0], newStart, newEnd: newStart + newCount - 1, index: match.index });
    }
    const overlapping = hunks.filter(h => !(endLine < h.newStart || startLine > h.newEnd));
    if (overlapping.length === 0)
        return undefined;
    const before = [];
    const after = [];
    const first = overlapping[0];
    const last = overlapping[overlapping.length - 1];
    const startIdx = first.index;
    const nextHunk = hunks.find(h => h.index > last.index);
    const endIdx = nextHunk ? nextHunk.index : diff.length;
    const body = diff.slice(startIdx, endIdx).split('\n').slice(1);
    for (const line of body) {
        if (line.startsWith('-'))
            before.push(line.slice(1));
        else if (line.startsWith('+'))
            after.push(line.slice(1));
        else if (line.startsWith(' ')) {
            before.push(line.slice(1));
            after.push(line.slice(1));
        }
    }
    const beforeText = before.join('\n');
    const afterText = after.join('\n');
    return {
        kind: 'diff',
        before: beforeText,
        after: afterText,
        hunkHeader: first.header,
        snippetHash: (0, hash_1.snippetHash)(afterText),
    };
}
//# sourceMappingURL=diffHunk.js.map