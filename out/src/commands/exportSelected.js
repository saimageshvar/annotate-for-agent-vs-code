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
exports.exportHandler = exportHandler;
const vscode = __importStar(require("vscode"));
const export_1 = require("../export");
const slug_1 = require("../util/slug");
function exportHandler(store) {
    return async (ids) => {
        const cfg = vscode.workspace.getConfiguration('annotateForAgent');
        const format = cfg.get('defaultFormat') ?? 'markdown';
        const all = store.list();
        const selected = ids.length ? all.filter(a => ids.includes(a.id)) : all;
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
            vscode.window.showErrorMessage('Open a workspace to export annotations.');
            return;
        }
        const out = (0, export_1.renderExport)(selected, {
            format,
            workspace: workspace.name,
            includeCodeHunk: cfg.get('includeCodeHunk') ?? true,
            includeCategoryLegend: cfg.get('includeCategoryLegend') ?? true,
            now: new Date(),
        });
        const dir = cfg.get('exportDir') ?? '.annotate-for-agent/exports';
        const filename = (0, export_1.buildFilename)(format, new Date(), slug_1.generateSlug);
        const targetDir = vscode.Uri.joinPath(workspace.uri, dir);
        const targetFile = vscode.Uri.joinPath(targetDir, filename);
        await vscode.workspace.fs.createDirectory(targetDir);
        await vscode.workspace.fs.writeFile(targetFile, Buffer.from(out, 'utf8'));
        if (cfg.get('autoResolveOnExport')) {
            for (const a of selected)
                await store.update(a.id, { status: 'resolved', exportedAt: Date.now() });
        }
        else {
            for (const a of selected)
                await store.update(a.id, { exportedAt: Date.now() });
        }
        const choice = await vscode.window.showInformationMessage(`Exported ${selected.length} annotation(s) → ${filename}`, 'Open file');
        if (choice === 'Open file') {
            await vscode.window.showTextDocument(targetFile);
        }
    };
}
//# sourceMappingURL=exportSelected.js.map