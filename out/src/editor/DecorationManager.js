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
exports.DecorationManager = void 0;
const vscode = __importStar(require("vscode"));
const range_1 = require("../util/range");
class DecorationManager {
    decorationTypes;
    constructor(context) {
        this.decorationTypes = new Map();
        this.decorationTypes.set('open', vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.joinPath(context.extensionUri, 'media/gutter-open.svg'),
            gutterIconSize: 'contain',
            borderWidth: '0 0 0 2px',
            borderStyle: 'solid',
            borderColor: '#3182ce',
            overviewRulerColor: '#3182ce',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
        }));
        this.decorationTypes.set('stale', vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.joinPath(context.extensionUri, 'media/gutter-stale.svg'),
            gutterIconSize: 'contain',
            borderWidth: '0 0 0 2px',
            borderStyle: 'solid',
            borderColor: '#c53030',
            textDecoration: 'underline wavy #c53030',
            overviewRulerColor: '#c53030',
            overviewRulerLane: vscode.OverviewRulerLane.Right,
        }));
        this.decorationTypes.set('resolved', vscode.window.createTextEditorDecorationType({
            gutterIconPath: vscode.Uri.joinPath(context.extensionUri, 'media/gutter-resolved.svg'),
            gutterIconSize: 'contain',
            opacity: '0.5',
        }));
    }
    refresh(editor, annotations, showResolved) {
        const byStatus = { open: [], stale: [], resolved: [] };
        const relPath = vscode.workspace.asRelativePath(editor.document.uri);
        for (const a of annotations) {
            if (a.filePath !== relPath && a.filePath !== editor.document.uri.fsPath)
                continue;
            if (a.status === 'resolved' && !showResolved)
                continue;
            const range = (0, range_1.linesToRange)(a.range);
            byStatus[a.status].push(range);
        }
        for (const [status, ranges] of Object.entries(byStatus)) {
            const type = this.decorationTypes.get(status);
            if (type)
                editor.setDecorations(type, ranges);
        }
    }
    dispose() {
        for (const t of this.decorationTypes.values())
            t.dispose();
    }
}
exports.DecorationManager = DecorationManager;
//# sourceMappingURL=DecorationManager.js.map