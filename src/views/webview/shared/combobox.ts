export interface ComboboxOption {
  value: string
  label: string
  leading?: string  // HTML prefix (e.g. colored dot span)
}

export interface ComboboxConfig {
  id: string
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function renderCombobox(cfg: ComboboxConfig): string {
  const current = cfg.options.find(o => o.value === cfg.value) ?? cfg.options[0]
  return `
    <div class="combobox ${cfg.className ?? ''}" data-combobox-id="${cfg.id}">
      <button type="button" class="combobox-trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" data-combobox-trigger="${cfg.id}">
        <span class="combobox-value">
          ${current?.leading ?? ''}
          <span class="combobox-label">${escapeHtml(current?.label ?? '')}</span>
        </span>
        <svg class="combobox-chevron" aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,4 5,7 8,4"/></svg>
      </button>
      <div class="combobox-menu" role="listbox" hidden data-combobox-menu="${cfg.id}">
        ${cfg.options.map(o => `
          <div class="combobox-option" role="option" data-value="${escapeHtml(o.value)}" aria-selected="${o.value === cfg.value ? 'true' : 'false'}">
            ${o.leading ?? ''}
            <span class="combobox-option-label">${escapeHtml(o.label)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]!))
}

export function wireCombobox(cfg: ComboboxConfig): void {
  const trigger = document.querySelector<HTMLElement>(`[data-combobox-trigger="${cfg.id}"]`)
  const menu = document.querySelector<HTMLElement>(`[data-combobox-menu="${cfg.id}"]`)
  if (!trigger || !menu) return

  const options = Array.from(menu.querySelectorAll<HTMLElement>('.combobox-option'))
  let activeIndex = Math.max(0, cfg.options.findIndex(o => o.value === cfg.value))

  const open = () => {
    menu.removeAttribute('hidden')
    trigger.setAttribute('aria-expanded', 'true')
    setActive(activeIndex)
    setTimeout(() => {
      document.addEventListener('click', onOutside, true)
      document.addEventListener('keydown', onKey, true)
    }, 0)
  }
  const close = () => {
    menu.setAttribute('hidden', '')
    trigger.setAttribute('aria-expanded', 'false')
    document.removeEventListener('click', onOutside, true)
    document.removeEventListener('keydown', onKey, true)
  }
  const onOutside = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && !trigger.contains(e.target as Node)) close()
  }
  const setActive = (i: number) => {
    activeIndex = Math.max(0, Math.min(options.length - 1, i))
    options.forEach((el, idx) => {
      el.classList.toggle('active', idx === activeIndex)
      if (idx === activeIndex) el.scrollIntoView({ block: 'nearest' })
    })
  }
  const pick = (i: number) => {
    const val = cfg.options[i]?.value
    if (val === undefined) return
    cfg.onChange(val)
    close()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); return }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(activeIndex); return }
    if (e.key.length === 1) {
      const ch = e.key.toLowerCase()
      const next = cfg.options.findIndex((o, idx) => idx > activeIndex && o.label.toLowerCase().startsWith(ch))
      const fallback = cfg.options.findIndex(o => o.label.toLowerCase().startsWith(ch))
      const target = next >= 0 ? next : fallback
      if (target >= 0) setActive(target)
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    if (menu.hasAttribute('hidden')) open()
    else close()
  })
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      open()
    }
  })
  options.forEach((el, idx) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      pick(idx)
    })
    el.addEventListener('mouseenter', () => setActive(idx))
  })
}
