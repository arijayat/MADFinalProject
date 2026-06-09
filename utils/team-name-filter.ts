const LEET_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

const BLOCKED_TERMS = [
  'arsehole',
  'asshole',
  'bastard',
  'bitch',
  'bullshit',
  'cock',
  'cunt',
  'dick',
  'douche',
  'fuck',
  'motherfucker',
  'nigga',
  'nigger',
  'piss',
  'porn',
  'pussy',
  'shit',
  'slut',
  'whore',
  'anjing',
  'bangsat',
  'bego',
  'goblok',
  'kontol',
  'memek',
  'pepek',
  'puki',
  'tolol',
];

function normalizeTeamName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[013457@$!]/g, (char) => LEET_MAP[char] ?? char)
    .replace(/(.)\1{2,}/g, '$1$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function hasBlockedTeamNameWords(value: string): boolean {
  const normalized = normalizeTeamName(value);
  if (!normalized) return false;

  const tokens = normalized.split(/\s+/);
  const compact = tokens.join('');

  return BLOCKED_TERMS.some((term) => {
    const normalizedTerm = normalizeTeamName(term);
    return tokens.includes(normalizedTerm) || compact.includes(normalizedTerm);
  });
}

export function validateTeamName(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Team name cannot be empty.');
  }
  if (hasBlockedTeamNameWords(trimmed)) {
    throw new Error('Choose a different team name. Offensive words are not allowed.');
  }
  return trimmed;
}
