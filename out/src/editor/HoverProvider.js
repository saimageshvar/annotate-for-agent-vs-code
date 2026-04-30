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
exports.AnnotationHoverProvider = void 0;
const vscode = __importStar(require("vscode"));
const range_1 = require("../util/range");
class AnnotationHoverProvider {
    store;
    constructor(store) {
        this.store = store;
    }
    provideHover(document, position) {
        const relPath = vscode.workspace.asRelativePath(document.uri);
        const ann = this.store.list().find(a => {
            if (a.filePath !== relPath && a.filePath !== document.uri.fsPath)
                return false;
            const r = (0, range_1.linesToRange)(a.range);
            return position.line >= r.start.line && position.line <= r.end.line;
        });
        if (!ann)
            return undefined;
        const args = encodeURIComponent(JSON.stringify({ id: ann.id }));
        const md = new vscode.MarkdownString(`**[${ann.category}]** ${ann.comment.split('\n')[0]}\n\n` +
            `_${ann.status}_ · [Open in pane](command:annotateForAgent.openAnnotation?${args})`);
        md.isTrusted = { enabledCommands: ['annotateForAgent.openAnnotation'] };
        return new vscode.Hover(md, (0, range_1.linesToRange)(ann.range));
    }
}
exports.AnnotationHoverProvider = AnnotationHoverProvider;
//# sourceMappingURL=HoverProvider.js.map