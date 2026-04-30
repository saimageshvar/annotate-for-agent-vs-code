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
exports.CommentingProvider = void 0;
exports.saveAnnotationFromThread = saveAnnotationFromThread;
const vscode = __importStar(require("vscode"));
class CommentingProvider {
    controller;
    constructor() {
        this.controller = vscode.comments.createCommentController('annotateForAgent', 'Annotate for Agent');
        this.controller.commentingRangeProvider = {
            provideCommentingRanges: (document) => {
                if (document.uri.scheme === 'file' || document.uri.scheme === 'git') {
                    return [new vscode.Range(0, 0, Math.max(0, document.lineCount - 1), 0)];
                }
                return [];
            },
        };
        this.controller.options = {
            placeHolder: 'Type initial comment then click "Save annotation"',
            prompt: '',
        };
    }
    dispose() {
        this.controller.dispose();
    }
}
exports.CommentingProvider = CommentingProvider;
async function saveAnnotationFromThread(reply, handler) {
    const text = reply.text ?? '';
    const range = reply.thread.range ?? new vscode.Range(0, 0, 0, 0);
    await handler({ uri: reply.thread.uri, range, initialComment: text });
    reply.thread.dispose();
}
//# sourceMappingURL=CommentingProvider.js.map