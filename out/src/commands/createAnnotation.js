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
exports.createAnnotationCommand = createAnnotationCommand;
const vscode = __importStar(require("vscode"));
const diffHunk_1 = require("../editor/diffHunk");
const hash_1 = require("../util/hash");
const range_1 = require("../util/range");
function createAnnotationCommand(store, editorPanel) {
    return async (ctx) => {
        const active = vscode.window.activeTextEditor;
        const uri = ctx?.uri ?? active?.document.uri;
        const range = ctx?.range ?? active?.selection;
        if (!uri || !range)
            return;
        const filePath = vscode.workspace.asRelativePath(uri);
        const lines = (0, range_1.rangeToLines)(range);
        const doc = await vscode.workspace.openTextDocument(uri);
        const snippet = doc.getText(new vscode.Range(lines.startLine - 1, 0, lines.endLine - 1, Number.MAX_SAFE_INTEGER));
        let context;
        if (uri.scheme === 'git') {
            const diff = await (0, diffHunk_1.captureDiffContext)(uri, lines.startLine, lines.endLine);
            context = diff ?? { kind: 'file', snippet, snippetHash: (0, hash_1.snippetHash)(snippet) };
        }
        else {
            context = { kind: 'file', snippet, snippetHash: (0, hash_1.snippetHash)(snippet) };
        }
        editorPanel.showCreate({ filePath, range: lines, context, initialComment: ctx?.initialComment });
    };
}
//# sourceMappingURL=createAnnotation.js.map