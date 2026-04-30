"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode14 = __toESM(require("vscode"));

// node_modules/uuid/dist/esm-node/rng.js
var import_crypto = __toESM(require("crypto"));
var rnds8Pool = new Uint8Array(256);
var poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    import_crypto.default.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }
  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

// node_modules/uuid/dist/esm-node/stringify.js
var byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

// node_modules/uuid/dist/esm-node/native.js
var import_crypto2 = __toESM(require("crypto"));
var native_default = {
  randomUUID: import_crypto2.default.randomUUID
};

// node_modules/uuid/dist/esm-node/v4.js
function v4(options, buf, offset) {
  if (native_default.randomUUID && !buf && !options) {
    return native_default.randomUUID();
  }
  options = options || {};
  const rnds = options.random || (options.rng || rng)();
  rnds[6] = rnds[6] & 15 | 64;
  rnds[8] = rnds[8] & 63 | 128;
  if (buf) {
    offset = offset || 0;
    for (let i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }
    return buf;
  }
  return unsafeStringify(rnds);
}
var v4_default = v4;

// src/store/AnnotationStore.ts
var KEY = "annotateForAgent.annotations";
var AnnotationStore = class {
  constructor(memento) {
    this.memento = memento;
  }
  annotations = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  persistTimer;
  async init() {
    const saved = this.memento.get(KEY) ?? [];
    saved.sort((a, b) => a.createdAt - b.createdAt);
    const seen = /* @__PURE__ */ new Map();
    let dedupedCount = 0;
    for (const a of saved) {
      const fp = `${a.filePath}|${a.range.startLine}-${a.range.endLine}|${a.category}|${a.comment}`;
      if (seen.has(fp)) {
        dedupedCount++;
        continue;
      }
      seen.set(fp, a.id);
      this.annotations.set(a.id, a);
    }
    if (dedupedCount > 0) {
      await this.memento.update(KEY, this.list());
      console.log(`[annotate-for-agent] init dedup removed ${dedupedCount} duplicate annotation(s)`);
    }
  }
  list() {
    return Array.from(this.annotations.values());
  }
  get(id) {
    return this.annotations.get(id);
  }
  async create(partial) {
    const now = Date.now();
    for (const existing of this.annotations.values()) {
      if (existing.filePath === partial.filePath && existing.range.startLine === partial.range.startLine && existing.range.endLine === partial.range.endLine && existing.category === partial.category && existing.comment === partial.comment && now - existing.createdAt < 2e3) {
        return existing;
      }
    }
    const a = { ...partial, id: v4_default(), createdAt: now, updatedAt: now };
    this.annotations.set(a.id, a);
    this.schedulePersist();
    this.emit();
    return a;
  }
  async update(id, patch) {
    const existing = this.annotations.get(id);
    if (!existing)
      return void 0;
    const updated = { ...existing, ...patch, id, updatedAt: Date.now() };
    this.annotations.set(id, updated);
    this.schedulePersist();
    this.emit();
    return updated;
  }
  async remove(id) {
    if (this.annotations.delete(id)) {
      this.schedulePersist();
      this.emit();
    }
  }
  onDidChange(listener) {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  }
  async flush() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = void 0;
    }
    await this.memento.update(KEY, this.list());
  }
  schedulePersist() {
    if (this.persistTimer)
      clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      void this.memento.update(KEY, this.list());
      this.persistTimer = void 0;
    }, 500);
  }
  emit() {
    const snapshot = this.list();
    for (const l of this.listeners)
      l(snapshot);
  }
};

// src/views/ListViewProvider.ts
var vscode = __toESM(require("vscode"));

// src/store/categoryMeta.ts
var CATEGORIES = ["Bug", "Refactor", "Nit", "Question", "Praise", "Suggestion"];
var CATEGORY_META = {
  Bug: {
    userHint: "Something is not working as intended.",
    agentHint: "Dev flagged a defect.",
    color: "#c53030",
    priority: 1
  },
  Question: {
    userHint: "Asking for clarification, not a change.",
    agentHint: "Dev is asking, not requesting a change.",
    color: "#805ad5",
    priority: 2
  },
  Refactor: {
    userHint: "Code works but structure could improve.",
    agentHint: "Dev suggests structural change; behavior unchanged.",
    color: "#3182ce",
    priority: 3
  },
  Suggestion: {
    userHint: "An alternative to consider.",
    agentHint: "Dev offers an alternative.",
    color: "#d69e2e",
    priority: 4
  },
  Nit: {
    userHint: "Small preference, optional to address.",
    agentHint: "Dev notes a small preference.",
    color: "#718096",
    priority: 5
  },
  Praise: {
    userHint: "Positive note on good work.",
    agentHint: "Dev is affirming good work.",
    color: "#38a169",
    priority: 6
  }
};
var DEFAULT_CATEGORY = "Suggestion";

