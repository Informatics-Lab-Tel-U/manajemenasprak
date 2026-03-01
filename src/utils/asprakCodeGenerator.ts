/**
 * Asprak Code Generator
 *
 * Implements the 3-letter code generation algorithm as specified in
 * docs/md/sistem_kode_asprak.md
 *
 * Rules Summary:
 * - Code is EXACTLY 3 uppercase letters (no numbers)
 * - Code must be derived from letters in the name
 * - Multi-phase generation: Standard Rules → Strategic Fallback → Full Fallback
 *
 * @module utils/asprakCodeGenerator
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CodeGenerationResult {
  code: string;
  rule: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Sanitize a name for code generation:
 * - Uppercase
 * - Remove non-alpha characters (except spaces)
 * - Remove extra spaces
 * - Remove common prefixes (bin, binti, etc.)
 */
function sanitizeName(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split sanitized name into words */
export function getWords(name: string): string[] {
  return sanitizeName(name).split(' ').filter(Boolean);
}

/** Safe charAt — returns empty string if out of bounds */
function safeChar(word: string, index: number): string {
  return index < word.length ? word[index] : '';
}

/** Last character of a word */
function lastChar(word: string): string {
  return word.length > 0 ? word[word.length - 1] : '';
}

/** Middle character of a word (floor midpoint) */
function midChar(word: string): string {
  if (word.length < 3) return safeChar(word, 1);
  return word[Math.floor(word.length / 2)];
}

/** Check if a code is valid (exactly 3 uppercase letters) */
function isValidCode(code: string): boolean {
  return /^[A-Z]{3}$/.test(code);
}

/** Generate C(n,3) combinations from an array of characters */
function combinations3(chars: string[]): string[] {
  const results: string[] = [];
  const n = chars.length;
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        results.push(chars[i] + chars[j] + chars[k]);
      }
    }
  }
  return results;
}

/** Get unique characters from a string, preserving order of first appearance */
function uniqueChars(str: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const ch of str) {
    if (/[A-Z]/.test(ch) && !seen.has(ch)) {
      seen.add(ch);
      result.push(ch);
    }
  }
  return result;
}

// ─── Standard Rules per Word Count ───────────────────────────────────────────

export function rulesFor1Word(words: string[]): string[] {
  const w = words[0];
  const candidates: string[] = [];

  // 1.1: Three first letters
  candidates.push(safeChar(w, 0) + safeChar(w, 1) + safeChar(w, 2));
  // 1.2: char 1, 2, 4
  candidates.push(safeChar(w, 0) + safeChar(w, 1) + safeChar(w, 3));
  // 1.3: char 1, 3, 4
  candidates.push(safeChar(w, 0) + safeChar(w, 2) + safeChar(w, 3));
  // 1.4: char 1, 2, last
  candidates.push(safeChar(w, 0) + safeChar(w, 1) + lastChar(w));

  return candidates;
}

export function rulesFor2Words(words: string[]): string[] {
  const [w1, w2] = words;
  const candidates: string[] = [];

  // 2.1: first2(w1) + first(w2)
  candidates.push(safeChar(w1, 0) + safeChar(w1, 1) + safeChar(w2, 0));
  // 2.2: first(w1) + first2(w2)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + safeChar(w2, 1));
  // 2.3: first(w1) + first(w2) + last(w2)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + lastChar(w2));
  // 2.4: first2(w1) + last(w2)
  candidates.push(safeChar(w1, 0) + safeChar(w1, 1) + lastChar(w2));

  return candidates;
}

export function rulesFor3Words(words: string[]): string[] {
  const [w1, w2, w3] = words;
  const candidates: string[] = [];

  // 3.1: first of each word
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + safeChar(w3, 0));
  // 3.2: first(w1) + first2(w2)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + safeChar(w2, 1));
  // 3.3: first2(w1) + first(w2)
  candidates.push(safeChar(w1, 0) + safeChar(w1, 1) + safeChar(w2, 0));
  // 3.4: first(w1) + first(w2) + second(w3)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + safeChar(w3, 1));
  // 3.5: first(w1) + first2(w3)
  candidates.push(safeChar(w1, 0) + safeChar(w3, 0) + safeChar(w3, 1));
  // 3.6: first2(w1) + first(w3)
  candidates.push(safeChar(w1, 0) + safeChar(w1, 1) + safeChar(w3, 0));
  // 3.7: first(w1) + first(w2) + last(w3)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + lastChar(w3));
  // 3.8: first(w1) + second(w2) + first(w3)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 1) + safeChar(w3, 0));

  return candidates;
}

function rulesForNWords(words: string[]): string[] {
  const w1 = words[0];
  const w2 = words[1];
  const wLast = words[words.length - 1];
  const wMid = words[Math.floor(words.length / 2)];
  const candidates: string[] = [];

  // N.1: first of first 3 words
  candidates.push(safeChar(words[0], 0) + safeChar(words[1], 0) + safeChar(words[2], 0));
  // N.2: first(w1), first(w2), first(wLast)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + safeChar(wLast, 0));
  // N.3: first(w1) + first2(w2)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + safeChar(w2, 1));
  // N.4: first(w1), first(wMid), first(wLast)
  candidates.push(safeChar(w1, 0) + safeChar(wMid, 0) + safeChar(wLast, 0));
  // N.5: first2(w1) + first(wLast)
  candidates.push(safeChar(w1, 0) + safeChar(w1, 1) + safeChar(wLast, 0));
  // N.6: first(w1) + first(w2) + second(wLast)
  candidates.push(safeChar(w1, 0) + safeChar(w2, 0) + safeChar(wLast, 1));

  return candidates;
}

