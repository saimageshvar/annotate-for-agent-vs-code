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
exports.openAnnotationCommand = openAnnotationCommand;
const path = __importStar(require("node:path"));
const vscode = __importStar(require("vscode"));
const range_1 = require("../util/range");
function openAnnotationCommand(store, editorPanel) {
    return async (arg) => {
        const id = typeof arg === 'string' ? arg : arg?.id;
        if (!id)
            return;
        const ann = store.get(id);
        if (!ann)
            return;
        let uri;
        if (path.isAbsolute(ann.filePath)) {
            uri = vscode.Uri.file(ann.filePath);
        }
        else {
            const wsFolders = vscode.workspace.workspaceFolders;
            if (!wsFolders || wsFolders.length === 0) {
                vscode.window.showErrorMessage(`Cannot open annotation: no workspace folder open.`);
                return;
            }
            uri = vscode.Uri.joinPath(wsFolders[0].uri, ann.filePath);
        }
        const range = (0, range_1.linesToRange)(ann.range);
        try {
            const editor = await vscode.window.showTextDocument(uri, { selection: range, preserveFocus: false });
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }
        catch (err) {
            vscode.window.showErrorMessage(`Cannot open ${ann.filePath}: ${err instanceof Error ? err.message : String(err)}`);
            return;
        }
        editorPanel.showView(ann);
    };
}
//# sourceMappingURL=openAnnotation.js.map