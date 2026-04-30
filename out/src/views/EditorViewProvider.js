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
exports.EditorViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const categoryMeta_1 = require("../store/categoryMeta");
class EditorViewProvider {
    extensionUri;
    handlers;
    store;
    static viewType = 'annotateForAgent.editor';
    view;
    pendingInit;
    constructor(extensionUri, handlers, store) {
        this.extensionUri = extensionUri;
        this.handlers = handlers;
        this.store = store;
    }
    resolveWebviewView(view) {
        this.view = view;
        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist'), vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/editor')],
        };
        view.webview.html = this.getHtml(view.webview);
        view.webview.onDidReceiveMessage(msg => this.onMessage(msg));
        if (this.pendingInit) {
            view.webview.postMessage(this.pendingInit);
            this.pendingInit = undefined;
        }
    }
    showCreate(payload) {
        const msg = {
            type: 'init-create',
            defaultCategory: categoryMeta_1.DEFAULT_CATEGORY,
            categoryMeta: categoryMeta_1.CATEGORY_META,
            payload,
        };
        if (this.view)
            this.view.webview.postMessage(msg);
        else
            this.pendingInit = msg;
    }
    showView(annotation) {
        const msg = { type: 'init-view', annotation, categoryMeta: categoryMeta_1.CATEGORY_META };
        if (this.view)
            this.view.webview.postMessage(msg);
        else
            this.pendingInit = msg;
    }
    reset() {
        if (this.view)
            this.view.webview.postMessage({ type: 'reset' });
    }
    onMessage(msg) {
        switch (msg.type) {
            case 'ready':
                if (this.pendingInit && this.view) {
                    this.view.webview.postMessage(this.pendingInit);
                    this.pendingInit = undefined;
                }
                break;
            case 'save':
                void this.handlers.onSave(msg.payload, msg.mode === 'edit' ? 'edit' : 'create');
                break;
            case 'cancel':
                this.handlers.onCancel();
                break;
            case 'resolve':
                void this.handlers.onResolve(msg.id);
                break;
            case 'delete':
                void this.handlers.onDelete(msg.id);
                break;
        }
    }
    getHtml(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist/webview/editor/main.js'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/editor/styles.css'));
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><link rel="stylesheet" href="${stylesUri}"></head>
<body><div id="app"></div><script src="${scriptUri}"></script></body></html>`;
    }
}
exports.EditorViewProvider = EditorViewProvider;
//# sourceMappingURL=EditorViewProvider.js.map