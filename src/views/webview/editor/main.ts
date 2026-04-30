
declare const acquireVsCodeApi: () => { postMessage(msg: unknown): void }
const vscode = acquireVsCodeApi()

interface CategoryMeta { userHint: string; color: string }
type Mode = 'empty' | 'create' | 'view' | 'edit'
interface Annotation {
  id: string
  filePath: string
  range: { startLine: number; endLine: number }
  category: string
  comment: string
  status: 'open' | 'stale' | 'resolved'
  createdAt: number
  updatedAt: number
}

let mode: Mode = 'empty'
let annotation: Partial<Annotation> & { filePath?: string; range?: { startLine: number; endLine: number } } = {}
let categoryMeta: Record<string, CategoryMeta> = {}
let defaultCategory = 'Suggestion'

window.addEventListener('message', (event) => {
  const msg = event.data
  if (msg.type === 'init-create') {
    mode = 'create'
    annotation = {
      category: msg.defaultCategory,
      comment: msg.payload.initialComment ?? '',
      filePath: msg.payload.filePath,
      range: msg.payload.range,
    }
    defaultCategory = msg.defaultCategory
    categoryMeta = msg.categoryMeta
    ;(annotation as any).context = msg.payload.context
    render()
    requestAnimationFrame(() => {
      window.focus()
      const ta = document.getElementById('comment') as HTMLTextAreaElement | null
      ta?.focus()
    })
  } else if (msg.type === 'init-view') {
    mode = 'view'
    annotation = msg.annotation
    categoryMeta = msg.categoryMeta
    render()
  } else if (msg.type === 'reset') {
    mode = 'empty'
    annotation = {}
    render()
  } else if (msg.type === 'toast') {
    toast(msg.message, msg.kind ?? 'ok')
  } else if (msg.type === 'fileChosen') {
    insertFileRef(msg.path as string, msg.cursorAt as number)
  }
})

function insertFileRef(path: string, cursorAt: number) {
  const ta = document.getElementById('comment') as HTMLTextAreaElement | null
  if (!ta) return
  ta.focus()
  const at = Math.min(Math.max(0, cursorAt), ta.value.length)
  if (!path) {
    ta.setSelectionRange(at, at)
    return
  }
  const before = ta.value.slice(0, at)
  const after = ta.value.slice(at)
  ta.value = before + path + after
  annotation.comment = ta.value
  const pos = at + path.length
  ta.setSelectionRange(pos, pos)
}

function formatRange(a: { range?: { startLine: number; endLine: number } }): string {
  if (!a.range) return ''
  return a.range.endLine !== a.range.startLine ? `${a.range.startLine}-${a.range.endLine}` : `${a.range.startLine}`
}

function renderPath(filePath: string, range: { startLine: number; endLine: number } | undefined): string {
  const parts = filePath.split('/')
  const file = parts.pop() || filePath
  const dirs = parts.length ? parts.join('/') + '/' : ''
  const r = range ? (range.endLine !== range.startLine ? `${range.startLine}–${range.endLine}` : `${range.startLine}`) : ''
  return `
    ${dirs ? `<span class="path-dirs" title="${escapeHtml(filePath)}">${escapeHtml(dirs)}</span>` : ''}
    <span class="path-file">${escapeHtml(file)}</span>
    ${r ? `<span class="path-range">L${r}</span>` : ''}
  `
}

function formatAbsoluteTime(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function relativeTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function toast(msg: string, kind: 'ok' | 'err' = 'ok') {
  const el = document.createElement('div')
  el.className = `toast toast-${kind}`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => { el.classList.add('show') }, 10)
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300) }, 1500)
}

function render() {
  const app = document.getElementById('app')!
  if (mode === 'empty') {
    app.innerHTML = `
      <div class="empty">
        <div class="empty-glyph">✏️</div>
        <div class="empty-title">No annotation open</div>
        <div class="empty-body">Select code and click <strong>+</strong> to create a new annotation.</div>
      </div>
    `
    return
  }
  if (mode === 'view') {
    renderView(app)
    return
  }
  renderForm(app)
}

