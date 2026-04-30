const ADJECTIVES = [
  'swift', 'quiet', 'bright', 'gentle', 'fierce', 'calm', 'bold', 'shy', 'wise', 'clever',
  'brave', 'kind', 'sharp', 'gentle', 'smooth', 'steady', 'nimble', 'silent', 'lively', 'humble',
  'proud', 'eager', 'patient', 'cheerful', 'noble', 'loyal', 'curious', 'graceful', 'mellow', 'keen',
]

const ANIMALS = [
  'otter', 'fox', 'hawk', 'wolf', 'bear', 'deer', 'owl', 'lynx', 'falcon', 'raven',
  'badger', 'heron', 'eagle', 'stag', 'mink', 'ibex', 'panda', 'puma', 'tapir', 'sable',
  'crane', 'swan', 'moth', 'finch', 'marten', 'salmon', 'ermine', 'kestrel', 'pangolin', 'civet',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateSlug(): string {
  return `${pick(ADJECTIVES)}-${pick(ANIMALS)}`
}
