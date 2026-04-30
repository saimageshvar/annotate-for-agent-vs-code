"use strict";
const vscode = acquireVsCodeApi();
let mode = 'empty';
let annotation = {};
let categoryMeta = {};
let defaultCategory = 'Suggestion';
window.addEventListener('message', (event) => {
    const msg = event.data;
    if (msg.type === 'init-create') {
        mode = 'create';
        annotation = { category: msg.defaultCategory, comment: '' };
        defaultCategory = msg.defaultCategory;
        categoryMeta = msg.categoryMeta;
        Object.assign(annotation, msg.payload);
        render();
    }
    else if (msg.type === 'init-view') {
        mode = 'view';
        annotation = msg.annotation;
        categoryMeta = msg.categoryMeta;
        render();
    }
    else if (msg.type === 'reset') {
        mode = 'empty';
        annotation = {};
        render();
    }
});
function render() {
    const app = document.getElementById('app');
    if (mode === 'empty') {
        app.innerHTML = `<div class="empty">Click + in the editor to add an annotation.</div>`;
        return;
    }
    if (mode === 'view') {
        renderView(app);
        return;
    }
    renderForm(app);
}
function renderView(app) {
    const a = annotation;
    const meta = categoryMeta[a.category] ?? { color: '#888', userHint: '' };
    app.innerHTML = `
    <div class="meta">
      <span style="background:${meta.color};color:#fff;padding:2px 8px;border-radius:8px">${a.category}</span>
      ${a.status === 'stale' ? '<span class="stale"> ⚠ stale</span>' : ''}
      <div>${a.filePath}:${a.range.startLine}-${a.range.endLine}</div>
    </div>
    <div class="field"><div>${escapeHtml(a.comment)}</div></div>
    <div class="actions">
      <button class="btn secondary" id="delete">Delete</button>
      <button class="btn secondary" id="resolve">${a.status === 'resolved' ? 'Reopen' : 'Mark resolved'}</button>
      <button class="btn" id="edit">Edit</button>
    </div>
  `;
    document.getElementById('edit').addEventListener('click', () => { mode = 'edit'; render(); });
    document.getElementById('resolve').addEventListener('click', () => vscode.postMessage({ type: 'resolve', id: a.id }));
    document.getElementById('delete').addEventListener('click', () => vscode.postMessage({ type: 'delete', id: a.id }));
}
function renderForm(app) {
    const cats = Object.keys(categoryMeta);
    const selected = annotation.category ?? defaultCategory;
    const hint = categoryMeta[selected]?.userHint ?? '';
    app.innerHTML = `
    <div class="field">
      <label>Category</label>
      <select id="cat">${cats.map(c => `<option value="${c}" ${c === selected ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <div class="hint" id="hint">${escapeHtml(hint)}</div>
    </div>
    <div class="field">
      <label>Comment</label>
      <textarea id="comment" autofocus>${escapeHtml(annotation.comment ?? '')}</textarea>
    </div>
    <div class="actions">
      <button class="btn secondary" id="cancel">Cancel</button>
      <button class="btn" id="save">Save</button>
    </div>
  `;
    const catSel = document.getElementById('cat');
    catSel.addEventListener('change', () => {
        annotation.category = catSel.value;
        (document.getElementById('hint')).textContent = categoryMeta[catSel.value]?.userHint ?? '';
    });
    const ta = document.getElementById('comment');
    ta.addEventListener('input', () => { annotation.comment = ta.value; });
    document.getElementById('cancel').addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));
    document.getElementById('save').addEventListener('click', () => vscode.postMessage({ type: 'save', payload: annotation, mode }));
}
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
vscode.postMessage({ type: 'ready' });
//# sourceMappingURL=main.js.map