function renderView(app: HTMLElement) {
  const a = annotation as Annotation
  const meta = categoryMeta[a.category] ?? { color: '#888', userHint: '' }
  const isResolved = a.status === 'resolved'
  app.innerHTML = `
    <div class="view-meta">
      <div class="view-meta-row">
        <span class="tag" style="--tag-color:${meta.color}" title="${escapeHtml(meta.userHint)}">${a.category}</span>
        ${a.status === 'stale' ? '<span class="stale">⚠ stale</span>' : ''}
      </div>
      <div class="path" title="${escapeHtml(a.filePath)}:${formatRange(a)}">${renderPath(a.filePath, a.range)}</div>
      <div class="small-meta">
        <span>Created ${formatAbsoluteTime(a.createdAt)}</span>
        ${a.updatedAt !== a.createdAt ? `<span> · Updated ${relativeTime(a.updatedAt)}</span>` : ''}
      </div>
    </div>
    <div class="comment-card" style="--cat-color:${meta.color}">
      <div class="comment-text">${escapeHtml(a.comment || '(no comment)')}</div>
    </div>
    <div class="actions" role="toolbar" aria-label="Annotation actions">
      <button class="icon-btn" id="copy" title="Copy" aria-label="Copy">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M4 1.5A1.5 1.5 0 0 1 5.5 0h7A1.5 1.5 0 0 1 14 1.5v10a1.5 1.5 0 0 1-1.5 1.5H11v1.5A1.5 1.5 0 0 1 9.5 16h-7A1.5 1.5 0 0 1 1 14.5v-10A1.5 1.5 0 0 1 2.5 3H4V1.5zm1 1.5h4.5A1.5 1.5 0 0 1 11 4.5V11h1.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5V3zm-2.5 1a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-7z"/></svg>
        <span class="label">Copy</span>
      </button>
      <button class="icon-btn" id="export" title="Export" aria-label="Export">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 0l3.5 3.5-1 1L8.5 2.5v8h-1v-8L5.5 4.5l-1-1L8 0zM2 10h1v4h10v-4h1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4z"/></svg>
        <span class="label">Export</span>
      </button>
      <button class="icon-btn" id="resolve" title="${isResolved ? 'Reopen' : 'Mark resolved'}" aria-label="${isResolved ? 'Reopen' : 'Mark resolved'}">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3,8 7,12 13,4"/></svg>
        <span class="label">${isResolved ? 'Reopen' : 'Resolve'}</span>
      </button>
      <button class="icon-btn danger" id="delete" title="Delete" aria-label="Delete">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h10M6 4V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V4M5 4l.5 9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L11 4"/></svg>
        <span class="label">Delete</span>
      </button>
      <div class="action-spacer"></div>
      <button class="btn" id="edit">Edit</button>
    </div>
  `
  setTimeout(() => {
    document.querySelectorAll<HTMLElement>('.actions > *').forEach((el, i) => {
      el.style.animation = `afa-fade-up 260ms ${i * 40}ms ease-out both`
    })
  }, 0)
  document.getElementById('edit')!.addEventListener('click', () => { mode = 'edit'; render() })
  document.getElementById('copy')!.addEventListener('click', () => vscode.postMessage({ type: 'copy', id: a.id }))
  document.getElementById('export')!.addEventListener('click', () => vscode.postMessage({ type: 'export', id: a.id }))
  document.getElementById('resolve')!.addEventListener('click', () => vscode.postMessage({ type: 'resolve', id: a.id }))
  document.getElementById('delete')!.addEventListener('click', () => vscode.postMessage({ type: 'delete', id: a.id }))
}

const SUGGESTION_CATEGORIES = new Set(['Bug', 'Refactor', 'Nit', 'Suggestion'])

