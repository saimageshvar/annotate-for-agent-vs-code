import { ExportFormat } from '../store/types'

const EXT: Record<ExportFormat, string> = {
  markdown: 'md',
  json: 'json',
  csv: 'csv',
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function buildFilename(
  format: ExportFormat,
  now: Date,
  slugFn: () => string,
): string {
  const ts =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}-` +
    `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  return `${slugFn()}-${ts}.${EXT[format]}`
}
