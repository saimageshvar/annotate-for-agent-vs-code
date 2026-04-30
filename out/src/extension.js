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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const AnnotationStore_1 = require("./store/AnnotationStore");
const ListViewProvider_1 = require("./views/ListViewProvider");
const EditorPanel_1 = require("./views/EditorPanel");
const CommentingProvider_1 = require("./editor/CommentingProvider");
const DecorationManager_1 = require("./editor/DecorationManager");
const HoverProvider_1 = require("./editor/HoverProvider");
const StaleTracker_1 = require("./editor/StaleTracker");
const commands_1 = require("./commands");
async function activate(context) {
    const store = new AnnotationStore_1.AnnotationStore(context.workspaceState);
    await store.init();
    let handlers;
    const editorPanel = new EditorPanel_1.EditorPanel(context.extensionUri, {
        onSave: async (payload, mode) => { await handlers.save(payload, mode); },
        onCancel: () => { },
        onResolve: async (id) => { await handlers.resolve(id); },
        onDelete: async (id) => { await handlers.del(id); },
    }, store);
    const decorations = new DecorationManager_1.DecorationManager(context);
    const hover = new HoverProvider_1.AnnotationHoverProvider(store);
    const staleTracker = new StaleTracker_1.StaleTracker(store);
    const refreshDecorations = () => {
        const ed = vscode.window.activeTextEditor;
        const showResolved = vscode.workspace.getConfiguration('annotateForAgent').get('showResolved') ?? false;
        if (ed)
            decorations.refresh(ed, store.list(), showResolved);
    };
    store.onDidChange(refreshDecorations);
    vscode.window.onDidChangeActiveTextEditor(refreshDecorations);
    const commenting = new CommentingProvider_1.CommentingProvider();
    const listView = new ListViewProvider_1.ListViewProvider(context.extensionUri, store, {
        open: (id) => vscode.commands.executeCommand('annotateForAgent.openAnnotation', id),
        copy: (ids) => vscode.commands.executeCommand('annotateForAgent.copy', ids),
        export: (ids) => vscode.commands.executeCommand('annotateForAgent.export', ids),
    });
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(ListViewProvider_1.ListViewProvider.viewType, listView), vscode.languages.registerHoverProvider({ scheme: 'file' }, hover), vscode.languages.registerHoverProvider({ scheme: 'git' }, hover), commenting, { dispose: () => decorations.dispose() }, { dispose: () => staleTracker.dispose() }, vscode.commands.registerCommand('annotateForAgent.saveFromThread', async (reply) => {
        await (0, CommentingProvider_1.saveAnnotationFromThread)(reply, async ({ uri, range, initialComment }) => {
            await vscode.commands.executeCommand('annotateForAgent.createAnnotation', { uri, range, initialComment });
        });
    }));
    handlers = (0, commands_1.registerCommands)(context, store, editorPanel);
    refreshDecorations();
    return { store };
}
function deactivate() { }
//# sourceMappingURL=extension.js.map