function renderForm(app: HTMLElement) {
  const cats = Object.keys(categoryMeta)
  const selected = annotation.category ?? defaultCategory
  const hint = categoryMeta[selected]?.userHint ?? ''
  const isEdit = mode === 'edit'
  const title = isEdit ? 'Edit annotation' : 'New annotation'
  const pathHtml = annotation.filePath ? renderPath(annotation.filePath, annotation.range) : ''
  const showSuggest = SUGGESTION_CATEGORIES.has(selected)
  const pillsHtml = cats.map((c, i) => {
    const meta = categoryMeta[c]
    const isSelected = c === selected
    const num = i + 1
    return `
      <button type="button" class="cat-pill ${isSelected ? 'selected' : ''}" role="radio" aria-checked="${isSelected}" data-cat="${escapeHtml(c)}" tabindex="${isSelected ? '0' : '-1'}" style="--cat-color:${meta.color}" title="${escapeHtml(meta.userHint)} (${num})">
        <span class="cat-dot-inline" style="background:${meta.color}"></span>
        <span class="cat-pill-label">${escapeHtml(c)}</span>
        <span class="cat-pill-key" aria-hidden="true">${num}</span>
      </button>
    `
  }).join('')
  app.innerHTML = `
    <div class="hero">
      <h1>${title}</h1>
      ${pathHtml ? `<div class="subtitle" title="${escapeHtml(annotation.filePath ?? '')}:${formatRange(annotation)}">${pathHtml}</div>` : ''}
    </div>
    <div class="field">
      <label id="cat-label">Category</label>
      <div class="cat-pills" role="radiogroup" aria-labelledby="cat-label">${pillsHtml}</div>
      <div class="hint" id="hint">${escapeHtml(hint)}</div>
    </div>
    <div class="field">
      <div class="comment-label-row">
        <label for="comment">Comment</label>
        <button type="button" class="suggest-link" id="insertSuggest" ${showSuggest ? '' : 'hidden'} title="Insert ${'```suggestion'} block at cursor">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>
          Insert suggestion
        </button>
      </div>
      <textarea id="comment" placeholder="Describe the issue, question, or suggestion..." autofocus>${escapeHtml(annotation.comment ?? '')}</textarea>
    </div>
    <div class="shortcuts" aria-hidden="true">
      <span class="shortcut-item"><span class="kbd">${isMac() ? '⌥' : 'Alt'}</span><span class="kbd">1–6</span><span class="shortcut-text">category</span></span>
      <span class="shortcut-item"><span class="kbd">${isMac() ? '⌘' : 'Ctrl'}</span><span class="kbd">↵</span><span class="shortcut-text">save</span></span>
      <span class="shortcut-item"><span class="kbd">Esc</span><span class="shortcut-text">cancel</span></span>
    </div>
    <div class="actions">
      <button class="btn secondary" id="cancel" title="Cancel (Esc)">Cancel</button>
      <button class="btn" id="save" title="Save (${isMac() ? '⌘' : 'Ctrl'}+Enter)">Save</button>
    </div>
  `
  wireCategoryPills(cats)
  const ta = document.getElementById('comment') as HTMLTextAreaElement
  ta.addEventListener('input', () => { annotation.comment = ta.value })
  ta.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      ;(document.getElementById('save') as HTMLButtonElement).click()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      ;(document.getElementById('cancel') as HTMLButtonElement).click()
    }
    if (e.key === '@' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      requestAnimationFrame(() => {
        const at = ta.selectionStart ?? ta.value.length
        vscode.postMessage({ type: 'pickFile', cursorAt: at })
      })
    }
  })
  const insertBtn = document.getElementById('insertSuggest')
  insertBtn?.addEventListener('click', () => insertSuggestionBlock(ta))
  document.getElementById('cancel')!.addEventListener('click', () => vscode.postMessage({ type: 'cancel' }))
  document.getElementById('save')!.addEventListener('click', () => vscode.postMessage({ type: 'save', payload: annotation, mode }))
}

let categoryGlobalKeyHandler: ((e: KeyboardEvent) => void) | null = null

function wireCategoryPills(cats: string[]) {
  const pills = Array.from(document.querySelectorAll<HTMLButtonElement>('.cat-pill'))
  if (pills.length === 0) return
  const selectIndex = (i: number, focus = true) => {
    const c = cats[i]
    if (!c) return
    annotation.category = c
    pills.forEach((p, idx) => {
      const sel = idx === i
      p.classList.toggle('selected', sel)
      p.setAttribute('aria-checked', sel ? 'true' : 'false')
      p.tabIndex = sel ? 0 : -1
    })
    const hintEl = document.getElementById('hint')
    if (hintEl) hintEl.textContent = categoryMeta[c]?.userHint ?? ''
    const insertBtn = document.getElementById('insertSuggest')
    if (insertBtn) {
      if (SUGGESTION_CATEGORIES.has(c)) insertBtn.removeAttribute('hidden')
      else insertBtn.setAttribute('hidden', '')
    }
    if (focus) pills[i].focus()
  }
  if (categoryGlobalKeyHandler) document.removeEventListener('keydown', categoryGlobalKeyHandler, true)
  categoryGlobalKeyHandler = (e: KeyboardEvent) => {
    if (!e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return
    if (!/^[1-9]$/.test(e.key)) return
    const target = parseInt(e.key, 10) - 1
    if (target < cats.length) {
      e.preventDefault()
      const active = document.activeElement as HTMLElement | null
      selectIndex(target, false)
      if (active && active !== document.body) active.focus()
    }
  }
  document.addEventListener('keydown', categoryGlobalKeyHandler, true)
  pills.forEach((pill, idx) => {
    pill.addEventListener('click', () => selectIndex(idx))
    pill.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); selectIndex((idx + 1) % cats.length) }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); selectIndex((idx - 1 + cats.length) % cats.length) }
      else if (e.key === 'Home') { e.preventDefault(); selectIndex(0) }
      else if (e.key === 'End') { e.preventDefault(); selectIndex(cats.length - 1) }
      else if (e.key.length === 1) {
        const ch = e.key.toLowerCase()
        if (/^[1-9]$/.test(ch)) {
          const target = parseInt(ch, 10) - 1
          if (target < cats.length) { e.preventDefault(); selectIndex(target) }
          return
        }
        const next = cats.findIndex((c, i) => i > idx && c.toLowerCase().startsWith(ch))
        const fallback = cats.findIndex(c => c.toLowerCase().startsWith(ch))
        const target = next >= 0 ? next : fallback
        if (target >= 0) { e.preventDefault(); selectIndex(target) }
      }
    })
  })
}

function insertSuggestionBlock(ta: HTMLTextAreaElement) {
  const ctx: any = (annotation as any).context
  const snippet: string = ctx?.snippet ?? ctx?.after ?? ''
  const start = ta.selectionStart ?? ta.value.length
  const end = ta.selectionEnd ?? start
  const before = ta.value.slice(0, start)
  const after = ta.value.slice(end)
  const needsLeadingNl = before.length > 0 && !before.endsWith('\n')
  const needsTrailingNl = after.length > 0 && !after.startsWith('\n')
  const block = `${needsLeadingNl ? '\n' : ''}\`\`\`suggestion\n${snippet}\n\`\`\`${needsTrailingNl ? '\n' : ''}`
  ta.value = before + block + after
  annotation.comment = ta.value
  const insertStart = before.length + (needsLeadingNl ? 1 : 0) + '```suggestion\n'.length
  const insertEnd = insertStart + snippet.length
  ta.focus()
  ta.setSelectionRange(insertStart, insertEnd)
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform)
}

vscode.postMessage({ type: 'ready' })