// src/views/ListViewProvider.ts
var ListViewProvider = class {
  constructor(extensionUri, store, handlers) {
    this.extensionUri = extensionUri;
    this.store = store;
    this.handlers = handlers;
    store.onDidChange(() => this.postState());
  }
  static viewType = "annotateForAgent.list";
  view;
  resolveWebviewView(view) {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "dist"), vscode.Uri.joinPath(this.extensionUri, "src/views/webview/list"), vscode.Uri.joinPath(this.extensionUri, "src/views/webview/shared")]
    };
    view.webview.html = this.getHtml(view.webview);
    view.webview.onDidReceiveMessage((msg) => this.onMessage(msg));
    this.updateBadge();
  }
  updateBadge() {
    if (!this.view)
      return;
    const openCount = this.store.list().filter((a) => a.status === "open" || a.status === "stale").length;
    if (openCount > 0) {
      this.view.badge = { value: openCount, tooltip: `${openCount} open annotation${openCount === 1 ? "" : "s"}` };
    } else {
      this.view.badge = void 0;
    }
  }
  postState() {
    this.updateBadge();
    if (!this.view)
      return;
    const cfg = vscode.workspace.getConfiguration("annotateForAgent");
    const activeEditor = vscode.window.activeTextEditor;
    let currentFile;
    if (activeEditor) {
      currentFile = vscode.workspace.asRelativePath(activeEditor.document.uri);
    }
    this.view.webview.postMessage({
      type: "state",
      state: {
        annotations: this.store.list(),
        categoryMeta: Object.fromEntries(
          Object.entries(CATEGORY_META).map(([k, v]) => [k, { userHint: v.userHint, color: v.color, priority: v.priority }])
        ),
        settings: {
          includeCodeHunk: cfg.get("includeCodeHunk"),
          defaultFormat: cfg.get("defaultFormat"),
          showResolved: cfg.get("showResolved"),
          filterCurrentFile: cfg.get("filterCurrentFile")
        },
        currentFile
      }
    });
  }
  onMessage(msg) {
    switch (msg.type) {
      case "ready":
        this.postState();
        break;
      case "open":
        this.handlers.open(msg.id);
        break;
      case "copy":
        this.handlers.copy(msg.ids);
        break;
      case "export":
        this.handlers.export(msg.ids);
        break;
      case "bulkResolve":
        this.handlers.bulkResolve(msg.ids, msg.action ?? "resolve");
        break;
      case "bulkDelete":
        this.handlers.bulkDelete(msg.ids);
        break;
      case "notice":
        vscode.window.showInformationMessage(msg.text);
        break;
      case "setSetting": {
        const tgt = vscode.ConfigurationTarget.Global;
        vscode.workspace.getConfiguration("annotateForAgent").update(msg.key, msg.value, tgt).then(() => this.postState());
        break;
      }
    }
  }
  getHtml(webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "dist/webview/list/main.js"));
    const tokensUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src/views/webview/shared/tokens.css"));
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, "src/views/webview/list/styles.css"));
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="${tokensUri}">
<link rel="stylesheet" href="${stylesUri}"></head>
<body><div id="app"></div><script src="${scriptUri}"></script></body></html>`;
  }
};

// src/views/EditorPanel.ts
var vscode2 = __toESM(require("vscode"));
var EditorPanel = class {
  constructor(extensionUri, handlers, store) {
    this.extensionUri = extensionUri;
    this.handlers = handlers;
    this.store = store;
  }
  panel;
  pendingInit;
  creating = false;
  showCreate(payload) {
    this.ensurePanel("New annotation", false);
    const msg = {
      type: "init-create",
      defaultCategory: payload.category ?? DEFAULT_CATEGORY,
      categoryMeta: CATEGORY_META,
      payload
    };
    if (this.panel)
      this.panel.webview.postMessage(msg);
    else
      this.pendingInit = msg;
  }
  showView(annotation) {
    this.ensurePanel(`Annotation: ${annotation.filePath.split("/").pop() ?? annotation.filePath}:${annotation.range.startLine}`, true);
    const msg = { type: "init-view", annotation, categoryMeta: CATEGORY_META };
    if (this.panel)
      this.panel.webview.postMessage(msg);
    else
      this.pendingInit = msg;
  }
  close() {
    this.panel?.dispose();
  }
  ensurePanel(title, preserveFocus = true) {
    if (this.panel) {
      this.panel.title = title;
      this.panel.reveal(vscode2.ViewColumn.Beside, preserveFocus);
      return;
    }
    if (this.creating)
      return;
    this.creating = true;
    try {
      this.panel = vscode2.window.createWebviewPanel(
        "annotateForAgent.editor",
        title,
        { viewColumn: vscode2.ViewColumn.Beside, preserveFocus },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode2.Uri.joinPath(this.extensionUri, "dist"),
            vscode2.Uri.joinPath(this.extensionUri, "src/views/webview/editor"),
            vscode2.Uri.joinPath(this.extensionUri, "src/views/webview/shared")
          ]
        }
      );
      this.panel.webview.html = this.getHtml(this.panel.webview);
      this.panel.webview.onDidReceiveMessage((msg) => this.onMessage(msg));
      this.panel.onDidDispose(() => {
        this.panel = void 0;
        this.pendingInit = void 0;
      });
      if (this.pendingInit) {
        this.panel.webview.postMessage(this.pendingInit);
        this.pendingInit = void 0;
      }
    } finally {
      this.creating = false;
    }
  }
  onMessage(msg) {
    switch (msg.type) {
      case "ready":
        if (this.pendingInit && this.panel) {
          this.panel.webview.postMessage(this.pendingInit);
          this.pendingInit = void 0;
        }
        break;
      case "save":
        console.log("[annotate-for-agent] save received", { mode: msg.mode, payloadId: msg.payload?.id });
        void this.handlers.onSave(msg.payload, msg.mode === "edit" ? "edit" : "create");
        break;
      case "cancel":
        this.handlers.onCancel();
        this.close();
        break;
      case "resolve":
        void this.handlers.onResolve(msg.id);
        break;
      case "delete":
        void this.handlers.onDelete(msg.id);
        break;
      case "copy":
        void this.handlers.onCopy(msg.id);
        break;
      case "export":
        void this.handlers.onExport(msg.id);
        break;
      case "pickFile":
        void this.handleFilePick(msg.cursorAt);
        break;
    }
  }
  async handleFilePick(cursorAt) {
    const files = await vscode2.workspace.findFiles("**/*", "**/{node_modules,.git,dist,out,build,.next,coverage,.cache}/**", 5e3);
    const items = files.map((uri) => vscode2.workspace.asRelativePath(uri)).sort((a, b) => a.localeCompare(b)).map((label) => ({ label }));
    const pick2 = await vscode2.window.showQuickPick(items, {
      placeHolder: "Reference a file (Esc to cancel)",
      matchOnDescription: true,
      matchOnDetail: true
    });
    if (this.panel) {
      this.panel.reveal(vscode2.ViewColumn.Beside, false);
      if (pick2) {
        this.panel.webview.postMessage({ type: "fileChosen", path: pick2.label, cursorAt });
      } else {
        this.panel.webview.postMessage({ type: "fileChosen", path: "", cursorAt });
      }
    }
  }
  getHtml(webview) {
    const scriptUri = webview.asWebviewUri(vscode2.Uri.joinPath(this.extensionUri, "dist/webview/editor/main.js"));
    const tokensUri = webview.asWebviewUri(vscode2.Uri.joinPath(this.extensionUri, "src/views/webview/shared/tokens.css"));
    const stylesUri = webview.asWebviewUri(vscode2.Uri.joinPath(this.extensionUri, "src/views/webview/editor/styles.css"));
    const nonce = String(Date.now());
    return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
<link rel="stylesheet" href="${tokensUri}">
<link rel="stylesheet" href="${stylesUri}">
</head><body><div id="app"></div><script nonce="${nonce}" src="${scriptUri}"></script></body></html>`;
  }
};

