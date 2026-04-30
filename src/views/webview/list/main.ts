import { renderCombobox, wireCombobox } from '../shared/combobox'

declare const acquireVsCodeApi: () => { postMessage(msg: unknown): void }
const vscode = acquireVsCodeApi()

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

interface State {
  annotations: Annotation[]
  categoryMeta: Record<string, { userHint: string; color: string; priority: number }>
  settings: { includeCodeHunk: boolean; defaultFormat: 'markdown' | 'json' | 'csv'; showResolved: boolean; filterCurrentFile: boolean }
  currentFile?: string
}

let state: State = { annotations: [], categoryMeta: {}, settings: { includeCodeHunk: true, defaultFormat: 'markdown', showResolved: false, filterCurrentFile: false }, currentFile: undefined }
let selected = new Set<string>()
let statusFilter: 'open' | 'stale' | 'resolved' | 'all' = 'open'
let activeAnnotationId: string | null = null
let groupBy: 'none' | 'file' | 'category' | 'status' = 'none'
let collapsedGroups = new Set<string>()
let prevCardIds = new Set<string>()

window.addEventListener('message', (event) => {
  const msg = event.data
  if (msg.type === 'state') { state = msg.state; render() }
})

function relativeTime(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function filtered(): Annotation[] {
  let list = state.annotations
  if (state.settings.filterCurrentFile && state.currentFile) {
    list = list.filter(a => a.filePath === state.currentFile)
  }
  return list.filter(a => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'open') return a.status === 'open' || a.status === 'stale'
    return a.status === statusFilter
  }).sort((a, b) => (state.categoryMeta[a.category]?.priority ?? 99) - (state.categoryMeta[b.category]?.priority ?? 99))
}

