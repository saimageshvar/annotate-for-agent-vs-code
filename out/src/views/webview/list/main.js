"use strict";
const vscode = acquireVsCodeApi();
let state = { annotations: [], categoryMeta: {}, settings: { includeCodeHunk: true, defaultFormat: 'markdown', showResolved: false } };
let selected = new Set();
let statusFilter = 'open';
window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'state') {
        state = msg.state;
        render();
    }
});
function filtered() {
    return state.annotations.filter(a => {
        if (statusFilter === 'all')
            return true;
        if (statusFilter === 'open')
            return a.status === 'open' || a.status === 'stale';
        return a.status === statusFilter;
    }).sort((a, b) => (state.categoryMeta[a.category]?.priority ?? 99) - (state.categoryMeta[b.category]?.priority ?? 99));
}
function render() {
    const app = document.getElementById('app');
    const list = filtered();
    const counts = {
        open: state.annotations.filter(a => a.status === 'open').length,
        stale: state.annotations.filter(a => a.status === 'stale').length,
    };
    app.innerHTML = `
    <div class="toolbar">
      <div style="font-size:11px;opacity:0.8">${counts.open} open · ${counts.stale} stale</div>
      <div class="filters">
        <label><input type="checkbox" id="selectAll"> Select all</label>
      </div>
      <div class="filters">
        <select id="statusFilter">
          <option value="open" ${statusFilter === 'open' ? 'selected' : ''}>Open</option>
          <option value="stale" ${statusFilter === 'stale' ? 'selected' : ''}>Stale</option>
          <option value="resolved" ${statusFilter === 'resolved' ? 'selected' : ''}>Resolved</option>
          <option value="all" ${statusFilter === 'all' ? 'selected' : ''}>All</option>
        </select>
        <label><input type="checkbox" id="includeHunk" ${state.settings.includeCodeHunk ? 'checked' : ''}> Include code hunk</label>
      </div>
      <div class="filters">
        <select id="format">
          <option value="markdown" ${state.settings.defaultFormat === 'markdown' ? 'selected' : ''}>Markdown</option>
          <option value="json" ${state.settings.defaultFormat === 'json' ? 'selected' : ''}>JSON</option>
          <option value="csv" ${state.settings.defaultFormat === 'csv' ? 'selected' : ''}>CSV</option>
        </select>
        <button class="pill" id="copy">Copy</button>
        <button class="pill" id="export">Export</button>
      </div>
    </div>
    ${list.length === 0 ? '<div class="empty">No annotations. Select code and click + to add one.</div>' : ''}
    ${list.map(a => renderCard(a)).join('')}
  `;
    document.getElementById('selectAll').addEventListener('change', (e) => {
        const on = e.target.checked;
        selected = on ? new Set(list.map(a => a.id)) : new Set();
        render();
    });
    document.getElementById('statusFilter').addEventListener('change', (e) => {
        statusFilter = e.target.value;
        render();
    });
    document.getElementById('includeHunk').addEventListener('change', (e) => {
        vscode.postMessage({ type: 'setSetting', key: 'includeCodeHunk', value: e.target.checked });
    });
    document.getElementById('format').addEventListener('change', (e) => {
        vscode.postMessage({ type: 'setSetting', key: 'defaultFormat', value: e.target.value });
    });
    document.getElementById('copy').addEventListener('click', () => {
        vscode.postMessage({ type: 'copy', ids: Array.from(selected.size ? selected : list.map(a => a.id)) });
    });
    document.getElementById('export').addEventListener('click', () => {
        vscode.postMessage({ type: 'export', ids: Array.from(selected.size ? selected : list.map(a => a.id)) });
    });
    document.querySelectorAll('[data-card-id]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT')
                return;
            vscode.postMessage({ type: 'open', id: el.dataset.cardId });
        });
    });
    document.querySelectorAll('[data-check-id]').forEach(el => {
        el.addEventListener('change', () => {
            if (el.checked)
                selected.add(el.dataset.checkId);
            else
                selected.delete(el.dataset.checkId);
        });
    });
}
function renderCard(a) {
    const meta = state.categoryMeta[a.category] ?? { color: '#888', userHint: '', priority: 99 };
    const first = (a.comment.split('\n')[0] || '').slice(0, 80);
    return `
    <div class="card ${a.status === 'resolved' ? 'resolved' : ''}" data-card-id="${a.id}">
      <input type="checkbox" class="checkbox" data-check-id="${a.id}" ${selected.has(a.id) ? 'checked' : ''}>
      <div class="body">
        <div class="first-line">${a.status === 'stale' ? '<span class="stale-badge" title="Stale">⚠</span>' : ''}${escapeHtml(first)}</div>
        <div class="meta">
          <span class="tag" style="background:${meta.color}" title="${escapeHtml(meta.userHint)}">${a.category}</span>
          <span>${escapeHtml(a.filePath)}:${a.range.startLine}${a.range.endLine !== a.range.startLine ? '-' + a.range.endLine : ''}</span>
        </div>
      </div>
    </div>
  `;
}
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
vscode.postMessage({ type: 'ready' });
//# sourceMappingURL=main.js.map