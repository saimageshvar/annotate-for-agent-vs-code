import { createHash } from 'node:crypto'

export function snippetHash(snippet: string): string {
  const normalized = snippet.replace(/\r\n/g, '\n').trim()
  return createHash('sha1').update(normalized).digest('hex')
}
