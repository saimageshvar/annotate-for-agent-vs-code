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
exports.ListViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const categoryMeta_1 = require("../store/categoryMeta");
class ListViewProvider {
    extensionUri;
    store;
    handlers;
    static viewType = 'annotateForAgent.list';
    view;
    constructor(extensionUri, store, handlers) {
        this.extensionUri = extensionUri;
        this.store = store;
        this.handlers = handlers;
        store.onDidChange(() => this.postState());
    }
    resolveWebviewView(view) {
        this.view = view;
        view.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'dist'), vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/list'), vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared')],
        };
        view.webview.html = this.getHtml(view.webview);
        view.webview.onDidReceiveMessage(msg => this.onMessage(msg));
    }
    postState() {
        if (!this.view)
            return;
        const cfg = vscode.workspace.getConfiguration('annotateForAgent');
        this.view.webview.postMessage({
            type: 'state',
            state: {
                annotations: this.store.list(),
                categoryMeta: Object.fromEntries(Object.entries(categoryMeta_1.CATEGORY_META).map(([k, v]) => [k, { userHint: v.userHint, color: v.color, priority: v.priority }])),
                settings: {
                    includeCodeHunk: cfg.get('includeCodeHunk'),
                    defaultFormat: cfg.get('defaultFormat'),
                    showResolved: cfg.get('showResolved'),
                },
            },
        });
    }
    onMessage(msg) {
        switch (msg.type) {
            case 'ready':
                this.postState();
                break;
            case 'open':
                this.handlers.open(msg.id);
                break;
            case 'copy':
                this.handlers.copy(msg.ids);
                break;
            case 'export':
                this.handlers.export(msg.ids);
                break;
            case 'setSetting':
                void vscode.workspace.getConfiguration('annotateForAgent').update(msg.key, msg.value, vscode.ConfigurationTarget.Global);
                break;
        }
    }
    getHtml(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist/webview/list/main.js'));
        const tokensUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/shared/tokens.css'));
        const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'src/views/webview/list/styles.css'));
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="${tokensUri}">
<link rel="stylesheet" href="${stylesUri}"></head>
<body><div id="app"></div><script src="${scriptUri}"></script></body></html>`;
    }
}
exports.ListViewProvider = ListViewProvider;
//# sourceMappingURL=ListViewProvider.js.map