// ─── Fallback: Strategic Positions ───────────────────────────────────────────

function getStrategicPool(words: string[]): string[] {
  const pool: string[] = [];
  for (const word of words) {
    if (word.length > 0) pool.push(safeChar(word, 0));
    if (word.length > 1) pool.push(safeChar(word, 1));
    if (word.length > 2) pool.push(midChar(word));
    if (word.length > 1) pool.push(lastChar(word));
  }
  return uniqueChars(pool.join(''));
}

export function generateStrategicCandidates(words: string[]): string[] {
  const strategicPool = getStrategicPool(words);
  const strategicCombos = combinations3(strategicPool);

  // Prioritize combos starting with first letter of name
  const firstLetter = safeChar(words[0], 0);
  const prioritized = [
    ...strategicCombos.filter((c) => c[0] === firstLetter),
    ...strategicCombos.filter((c) => c[0] !== firstLetter),
  ];
  return prioritized;
}

// ─── Fallback: Full Combinatorics ────────────────────────────────────────────

function getFullPool(name: string): string[] {
  return uniqueChars(sanitizeName(name).replace(/\s/g, ''));
}

export function generateFullCandidates(namaLengkap: string): string[] {
  const words = getWords(namaLengkap);
  const firstLetter = safeChar(words[0], 0);
  const fullPool = getFullPool(namaLengkap);
  const fullCombos = combinations3(fullPool);

  const fullPrioritized = [
    ...fullCombos.filter((c) => c[0] === firstLetter),
    ...fullCombos.filter((c) => c[0] !== firstLetter),
  ];
  return fullPrioritized;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

/**
 * Generate a 3-letter asprak code from a full name.
 *
 * @param namaLengkap - Full name of the asprak
 * @param usedCodes   - Set of codes already in use (for availability checking)
 * @returns The generated code and which rule produced it
 * @throws Error if absolutely no code can be generated
 *
 * @example
 * const result = generateAsprakCode('MUHAMMAD ABIYU ALGHIFARI', new Set(['MAA']));
 * // result.code === 'MAB', result.rule === 'Standard 3.2'
 */
export function generateAsprakCode(
  namaLengkap: string,
  usedCodes: Set<string>
): CodeGenerationResult {
  const words = getWords(namaLengkap);
  const n = words.length;

  if (n === 0) {
    throw new Error(`Nama "${namaLengkap}" tidak valid untuk generate kode.`);
  }

  // ── Phase 1: Standard Rules ──────────────────────────────────────────────

  let standardCandidates: string[] = [];
  if (n === 1) standardCandidates = rulesFor1Word(words);
  else if (n === 2) standardCandidates = rulesFor2Words(words);
  else standardCandidates = rulesFor3Words(words);

  const rulePrefix = Math.min(n, 3);
  for (let i = 0; i < standardCandidates.length; i++) {
    const code = standardCandidates[i].toUpperCase();
    if (isValidCode(code) && !usedCodes.has(code)) {
      return { code, rule: `Standard ${rulePrefix}.${i + 1}` };
    }
  }

  // ── Phase 2: Strategic Fallback ──────────────────────────────────────────

  const strategicCandidates = generateStrategicCandidates(words);
  for (const code of strategicCandidates) {
    if (isValidCode(code) && !usedCodes.has(code)) {
      return { code, rule: 'Fallback L1 (Strategic)' };
    }
  }

  // ── Phase 3: Full Combinatorics ──────────────────────────────────────────

  const fullCandidates = generateFullCandidates(namaLengkap);
  for (const code of fullCandidates) {
    if (isValidCode(code) && !usedCodes.has(code)) {
      return { code, rule: 'Fallback L2 (Full)' };
    }
  }

  // ── Phase 4: Failure ─────────────────────────────────────────────────────

  throw new Error(
    `Tidak dapat generate kode untuk "${namaLengkap}". Semua kombinasi dari huruf nama sudah terpakai.`
  );
}

/**
 * Batch-generate codes for multiple aspraks.
 * Keeps track of newly generated codes so they don't collide with each other.
 *
 * @param rows         - Array of { nama_lengkap, kode? } objects
 * @param existingCodes - Set of codes already in the database
 * @returns Array of generated codes in the same order
 */
export function batchGenerateCodes(
  rows: { nama_lengkap: string; kode?: string }[],
  existingCodes: Set<string>
): CodeGenerationResult[] {
  const allUsed = new Set(existingCodes);
  const results: (CodeGenerationResult | null)[] = new Array(rows.length).fill(null);

  // ── Phase 1: Claim explicitly provided codes ──
  // We process these first so auto-generated codes don't "steal" a code
  // that was explicitly requested by a later row in the CSV.
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.kode) {
      const normalized = row.kode.toUpperCase().trim();
      if (isValidCode(normalized) && !allUsed.has(normalized)) {
        allUsed.add(normalized);
        results[i] = { code: normalized, rule: 'Provided (CSV)' };
      }
    }
  }

  // ── Phase 2: Auto-generate the remaining rows ──
  for (let i = 0; i < rows.length; i++) {
    if (results[i] !== null) continue;

    const row = rows[i];
    try {
      const result = generateAsprakCode(row.nama_lengkap, allUsed);
      allUsed.add(result.code);
      results[i] = result;
    } catch {
      // Graceful failure — code could not be generated, user must fill manually
      results[i] = { code: '', rule: 'FAILED' };
    }
  }

  return results as CodeGenerationResult[];
}