// src/editor/DecorationManager.ts
var vscode4 = __toESM(require("vscode"));

// src/util/range.ts
var vscode3 = __toESM(require("vscode"));
function rangeToLines(r) {
  return { startLine: r.start.line + 1, endLine: r.end.line + 1 };
}
function linesToRange(lines) {
  return new vscode3.Range(
    new vscode3.Position(Math.max(0, lines.startLine - 1), 0),
    new vscode3.Position(Math.max(0, lines.endLine - 1), 0)
  );
}

// src/editor/DecorationManager.ts
function buildHoverMessage(a) {
  const args = encodeURIComponent(JSON.stringify({ id: a.id }));
  const firstLine = (a.comment.split("\n")[0] || "(no comment)").slice(0, 200);
  const meta = CATEGORY_META[a.category];
  const statusLabel = a.status === "stale" ? "\u26A0 **stale**" : a.status === "resolved" ? "\u2713 resolved" : "open";
  const md = new vscode4.MarkdownString(
    `<span style="color:${meta.color}">**${a.category.toUpperCase()}**</span> \xB7 ${statusLabel}

${firstLine}

[$(edit) Open in pane](command:annotateForAgent.openAnnotation?${args})`
  );
  md.isTrusted = { enabledCommands: ["annotateForAgent.openAnnotation"] };
  md.supportHtml = true;
  md.supportThemeIcons = true;
  return md;
}
function svgDataUri(color, status) {
  let svg;
  if (status === "stale") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><path d='M8 2 L14 13 L2 13 Z' fill='${color}' stroke='${color}' stroke-width='1' stroke-linejoin='round'/><rect x='7.25' y='6' width='1.5' height='4' fill='#fff'/><rect x='7.25' y='11' width='1.5' height='1.5' fill='#fff'/></svg>`;
  } else if (status === "resolved") {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='5' fill='${color}' opacity='0.6'/><path d='M5.5 8 L7 9.5 L10.5 6.5' fill='none' stroke='#fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
  } else {
    svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='5' fill='${color}'/><circle cx='8' cy='8' r='2' fill='#fff'/></svg>`;
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
var DecorationManager = class {
  constructor(context) {
    this.context = context;
  }
  rangeTypes = /* @__PURE__ */ new Map();
  iconTypes = /* @__PURE__ */ new Map();
  getRangeType(category, status) {
    const key = `${category}:${status}`;
    const existing = this.rangeTypes.get(key);
    if (existing)
      return existing;
    const color = CATEGORY_META[category].color;
    const opacity = status === "resolved" ? "0.35" : status === "stale" ? "0.9" : "1";
    const bgAlpha = status === "resolved" ? 0.04 : status === "stale" ? 0.08 : 0.06;
    const borderStyle = status === "resolved" ? "dotted" : "solid";
    const type = vscode4.window.createTextEditorDecorationType({
      isWholeLine: true,
      borderWidth: "0 0 0 3px",
      borderStyle,
      borderColor: color,
      backgroundColor: `${color}${Math.floor(bgAlpha * 255).toString(16).padStart(2, "0")}`,
      overviewRulerColor: color,
      overviewRulerLane: vscode4.OverviewRulerLane.Right,
      opacity
    });
    this.rangeTypes.set(key, type);
    return type;
  }
  getIconType(category, status) {
    const key = `${category}:${status}`;
    const existing = this.iconTypes.get(key);
    if (existing)
      return existing;
    const color = CATEGORY_META[category].color;
    const iconUri = vscode4.Uri.parse(svgDataUri(color, status));
    const type = vscode4.window.createTextEditorDecorationType({
      gutterIconPath: iconUri,
      gutterIconSize: "contain"
    });
    this.iconTypes.set(key, type);
    return type;
  }
  refresh(editor, annotations, showResolved) {
    const rangeBuckets = /* @__PURE__ */ new Map();
    const iconBuckets = /* @__PURE__ */ new Map();
    const relPath = vscode4.workspace.asRelativePath(editor.document.uri);
    const rel = [];
    for (const a of annotations) {
      if (a.filePath !== relPath && a.filePath !== editor.document.uri.fsPath)
        continue;
      if (a.status === "resolved" && !showResolved)
        continue;
      rel.push(a);
    }
    const byFingerprint = /* @__PURE__ */ new Map();
    for (const a of rel) {
      const fp = `${a.filePath}|${a.range.startLine}-${a.range.endLine}|${a.category}|${a.comment}`;
      const existing = byFingerprint.get(fp);
      if (!existing || a.createdAt < existing.createdAt) {
        byFingerprint.set(fp, a);
      }
    }
    const dedupedRel = Array.from(byFingerprint.values());
    for (const a of dedupedRel) {
      const range = linesToRange(a.range);
      const hoverMessage = buildHoverMessage(a);
      const key = `${a.category}:${a.status}`;
      if (!rangeBuckets.has(key))
        rangeBuckets.set(key, []);
      rangeBuckets.get(key).push({ range, hoverMessage });
      this.getRangeType(a.category, a.status);
    }
    const byStartLine = /* @__PURE__ */ new Map();
    for (const a of dedupedRel) {
      const startLine = Math.max(0, a.range.startLine - 1);
      if (!byStartLine.has(startLine))
        byStartLine.set(startLine, []);
      byStartLine.get(startLine).push(a);
    }
    for (const [startLine, group] of byStartLine) {
      const rep = group.slice().sort((a, b) => {
        const sp = { stale: 0, open: 1, resolved: 2 };
        const sa = sp[a.status], sb = sp[b.status];
        if (sa !== sb)
          return sa - sb;
        const pa = CATEGORY_META[a.category].priority;
        const pb = CATEGORY_META[b.category].priority;
        return pa - pb;
      })[0];
      const key = `${rep.category}:${rep.status}`;
      if (!iconBuckets.has(key))
        iconBuckets.set(key, []);
      iconBuckets.get(key).push({ range: new vscode4.Range(startLine, 0, startLine, 0) });
      this.getIconType(rep.category, rep.status);
    }
    for (const [key, type] of this.rangeTypes) {
      editor.setDecorations(type, rangeBuckets.get(key) ?? []);
    }
    for (const [key, type] of this.iconTypes) {
      editor.setDecorations(type, iconBuckets.get(key) ?? []);
    }
  }
  dispose() {
    for (const t of this.rangeTypes.values())
      t.dispose();
    for (const t of this.iconTypes.values())
      t.dispose();
    this.rangeTypes.clear();
    this.iconTypes.clear();
  }
};

// src/editor/StaleTracker.ts
var vscode5 = __toESM(require("vscode"));

// src/util/hash.ts
var import_node_crypto = require("node:crypto");
function snippetHash(snippet) {
  const normalized = snippet.replace(/\r\n/g, "\n").trim();
  return (0, import_node_crypto.createHash)("sha1").update(normalized).digest("hex");
}

// src/editor/StaleTracker.ts
var StaleTracker = class {
  constructor(store) {
    this.store = store;
    this.disposables.push(
      vscode5.workspace.onDidChangeTextDocument((e) => this.schedule(e.document))
    );
  }
  timers = /* @__PURE__ */ new Map();
  disposables = [];
  schedule(doc) {
    const key = doc.uri.toString();
    const existing = this.timers.get(key);
    if (existing)
      clearTimeout(existing);
    this.timers.set(key, setTimeout(() => {
      this.timers.delete(key);
      void this.check(doc);
    }, 300));
  }
  async check(doc) {
    const relPath = vscode5.workspace.asRelativePath(doc.uri);
    const matching = this.store.list().filter(
      (a) => (a.filePath === relPath || a.filePath === doc.uri.fsPath) && a.status !== "resolved"
    );
    for (const a of matching) {
      const startLine = a.range.startLine - 1;
      const endLine = Math.min(a.range.endLine - 1, doc.lineCount - 1);
      if (startLine < 0 || startLine > endLine) {
        if (a.status !== "stale")
          await this.store.update(a.id, { status: "stale" });
        continue;
      }
      const snippet = doc.getText(new vscode5.Range(startLine, 0, endLine, Number.MAX_SAFE_INTEGER));
      const h = snippetHash(snippet);
      if (h !== a.context.snippetHash && a.status !== "stale") {
        await this.store.update(a.id, { status: "stale" });
      }
    }
  }
  dispose() {
    for (const t of this.timers.values())
      clearTimeout(t);
    for (const d of this.disposables)
      d.dispose();
  }
};

// src/commands/index.ts
var vscode13 = __toESM(require("vscode"));

// src/commands/createAnnotation.ts
var vscode7 = __toESM(require("vscode"));

// src/editor/diffHunk.ts
var vscode6 = __toESM(require("vscode"));
async function getGitApi() {
  const ext = vscode6.extensions.getExtension("vscode.git");
  if (!ext)
    return void 0;
  if (!ext.isActive)
    await ext.activate();
  return ext.exports.getAPI(1);
}
function findRepo(api, fileUri) {
  return api.repositories.find((r) => fileUri.fsPath.startsWith(r.rootUri.fsPath));
}
async function captureDiffContext(fileUri, startLine, endLine) {
  const api = await getGitApi();
  if (!api)
    return void 0;
  const repo = findRepo(api, fileUri);
  if (!repo)
    return void 0;
  const relPath = vscode6.workspace.asRelativePath(fileUri);
  const diff = await repo.diffWithHEAD(relPath);
  if (!diff)
    return void 0;
  const hunkRe = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@.*$/gm;
  let match;
  const hunks = [];
  while (match = hunkRe.exec(diff)) {
    const newStart = parseInt(match[3], 10);
    const newCount = match[4] ? parseInt(match[4], 10) : 1;
    hunks.push({ header: match[0], newStart, newEnd: newStart + newCount - 1, index: match.index });
  }
  const overlapping = hunks.filter((h) => !(endLine < h.newStart || startLine > h.newEnd));
  if (overlapping.length === 0)
    return void 0;
  const before = [];
  const after = [];
  const first = overlapping[0];
  const last = overlapping[overlapping.length - 1];
  const startIdx = first.index;
  const nextHunk = hunks.find((h) => h.index > last.index);
  const endIdx = nextHunk ? nextHunk.index : diff.length;
  const body = diff.slice(startIdx, endIdx).split("\n").slice(1);
  for (const line of body) {
    if (line.startsWith("-"))
      before.push(line.slice(1));
    else if (line.startsWith("+"))
      after.push(line.slice(1));
    else if (line.startsWith(" ")) {
      before.push(line.slice(1));
      after.push(line.slice(1));
    }
  }
  const beforeText = before.join("\n");
  const afterText = after.join("\n");
  return {
    kind: "diff",
    before: beforeText,
    after: afterText,
    hunkHeader: first.header,
    snippetHash: snippetHash(afterText)
  };
}

// src/commands/createAnnotation.ts
function createAnnotationCommand(store, editorPanel) {
  return async (ctx) => {
    const active = vscode7.window.activeTextEditor;
    const uri = ctx?.uri ?? active?.document.uri;
    const range = ctx?.range ?? active?.selection;
    if (!uri || !range)
      return;
    const filePath = vscode7.workspace.asRelativePath(uri);
    const lines = rangeToLines(range);
    const doc = await vscode7.workspace.openTextDocument(uri);
    const snippet = doc.getText(new vscode7.Range(lines.startLine - 1, 0, lines.endLine - 1, Number.MAX_SAFE_INTEGER));
    let context;
    if (uri.scheme === "git") {
      const diff = await captureDiffContext(uri, lines.startLine, lines.endLine);
      context = diff ?? { kind: "file", snippet, snippetHash: snippetHash(snippet) };
    } else {
      context = { kind: "file", snippet, snippetHash: snippetHash(snippet) };
    }
    editorPanel.showCreate({ filePath, range: lines, context, initialComment: ctx?.initialComment });
  };
}

// src/commands/openAnnotation.ts
var path = __toESM(require("node:path"));
var vscode8 = __toESM(require("vscode"));
function openAnnotationCommand(store, editorPanel) {
  return async (arg) => {
    const id = typeof arg === "string" ? arg : arg?.id;
    if (!id)
      return;
    const ann = store.get(id);
    if (!ann)
      return;
    let uri;
    if (path.isAbsolute(ann.filePath)) {
      uri = vscode8.Uri.file(ann.filePath);
    } else {
      const wsFolders = vscode8.workspace.workspaceFolders;
      if (!wsFolders || wsFolders.length === 0) {
        vscode8.window.showErrorMessage(`Cannot open annotation: no workspace folder open.`);
        return;
      }
      uri = vscode8.Uri.joinPath(wsFolders[0].uri, ann.filePath);
    }
    const range = linesToRange(ann.range);
    let targetColumn;
    for (const group of vscode8.window.tabGroups.all) {
      for (const tab of group.tabs) {
        const input = tab.input;
        if (input && input.uri && input.uri.toString() === uri.toString()) {
          targetColumn = group.viewColumn;
          break;
        }
      }
      if (targetColumn)
        break;
    }
    try {
      const editor = await vscode8.window.showTextDocument(uri, {
        selection: range,
        preserveFocus: false,
        preview: false,
        viewColumn: targetColumn ?? vscode8.ViewColumn.One
      });
      editor.revealRange(range, vscode8.TextEditorRevealType.InCenter);
    } catch (err) {
      vscode8.window.showErrorMessage(`Cannot open ${ann.filePath}: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }
    editorPanel.showView(ann);
  };
}

// src/commands/deleteAnnotation.ts
var vscode9 = __toESM(require("vscode"));
function deleteAnnotationHandler(store) {
  return async (id) => {
    const ann = store.get(id);
    if (!ann)
      return;
    const ok = await vscode9.window.showWarningMessage(
      `Delete annotation on ${ann.filePath}:${ann.range.startLine}?`,
      { modal: true },
      "Delete"
    );
    if (ok === "Delete")
      await store.remove(id);
  };
}

// src/commands/resolveAnnotation.ts
function resolveAnnotationHandler(store) {
  return async (id) => {
    const ann = store.get(id);
    if (!ann)
      return;
    const next = ann.status === "resolved" ? "open" : "resolved";
    await store.update(id, { status: next });
  };
}

// src/commands/copySelected.ts
var vscode10 = __toESM(require("vscode"));

// src/export/markdown.ts
function formatTimestamp(d) {
  const pad2 = (n) => n.toString().padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}
function countByStatus(annotations) {
  const counts = { open: 0, stale: 0, resolved: 0 };
  for (const a of annotations)
    counts[a.status]++;
  return `${counts.open} open \xB7 ${counts.stale} stale`;
}
function legendBlock() {
  const rows = CATEGORIES.map((c) => `| ${c} | ${CATEGORY_META[c].agentHint} |`).join("\n");
  return [
    "## Category legend (dev's intent)",
    "| Category | Meaning |",
    "|----------|---------|",
    rows,
    ""
  ].join("\n");
}
function renderContext(a, includeCodeHunk) {
  if (!includeCodeHunk)
    return "";
  if (a.context.kind === "file") {
    return "\n```\n" + a.context.snippet + "\n```\n";
  }
  const before = a.context.before.split("\n").map((l) => `- ${l}`).join("\n");
  const after = a.context.after.split("\n").map((l) => `+ ${l}`).join("\n");
  return "\n```diff\n" + a.context.hunkHeader + "\n" + before + "\n" + after + "\n```\n";
}
function renderMarkdown(annotations, opts) {
  const parts = [];
  parts.push("# Annotations for Agent\n");
  parts.push(`_Exported ${formatTimestamp(opts.now)} from \`${opts.workspace}\` \xB7 ${countByStatus(annotations)}_
`);
  if (opts.includeCategoryLegend) {
    parts.push(legendBlock());
  }
  parts.push("---\n");
  annotations.forEach((a, i) => {
    parts.push(`## ${i + 1}. [${a.category}] \`${a.filePath}:${a.range.startLine}-${a.range.endLine}\`
`);
    parts.push(`**Comment:** ${a.comment}
`);
    parts.push(renderContext(a, opts.includeCodeHunk));
  });
  return parts.join("\n");
}

// src/export/json.ts
function renderJson(annotations, opts) {
  const counts = { open: 0, stale: 0, resolved: 0 };
  for (const a of annotations)
    counts[a.status]++;
  const legend = opts.includeCategoryLegend ? Object.fromEntries(CATEGORIES.map((c) => [c, CATEGORY_META[c].agentHint])) : void 0;
  const items = annotations.map((a) => {
    const base = {
      id: a.id,
      path: a.filePath,
      range: a.range,
      category: a.category,
      status: a.status,
      comment: a.comment
    };
    if (opts.includeCodeHunk) {
      base.context = a.context;
    }
    return base;
  });
  const payload = {
    exportedAt: opts.now.toISOString(),
    workspace: opts.workspace,
    counts,
    annotations: items
  };
  if (legend)
    payload.categoryLegend = legend;
  return JSON.stringify(payload, null, 2);
}

// src/export/csv.ts
function escape(s) {
  return `"${s.replace(/"/g, '""').replace(/\r?\n/g, "\\n")}"`;
}
function hunkString(a) {
  if (a.context.kind === "file")
    return a.context.snippet;
  return `${a.context.hunkHeader}
- ${a.context.before}
+ ${a.context.after}`;
}
function renderCsv(annotations, opts) {
  const lines = [];
  if (opts.includeCategoryLegend) {
    lines.push("# Category,Action");
    for (const c of CATEGORIES) {
      lines.push(`# ${c},${CATEGORY_META[c].agentHint}`);
    }
  }
  const header = opts.includeCodeHunk ? "path,startLine,endLine,category,status,comment,codeHunk" : "path,startLine,endLine,category,status,comment";
  lines.push(header);
  for (const a of annotations) {
    const row = [
      a.filePath,
      String(a.range.startLine),
      String(a.range.endLine),
      a.category,
      a.status,
      escape(a.comment)
    ];
    if (opts.includeCodeHunk)
      row.push(escape(hunkString(a)));
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

// src/export/filename.ts
var EXT = {
  markdown: "md",
  json: "json",
  csv: "csv"
};
function pad(n) {
  return n.toString().padStart(2, "0");
}
function buildFilename(format, now, slugFn) {
  const ts = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
  return `${slugFn()}-${ts}.${EXT[format]}`;
}

// src/export/index.ts
function renderExport(annotations, opts) {
  switch (opts.format) {
    case "markdown":
      return renderMarkdown(annotations, opts);
    case "json":
      return renderJson(annotations, opts);
    case "csv":
      return renderCsv(annotations, { includeCodeHunk: opts.includeCodeHunk, includeCategoryLegend: opts.includeCategoryLegend });
  }
}

// src/commands/copySelected.ts
function copyHandler(store) {
  return async (ids) => {
    const cfg = vscode10.workspace.getConfiguration("annotateForAgent");
    const all = store.list();
    const selected = ids.length ? all.filter((a) => ids.includes(a.id)) : all;
    const workspace13 = vscode10.workspace.workspaceFolders?.[0]?.name ?? "workspace";
    const out = renderExport(selected, {
      format: cfg.get("defaultFormat") ?? "markdown",
      workspace: workspace13,
      includeCodeHunk: cfg.get("includeCodeHunk") ?? true,
      includeCategoryLegend: cfg.get("includeCategoryLegend") ?? true,
      now: /* @__PURE__ */ new Date()
    });
    await vscode10.env.clipboard.writeText(out);
    vscode10.window.showInformationMessage(`Copied ${selected.length} annotation(s) to clipboard.`);
  };
}

// src/commands/exportSelected.ts
var vscode11 = __toESM(require("vscode"));

// src/util/slug.ts
var ADJECTIVES = [
  "swift",
  "quiet",
  "bright",
  "gentle",
  "fierce",
  "calm",
  "bold",
  "shy",
  "wise",
  "clever",
  "brave",
  "kind",
  "sharp",
  "gentle",
  "smooth",
  "steady",
  "nimble",
  "silent",
  "lively",
  "humble",
  "proud",
  "eager",
  "patient",
  "cheerful",
  "noble",
  "loyal",
  "curious",
  "graceful",
  "mellow",
  "keen"
];
var ANIMALS = [
  "otter",
  "fox",
  "hawk",
  "wolf",
  "bear",
  "deer",
  "owl",
  "lynx",
  "falcon",
  "raven",
  "badger",
  "heron",
  "eagle",
  "stag",
  "mink",
  "ibex",
  "panda",
  "puma",
  "tapir",
  "sable",
  "crane",
  "swan",
  "moth",
  "finch",
  "marten",
  "salmon",
  "ermine",
  "kestrel",
  "pangolin",
  "civet"
];
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateSlug() {
  return `${pick(ADJECTIVES)}-${pick(ANIMALS)}`;
}

// src/commands/exportSelected.ts
function exportHandler(store) {
  return async (ids) => {
    const cfg = vscode11.workspace.getConfiguration("annotateForAgent");
    const format = cfg.get("defaultFormat") ?? "markdown";
    const all = store.list();
    const selected = ids.length ? all.filter((a) => ids.includes(a.id)) : all;
    const workspace13 = vscode11.workspace.workspaceFolders?.[0];
    if (!workspace13) {
      vscode11.window.showErrorMessage("Open a workspace to export annotations.");
      return;
    }
    const out = renderExport(selected, {
      format,
      workspace: workspace13.name,
      includeCodeHunk: cfg.get("includeCodeHunk") ?? true,
      includeCategoryLegend: cfg.get("includeCategoryLegend") ?? true,
      now: /* @__PURE__ */ new Date()
    });
    const dir = cfg.get("exportDir") ?? ".annotate-for-agent/exports";
    const filename = buildFilename(format, /* @__PURE__ */ new Date(), generateSlug);
    const targetDir = vscode11.Uri.joinPath(workspace13.uri, dir);
    const targetFile = vscode11.Uri.joinPath(targetDir, filename);
    await vscode11.workspace.fs.createDirectory(targetDir);
    await vscode11.workspace.fs.writeFile(targetFile, Buffer.from(out, "utf8"));
    if (cfg.get("autoResolveOnExport")) {
      for (const a of selected)
        await store.update(a.id, { status: "resolved", exportedAt: Date.now() });
    } else {
      for (const a of selected)
        await store.update(a.id, { exportedAt: Date.now() });
    }
    const choice = await vscode11.window.showInformationMessage(
      `Exported ${selected.length} annotation(s) \u2192 ${filename}`,
      "Open file"
    );
    if (choice === "Open file") {
      await vscode11.window.showTextDocument(targetFile);
    }
  };
}

// src/commands/editAnnotation.ts
function saveAnnotationHandler(store) {
  return async (payload, mode) => {
    if (mode === "create") {
      const created = await store.create({
        filePath: payload.filePath,
        range: payload.range,
        category: payload.category,
        comment: payload.comment,
        status: "open",
        context: payload.context
      });
      return created;
    }
    if (!payload.id) {
      console.warn("[annotate-for-agent] save with mode=edit but no id on payload; skipping", payload);
      return void 0;
    }
    const updated = await store.update(payload.id, {
      category: payload.category,
      comment: payload.comment
    });
    return updated;
  };
}

// src/commands/quickCapture.ts
var vscode12 = __toESM(require("vscode"));
function buildCategoryItems(preferred) {
  const ordered = [preferred, ...CATEGORIES.filter((c) => c !== preferred)];
  return ordered.map((c, i) => {
    const meta = CATEGORY_META[c];
    return {
      label: `${i + 1}  \u25CF  ${c}`,
      description: meta.userHint,
      category: c
    };
  });
}
async function pickCategory(preferred, lineLabel, filePath) {
  return new Promise((resolve) => {
    const qp = vscode12.window.createQuickPick();
    qp.title = `Quick annotate \xB7 ${filePath}:${lineLabel}`;
    qp.placeholder = "Pick category \u2014 type 1\u20136 to select instantly \xB7 Esc to cancel";
    qp.items = buildCategoryItems(preferred);
    qp.matchOnDescription = true;
    qp.onDidChangeValue((val) => {
      if (/^[1-6]$/.test(val)) {
        const idx = parseInt(val, 10) - 1;
        if (idx < qp.items.length) {
          const chosen = qp.items[idx].category;
          qp.hide();
          resolve(chosen);
        }
      }
    });
    qp.onDidAccept(() => {
      const sel = qp.activeItems[0];
      qp.hide();
      resolve(sel?.category);
    });
    qp.onDidHide(() => {
      qp.dispose();
      resolve(void 0);
    });
    qp.show();
  });
}
function quickCaptureCommand(store, editorPanel) {
  return async () => {
    const active = vscode12.window.activeTextEditor;
    if (!active) {
      vscode12.window.showWarningMessage("Open a file first to quick-capture.");
      return;
    }
    const uri = active.document.uri;
    if (uri.scheme === "untitled") {
      vscode12.window.showWarningMessage("Save the file first to quick-capture.");
      return;
    }
    const range = active.selection;
    const filePath = vscode12.workspace.asRelativePath(uri);
    const lines = rangeToLines(range);
    const doc = active.document;
    const snippet = doc.getText(new vscode12.Range(lines.startLine - 1, 0, lines.endLine - 1, Number.MAX_SAFE_INTEGER));
    let context;
    if (uri.scheme === "git") {
      const diff = await captureDiffContext(uri, lines.startLine, lines.endLine);
      context = diff ?? { kind: "file", snippet, snippetHash: snippetHash(snippet) };
    } else {
      context = { kind: "file", snippet, snippetHash: snippetHash(snippet) };
    }
    const cfg = vscode12.workspace.getConfiguration("annotateForAgent");
    const preferred = cfg.get("quickCapture.defaultCategory") ?? DEFAULT_CATEGORY;
    const lineLabel = lines.endLine !== lines.startLine ? `${lines.startLine}-${lines.endLine}` : `${lines.startLine}`;
    const category = await pickCategory(preferred, lineLabel, filePath);
    if (!category)
      return;
    const result = await promptComment(category, filePath, lineLabel);
    if (result.kind === "cancel")
      return;
    if (result.kind === "escalate") {
      editorPanel.showCreate({ filePath, range: lines, context, initialComment: result.value, category });
      return;
    }
    const trimmed = result.value.trim();
    if (!trimmed) {
      vscode12.window.showWarningMessage("Empty comment, annotation not saved.");
      return;
    }
    await store.create({
      filePath,
      range: lines,
      category,
      comment: trimmed,
      status: "open",
      context
    });
    vscode12.window.showInformationMessage(`\u2713 ${category} annotation added.`);
  };
}
var activePrompt = null;
function escalateActiveQuickCapture() {
  if (!activePrompt)
    return;
  if (activePrompt.settled.v)
    return;
  activePrompt.settled.v = true;
  const value = activePrompt.ib.value;
  const resolve = activePrompt.resolve;
  activePrompt.ib.hide();
  resolve({ kind: "escalate", value });
}
function promptComment(category, filePath, lineLabel) {
  return new Promise((resolve) => {
    const ib = vscode12.window.createInputBox();
    ib.title = `${category} \xB7 ${filePath}:${lineLabel}`;
    ib.prompt = "Ctrl/\u2318+Enter to expand multi-line";
    ib.placeholder = "Off-by-one in loop bound";
    ib.ignoreFocusOut = false;
    const expandBtn = {
      iconPath: new vscode12.ThemeIcon("layout-panel"),
      tooltip: "Open multi-line editor (Ctrl/\u2318+Enter)"
    };
    ib.buttons = [expandBtn];
    const settled = { v: false };
    activePrompt = { ib, settled, resolve };
    void vscode12.commands.executeCommand("setContext", "annotateForAgent.quickCaptureActive", true);
    ib.onDidChangeValue((val) => {
      ib.validationMessage = val.length > 1e3 ? "Comment too long (max 1000 chars)." : void 0;
    });
    ib.onDidAccept(() => {
      if (settled.v)
        return;
      settled.v = true;
      const value = ib.value;
      ib.hide();
      resolve({ kind: "submit", value });
    });
    ib.onDidTriggerButton((btn) => {
      if (settled.v)
        return;
      if (btn === expandBtn) {
        settled.v = true;
        const value = ib.value;
        ib.hide();
        resolve({ kind: "escalate", value });
      }
    });
    ib.onDidHide(() => {
      ib.dispose();
      activePrompt = null;
      void vscode12.commands.executeCommand("setContext", "annotateForAgent.quickCaptureActive", false);
      if (!settled.v) {
        settled.v = true;
        resolve({ kind: "cancel" });
      }
    });
    ib.show();
  });
}

// src/commands/index.ts
function registerCommands(context, store, editorPanel) {
  const create = createAnnotationCommand(store, editorPanel);
  const quickCapture = quickCaptureCommand(store, editorPanel);
  const open = openAnnotationCommand(store, editorPanel);
  const del = deleteAnnotationHandler(store);
  const resolve = resolveAnnotationHandler(store);
  const copy = copyHandler(store);
  const doExport = exportHandler(store);
  const save = saveAnnotationHandler(store);
  context.subscriptions.push(
    vscode13.commands.registerCommand("annotateForAgent.createAnnotation", create),
    vscode13.commands.registerCommand("annotateForAgent.quickCapture", quickCapture),
    vscode13.commands.registerCommand("annotateForAgent.quickCaptureEscalate", () => escalateActiveQuickCapture()),
    vscode13.commands.registerCommand("annotateForAgent.openAnnotation", open),
    vscode13.commands.registerCommand("annotateForAgent.deleteAnnotation", del),
    vscode13.commands.registerCommand("annotateForAgent.resolveAnnotation", resolve),
    vscode13.commands.registerCommand("annotateForAgent.copy", copy),
    vscode13.commands.registerCommand("annotateForAgent.export", doExport),
    vscode13.commands.registerCommand("annotateForAgent.annotate", async (ctx) => {
      const mode = vscode13.workspace.getConfiguration("annotateForAgent").get("defaultMode") ?? "panel";
      if (mode === "quick")
        return quickCapture();
      return create(ctx);
    })
  );
  return { create, open, del, resolve, copy, doExport, save };
}

// src/extension.ts
async function activate(context) {
  const store = new AnnotationStore(context.workspaceState);
  await store.init();
  let handlers;
  const editorPanel = new EditorPanel(context.extensionUri, {
    onSave: async (payload, mode) => {
      const saved = await handlers.save(payload, mode);
      if (saved)
        editorPanel.showView(saved);
    },
    onCancel: () => {
    },
    onResolve: async (id) => {
      await handlers.resolve(id);
      const updated = store.get(id);
      if (updated)
        editorPanel.showView(updated);
    },
    onDelete: async (id) => {
      await handlers.del(id);
      if (!store.get(id)) {
        editorPanel.close();
      }
    },
    onCopy: async (id) => {
      await vscode14.commands.executeCommand("annotateForAgent.copy", [id]);
    },
    onExport: async (id) => {
      await vscode14.commands.executeCommand("annotateForAgent.export", [id]);
    }
  }, store);
  const decorations = new DecorationManager(context);
  const staleTracker = new StaleTracker(store);
  const refreshDecorations = () => {
    const showResolved = vscode14.workspace.getConfiguration("annotateForAgent").get("showResolved") ?? false;
    for (const ed of vscode14.window.visibleTextEditors) {
      decorations.refresh(ed, store.list(), showResolved);
    }
  };
  store.onDidChange(refreshDecorations);
  vscode14.window.onDidChangeActiveTextEditor(() => {
    refreshDecorations();
    listView.postState();
  });
  context.subscriptions.push(vscode14.window.onDidChangeVisibleTextEditors(refreshDecorations));
  const listView = new ListViewProvider(context.extensionUri, store, {
    open: (id) => vscode14.commands.executeCommand("annotateForAgent.openAnnotation", id),
    copy: (ids) => vscode14.commands.executeCommand("annotateForAgent.copy", ids),
    export: (ids) => vscode14.commands.executeCommand("annotateForAgent.export", ids),
    bulkResolve: async (ids, action) => {
      const targetStatus = action === "reopen" ? "open" : "resolved";
      for (const id of ids) {
        const a = store.get(id);
        if (a && a.status !== targetStatus)
          await store.update(id, { status: targetStatus });
      }
    },
    bulkDelete: async (ids) => {
      const ok = await vscode14.window.showWarningMessage(
        `Delete ${ids.length} annotation(s)?`,
        { modal: true },
        "Delete"
      );
      if (ok !== "Delete")
        return;
      for (const id of ids)
        await store.remove(id);
    }
  });
  context.subscriptions.push(
    vscode14.window.registerWebviewViewProvider(ListViewProvider.viewType, listView),
    { dispose: () => decorations.dispose() },
    { dispose: () => staleTracker.dispose() },
    vscode14.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("annotateForAgent")) {
        listView.postState();
        const showResolved = vscode14.workspace.getConfiguration("annotateForAgent").get("showResolved") ?? false;
        for (const ed of vscode14.window.visibleTextEditors) {
          decorations.refresh(ed, store.list(), showResolved);
        }
      }
    })
  );
  handlers = registerCommands(context, store, editorPanel);
  refreshDecorations();
  void showFirstRunWelcome(context);
  return { store };
}
var FIRST_RUN_KEY = "annotateForAgent.firstRunShown.v1";
async function showFirstRunWelcome(context) {
  if (context.globalState.get(FIRST_RUN_KEY))
    return;
  await context.globalState.update(FIRST_RUN_KEY, true);
  const open = "Open walkthrough";
  const dismiss = "Dismiss";
  const choice = await vscode14.window.showInformationMessage(
    "Annotate for Agent installed. Press Ctrl/Cmd+Shift+A to annotate code, or Ctrl/Cmd+Shift+Q for Quick mode.",
    open,
    dismiss
  );
  if (choice === open) {
    void vscode14.commands.executeCommand(
      "workbench.action.openWalkthrough",
      "creative-chaos.annotate-for-agent#getStarted",
      false
    );
  }
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
