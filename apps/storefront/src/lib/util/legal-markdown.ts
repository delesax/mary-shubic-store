// Pure helpers for the legal pages: placeholder detection and a small markdown parser for the
// subset the drafts use (headings, paragraphs, lists, pipe tables, **bold**). No dependency.
// The same placeholder rules are repeated in scripts/check-legal-placeholders.mjs; keep them in step.

export type Company = Record<string, string>

export type Span = { start: number; end: number; text: string }

// Top-level [SQUARE BRACKET] groups. Brackets can nest (the VAT line has one inside
// another), and a nested group counts as part of the outer one.
export const findPlaceholders = (text: string): Span[] => {
  const spans: Span[] = []
  let depth = 0
  let start = -1

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (ch === "[") {
      if (depth === 0) start = i
      depth += 1
    } else if (ch === "]" && depth > 0) {
      depth -= 1
      if (depth === 0) {
        spans.push({ start, end: i + 1, text: text.slice(start, i + 1) })
      }
    } else if (ch === "\n" && depth > 0) {
      // a bracket left open at the end of a line is not a placeholder
      depth = 0
    }
  }

  return spans
}

// "[LEGAL NAME]" -> "LEGAL NAME" when the whole group is a simple company-level key
export const placeholderKey = (token: string): string | null => {
  const match = /^\[([A-Z][A-Z0-9 /]*)\]$/.exec(token)
  return match ? match[1] : null
}

// The value to show instead of the placeholder, or null while the detail is not filled in
export const resolvePlaceholder = (token: string, company: Company): string | null => {
  const key = placeholderKey(token)
  const value = key ? (company[key] ?? "").trim() : ""
  return value ? value : null
}

// How many placeholders are still open on a page
export const countPlaceholders = (text: string, company: Company = {}): number =>
  findPlaceholders(text).filter((s) => resolvePlaceholder(s.text, company) === null).length

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

export type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string; id: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; header: string[]; rows: string[][] }

const TABLE_RULE = /^\|[\s|:-]+\|\s*$/
const isTableRow = (line: string) => line.trim().startsWith("|")
const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())

const BULLET = /^[-*]\s+(.*)$/
const NUMBERED = /^\d+\.\s+(.*)$/

export const parseLegalMarkdown = (source: string): Block[] => {
  const lines = source.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  const usedIds = new Map<string, number>()
  let i = 0

  const uniqueId = (text: string) => {
    const base = slugify(text) || "section"
    const seen = usedIds.get(base) ?? 0
    usedIds.set(base, seen + 1)
    return seen === 0 ? base : `${base}-${seen + 1}`
  }

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) {
      i += 1
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      const text = heading[2].trim()
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text,
        id: uniqueId(text),
      })
      i += 1
      continue
    }

    if (isTableRow(line) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1])) {
      const header = splitRow(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && isTableRow(lines[i])) {
        rows.push(splitRow(lines[i]))
        i += 1
      }
      blocks.push({ type: "table", header, rows })
      continue
    }

    const bullet = BULLET.exec(line)
    const numbered = NUMBERED.exec(line)
    if (bullet || numbered) {
      const ordered = !bullet
      const pattern = ordered ? NUMBERED : BULLET
      const items: string[] = []
      while (i < lines.length) {
        const m = pattern.exec(lines[i])
        if (!m) break
        items.push(m[1].trim())
        i += 1
      }
      blocks.push({ type: "list", ordered, items })
      continue
    }

    // paragraph: consecutive plain lines; a single newline is kept as a line break
    const para: string[] = []
    while (i < lines.length) {
      const l = lines[i]
      if (
        !l.trim() ||
        /^#{1,3}\s/.test(l) ||
        BULLET.test(l) ||
        NUMBERED.test(l) ||
        (isTableRow(l) && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1]))
      ) {
        break
      }
      para.push(l.trim())
      i += 1
    }
    blocks.push({ type: "paragraph", lines: para })
  }

  return blocks
}

export type TocItem = { id: string; text: string }

// Table of contents: the numbered "##" sections
export const buildToc = (blocks: Block[]): TocItem[] =>
  blocks
    .filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading" && b.level === 2)
    .map((b) => ({ id: b.id, text: b.text }))

// Names of the other policies, linked wherever they appear in the text
export const POLICY_LINKS: { phrase: string; href: string }[] = [
  { phrase: "Terms and Conditions of Sale", href: "/terms" },
  { phrase: "Returns and Refunds Policy", href: "/returns" },
  { phrase: "Delivery Policy", href: "/shipping" },
  { phrase: "Privacy Policy", href: "/privacy-policy" },
  { phrase: "Cookie Policy", href: "/cookie-policy" },
]
