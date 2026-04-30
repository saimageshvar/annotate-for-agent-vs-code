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
exports.registerCommands = registerCommands;
const vscode = __importStar(require("vscode"));
const createAnnotation_1 = require("./createAnnotation");
const openAnnotation_1 = require("./openAnnotation");
const deleteAnnotation_1 = require("./deleteAnnotation");
const resolveAnnotation_1 = require("./resolveAnnotation");
const copySelected_1 = require("./copySelected");
const exportSelected_1 = require("./exportSelected");
const editAnnotation_1 = require("./editAnnotation");
function registerCommands(context, store, editorPanel) {
    const create = (0, createAnnotation_1.createAnnotationCommand)(store, editorPanel);
    const open = (0, openAnnotation_1.openAnnotationCommand)(store, editorPanel);
    const del = (0, deleteAnnotation_1.deleteAnnotationHandler)(store);
    const resolve = (0, resolveAnnotation_1.resolveAnnotationHandler)(store);
    const copy = (0, copySelected_1.copyHandler)(store);
    const doExport = (0, exportSelected_1.exportHandler)(store);
    const save = (0, editAnnotation_1.saveAnnotationHandler)(store);
    context.subscriptions.push(vscode.commands.registerCommand('annotateForAgent.createAnnotation', create), vscode.commands.registerCommand('annotateForAgent.openAnnotation', open), vscode.commands.registerCommand('annotateForAgent.deleteAnnotation', del), vscode.commands.registerCommand('annotateForAgent.resolveAnnotation', resolve), vscode.commands.registerCommand('annotateForAgent.copy', copy), vscode.commands.registerCommand('annotateForAgent.export', doExport));
    return { create, open, del, resolve, copy, doExport, save };
}
//# sourceMappingURL=index.js.map