function render() {
  const app = document.getElementById('app')!
  const list = filtered()
  const allSelected = list.length > 0 && list.every(a => selected.has(a.id))
  const selectedCount = list.filter(a => selected.has(a.id)).length
  const openCount = state.annotations.filter(a => a.status === 'open').length
  const staleCount = state.annotations.filter(a => a.status === 'stale').length
  const resolvedCount = state.annotations.filter(a => a.status === 'resolved').length
  const counts = { open: openCount, stale: staleCount }

  const statusOptions = [
    { value: 'open', label: `Open (${openCount + staleCount})` },
    { value: 'stale', label: `Stale (${staleCount})` },
    { value: 'resolved', label: `Resolved (${resolvedCount})` },
    { value: 'all', label: `All (${state.annotations.length})` },
  ]
  const groupOptions = [
    { value: 'none', label: 'No grouping' },
    { value: 'file', label: 'Group by file' },
    { value: 'category', label: 'Group by category' },
    { value: 'status', label: 'Group by status' },
  ]
  const formatOptions = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'json', label: 'JSON' },
    { value: 'csv', label: 'CSV' },
  ]

  app.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-row primary-row">
        ${renderCombobox({ id: 'statusFilter', options: statusOptions, value: statusFilter, onChange: (v) => { statusFilter = v as any; activeAnnotationId = null; render() } })}
        ${renderCombobox({ id: 'groupBy', options: groupOptions, value: groupBy, onChange: (v) => { groupBy = v as any; render() } })}
        ${counts.stale > 0 ? `<span class="stale-count" title="${counts.stale} stale">⚠ ${counts.stale}</span>` : ''}
      </div>
      <div class="toolbar-row select-row">
        <label class="check-label"><input type="checkbox" id="selectAll" ${allSelected ? 'checked' : ''}><span>Select all (${list.length})</span></label>
        <label class="check-label"><input type="checkbox" id="currentFileOnly" ${state.settings.filterCurrentFile?'checked':''}><span>Current file</span></label>
        <label class="check-label"><input type="checkbox" id="includeHunk" ${state.settings.includeCodeHunk?'checked':''}><span>Include hunk</span></label>
      </div>
      <div class="toolbar-row action-row">
        ${renderCombobox({ id: 'format', options: formatOptions, value: state.settings.defaultFormat, onChange: (v) => vscode.postMessage({ type: 'setSetting', key: 'defaultFormat', value: v }) })}
        <span class="action-count" aria-live="polite">${selectedCount > 0 ? `${selectedCount} selected` : ''}</span>
        <div class="action-buttons">
          <button class="pill" id="copy" ${selected.size === 0 ? 'disabled' : ''} title="Copy selection" aria-label="Copy">
            <svg class="pill-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4 1.5A1.5 1.5 0 0 1 5.5 0h7A1.5 1.5 0 0 1 14 1.5v10a1.5 1.5 0 0 1-1.5 1.5H11v1.5A1.5 1.5 0 0 1 9.5 16h-7A1.5 1.5 0 0 1 1 14.5v-10A1.5 1.5 0 0 1 2.5 3H4V1.5zm1 1.5h4.5A1.5 1.5 0 0 1 11 4.5V11h1.5a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-7a.5.5 0 0 0-.5.5V3zm-2.5 1a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-7z"/></svg>
            <span class="pill-label">Copy</span>
          </button>
          <button class="pill primary" id="export" ${selected.size === 0 ? 'disabled' : ''} title="Export selection" aria-label="Export">
            <svg class="pill-icon" width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0l3.5 3.5-1 1L8.5 2.5v8h-1v-8L5.5 4.5l-1-1L8 0zM2 10h1v4h10v-4h1v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-4z"/></svg>
            <span class="pill-label">Export</span>
          </button>
          <button class="pill" id="bulkResolve" ${selected.size === 0 ? 'disabled' : ''} title="${statusFilter === 'resolved' ? 'Reopen' : 'Resolve'}" aria-label="${statusFilter === 'resolved' ? 'Reopen' : 'Resolve'}">
            <svg class="pill-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3,8 7,12 13,4"/></svg>
            <span class="pill-label">${statusFilter === 'resolved' ? 'Reopen' : 'Resolve'}</span>
          </button>
          <button class="pill danger" id="bulkDelete" ${selected.size === 0 ? 'disabled' : ''} title="Delete" aria-label="Delete">
            <svg class="pill-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h10M6 4V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V4M5 4l.5 9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1L11 4"/></svg>
            <span class="pill-label">Delete</span>
          </button>
        </div>
      </div>
    </div>
    <div class="cards">
      ${renderCards(list)}
    </div>
  `

  document.querySelectorAll<HTMLElement>('.card.fresh').forEach((el, i) => {
    el.style.animationDelay = `${Math.min(i * 30, 240)}ms`
  })
  prevCardIds = new Set(state.annotations.map(a => a.id))

  const toolbar = document.querySelector<HTMLElement>('.toolbar')
  if (toolbar) {
    const onScroll = () => toolbar.classList.toggle('scrolled', window.scrollY > 4)
    window.removeEventListener('scroll', (window as any).__afaScroll)
    ;(window as any).__afaScroll = onScroll
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  document.getElementById('selectAll')!.addEventListener('change', () => {
    if (allSelected) selected = new Set()
    else selected = new Set(list.map(a => a.id))
    render()
  })
  document.getElementById('bulkResolve')!.addEventListener('click', () => {
    if (selected.size === 0) return
    const action = statusFilter === 'resolved' ? 'reopen' : 'resolve'
    vscode.postMessage({ type: 'bulkResolve', ids: Array.from(selected), action })
    selected = new Set()
    render()
  })
  document.getElementById('bulkDelete')!.addEventListener('click', () => {
    if (selected.size === 0) return
    vscode.postMessage({ type: 'bulkDelete', ids: Array.from(selected) })
    selected = new Set()
  })
  wireCombobox({ id: 'statusFilter', options: statusOptions, value: statusFilter, onChange: (v) => { statusFilter = v as any; activeAnnotationId = null; render() } })
  wireCombobox({ id: 'groupBy', options: groupOptions, value: groupBy, onChange: (v) => { groupBy = v as any; render() } })
  wireCombobox({ id: 'format', options: formatOptions, value: state.settings.defaultFormat, onChange: (v) => vscode.postMessage({ type: 'setSetting', key: 'defaultFormat', value: v }) })

  document.getElementById('currentFileOnly')!.addEventListener('change', (e) => {
    vscode.postMessage({ type: 'setSetting', key: 'filterCurrentFile', value: (e.target as HTMLInputElement).checked })
  })
  document.getElementById('includeHunk')!.addEventListener('change', (e) => {
    vscode.postMessage({ type: 'setSetting', key: 'includeCodeHunk', value: (e.target as HTMLInputElement).checked })
  })
  document.getElementById('copy')!.addEventListener('click', () => {
    if (selected.size === 0) {
      vscode.postMessage({ type: 'notice', text: 'Select annotations first.' })
      return
    }
    vscode.postMessage({ type: 'copy', ids: Array.from(selected) })
  })
  document.getElementById('export')!.addEventListener('click', () => {
    if (selected.size === 0) {
      vscode.postMessage({ type: 'notice', text: 'Select annotations first.' })
      return
    }
    vscode.postMessage({ type: 'export', ids: Array.from(selected) })
  })
  document.querySelectorAll<HTMLElement>('.group-header').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.group!
      if (collapsedGroups.has(key)) collapsedGroups.delete(key)
      else collapsedGroups.add(key)
      render()
    })
  })
  document.querySelectorAll<HTMLElement>('[data-card-id]').forEach(el => {
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      activeAnnotationId = el.dataset.cardId ?? null
      vscode.postMessage({ type: 'open', id: el.dataset.cardId })
      document.querySelectorAll('.card').forEach(c => c.classList.remove('active-selection'))
      el.classList.add('active-selection')
    })
    el.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        activeAnnotationId = el.dataset.cardId ?? null
        vscode.postMessage({ type: 'open', id: el.dataset.cardId })
        document.querySelectorAll('.card').forEach(c => c.classList.remove('active-selection'))
        el.classList.add('active-selection')
      }
    })
  })
  document.querySelectorAll<HTMLInputElement>('[data-check-id]').forEach(el => {
    el.addEventListener('change', (ev) => {
      ev.stopPropagation()
      if (el.checked) selected.add(el.dataset.checkId!)
      else selected.delete(el.dataset.checkId!)
      render()
    })
    el.addEventListener('click', (ev) => ev.stopPropagation())
  })
}

function renderCards(list: Annotation[]): string {
  if (list.length === 0) return `
    <div class="empty">
      <div class="empty-glyph">💬</div>
      <div class="empty-title">No annotations yet</div>
      <div class="empty-body">Select code in the editor and click <strong>+</strong>, or right-click → Annotate for Agent.</div>
    </div>
  `
  if (groupBy === 'none') return list.map(a => renderCard(a)).join('')
  const groups = groupAnnotations(list, groupBy)
  return groups.map(([key, items]) => {
    const isCollapsed = collapsedGroups.has(key)
    return `
      <div class="group">
        <div class="group-header" data-group="${escapeHtml(key)}">
          <span class="group-chevron">${isCollapsed ? '▸' : '▾'}</span>
          <span class="group-label">${escapeHtml(groupLabel(key, groupBy))}</span>
          <span class="group-count">${items.length}</span>
        </div>
        ${isCollapsed ? '' : `<div class="group-items">${items.map(a => renderCard(a)).join('')}</div>`}
      </div>
    `
  }).join('')
}

function groupAnnotations(list: Annotation[], by: 'file' | 'category' | 'status'): Array<[string, Annotation[]]> {
  const map = new Map<string, Annotation[]>()
  for (const a of list) {
    const key = by === 'file' ? a.filePath : by === 'category' ? a.category : a.status
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(a)
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
}

function groupLabel(key: string, by: 'none' | 'file' | 'category' | 'status'): string {
  if (by === 'file') return key.split('/').slice(-2).join('/')
  return key
}

function renderCard(a: Annotation): string {
  const meta = state.categoryMeta[a.category] ?? { color: '#888', userHint: '', priority: 99 }
  const first = (a.comment.split('\n')[0] || '(no comment)').slice(0, 140)
  const shortPath = a.filePath.split('/').slice(-2).join('/')
  const lineRange = a.range.endLine !== a.range.startLine ? `${a.range.startLine}-${a.range.endLine}` : `${a.range.startLine}`
  const isExternal = a.filePath.startsWith('/') || /^[a-zA-Z]:\\/.test(a.filePath)
  const isActive = a.id === activeAnnotationId
  const timeStr = a.updatedAt ? relativeTime(a.updatedAt) : ''
  const isFresh = !prevCardIds.has(a.id)
  return `
    <div class="card ${a.status === 'resolved' ? 'resolved' : ''} ${isActive ? 'active-selection' : ''} ${isFresh ? 'fresh' : ''}" data-card-id="${a.id}" tabindex="0" role="button" aria-label="Annotation: ${escapeHtml(first)}">
      <input type="checkbox" class="checkbox" data-check-id="${a.id}" ${selected.has(a.id) ? 'checked' : ''} aria-label="Select annotation">
      <div class="body">
        <div class="first-line">${a.status === 'stale' ? '<span class="stale-badge" title="Stale">⚠ stale</span>' : ''}${escapeHtml(first)}</div>
        <div class="meta">
          <span class="tag" style="--tag-color:${meta.color}" title="${escapeHtml(meta.userHint)}">${a.category}</span>
          <span class="path" title="${escapeHtml(a.filePath)}:${lineRange}"><svg class="path-icon" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5.5 1.5h4.379a1.5 1.5 0 0 1 1.06.44l2.121 2.12a1.5 1.5 0 0 1 .44 1.061V13.5A1.5 1.5 0 0 1 12 15H5.5A1.5 1.5 0 0 1 4 13.5v-10A2 2 0 0 1 5.5 1.5zm4.5 1.586V5h2.086L10 3.086z"/></svg><span class="path-label">${escapeHtml(shortPath)}:${lineRange}</span></span>
          ${isExternal ? '<span class="ext-badge" title="Outside workspace">↗</span>' : ''}
          ${timeStr ? `<span class="time">${timeStr}</span>` : ''}
        </div>
      </div>
    </div>
  `
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}

vscode.postMessage({ type: 'ready' })
