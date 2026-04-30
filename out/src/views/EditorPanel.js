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
exports.EditorPanel = void 0;
const vscode = __importStar(require("vscode"));
const categoryMeta_1 = require("../store/categoryMeta");
class EditorPanel {
    extensionUri;
    handlers;
    store;
    panel;
    pendingInit;
    constructor(extensionUri, handlers, store) {
        this.extensionUri = extensionUri;
        this.handlers = handlers;
        this.store = store;
    }
    showCreate(payload) {
        this.ensurePanel('New annotation');
        const msg = {
            type: 'init-create',
            defaultCategory: categoryMeta_1.DEFAULT_CATEGORY,
            categoryMeta: categoryMeta_1.CATEGORY_META,
            payload,
        };
        if (this.panel)
            this.panel.webview.postMessage(msg);
        else
            this.pendingInit = msg;
    }
    showView(annotation) {
        this.ensurePanel(`Annotation: ${annotation.filePath.split('/').pop() ?? annotation.filePath}:${annotation.range.startLine}`);
        const msg = { type: 'init-view', annotation, categoryMeta: categoryMeta_1.CATEGORY_META };
        if (this.panel)
            this.panel.webview.postMessage(msg);
        else
            this.pendingInit = msg;
    }
    close() {
        this.panel?.dispose();
    }
    ensurePanel(title) {
        if (this.panel) {
            this.panel.title = title;
            this.panel.reveal(vscode.ViewColumn.Beside, false);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('annotateForAgent.editor', title, { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false }, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'dist'),
                vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/editor'),
                vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared'),
            ],
        });
        this.panel.webview.html = this.getHtml(this.panel.webview);
        this.panel.webview.onDidReceiveMessage(msg => this.onMessage(msg));
        this.panel.onDidDispose(() => { this.panel = undefined; this.pendingInit = undefined; });
        if (this.pendingInit) {
            this.panel.webview.postMessage(this.pendingInit);
            this.pendingInit = undefined;
        }
    }
    onMessage(msg) {
        switch (msg.type) {
            case 'ready':
                if (this.pendingInit && this.panel) {
                    this.panel.webview.postMessage(this.pendingInit);
                    this.pendingInit = undefined;
                }
                break;
            case 'save':
                void this.handlers.onSave(msg.payload, msg.mode === 'edit' ? 'edit' : 'create').then(() => this.close());
                break;
            case 'cancel':
                this.handlers.onCancel();
                this.close();
                break;
            case 'resolve':
                void this.handlers.onResolve(msg.id);
                break;
            case 'delete':
                void this.handlers.onDelete(msg.id).then(() => this.close());
                break;
        }
    }
    getHtml(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist/webview/editor/main.js'));
        const tokensUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared/tokens.css'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/editor/styles.css'));
        const nonce = String(Date.now());
        return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
<link rel="stylesheet" href="${tokensUri}">
<link rel="stylesheet" href="${stylesUri}">
</head><body><div id="app"></div><script nonce="${nonce}" src="${scriptUri}"></script></body></html>`;
    }
}
exports.EditorPanel = EditorPanel;
//# sourceMappingURL=EditorPanel.js.map