#!/usr/bin/env node
// Counts the [SQUARE BRACKET] placeholders still left in the legal pages and prints a table.
//
//   npm run check:legal           prints the counts; always exits 0 (this also runs before every build)
//   npm run check:legal:strict    exits 1 if any placeholder remains (use it before going live)
//   LEGAL_PLACEHOLDERS_STRICT=1   the same strict mode, for a build or CI setting
//
// Company-level details filled in src/content/legal/company.json no longer count. The rules
// mirror src/lib/util/legal-markdown.ts (findPlaceholders / resolvePlaceholder); no dependency.
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const dir = process.env.LEGAL_CONTENT_DIR || join(here, "..", "src", "content", "legal")
const strict = process.argv.includes("--strict") || process.env.LEGAL_PLACEHOLDERS_STRICT === "1"

const PAGES = [
  ["terms", "/terms"],
  ["delivery", "/shipping"],
  ["returns", "/returns"],
  ["privacy", "/privacy-policy"],
  ["cookies", "/cookie-policy"],
  ["contact", "/contact"],
]

// Top-level [..] groups; brackets may nest; an open bracket at the end of a line is ignored
function findPlaceholders(text) {
  const spans = []
  let depth = 0
  let start = -1
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === "[") {
      if (depth === 0) start = i
      depth += 1
    } else if (ch === "]" && depth > 0) {
      depth -= 1
      if (depth === 0) spans.push(text.slice(start, i + 1))
    } else if (ch === "\n" && depth > 0) {
      depth = 0
    }
  }
  return spans
}

function readCompany() {
  const file = process.env.LEGAL_COMPANY_FILE || join(dir, "company.json")
  if (!existsSync(file)) return {}
  try {
    return JSON.parse(readFileSync(file, "utf8"))
  } catch (error) {
    console.warn(`check:legal: could not read ${file}: ${error.message}`)
    return {}
  }
}

function bodyOf(file) {
  const source = readFileSync(file, "utf8")
  const marker = source.indexOf("export default `")
  if (marker === -1) return ""
  const open = source.indexOf("`", marker)
  const close = source.lastIndexOf("`")
  return close > open ? source.slice(open + 1, close) : ""
}

const company = readCompany()
const filled = (token) => {
  const m = /^\[([A-Z][A-Z0-9 /]*)\]$/.exec(token)
  return !!m && typeof company[m[1]] === "string" && company[m[1]].trim() !== ""
}

let total = 0
const rows = []
for (const [name, route] of PAGES) {
  const file = join(dir, `${name}.ts`)
  if (!existsSync(file)) {
    rows.push([route, "missing file"])
    continue
  }
  const count = findPlaceholders(bodyOf(file)).filter((t) => !filled(t)).length
  total += count
  rows.push([route, String(count)])
}

let draftSwitch = "unknown"
const pagesFile = join(dir, "pages.ts")
if (existsSync(pagesFile)) {
  const m = /LEGAL_PAGES_DRAFT\s*=\s*(true|false)/.exec(readFileSync(pagesFile, "utf8"))
  if (m) draftSwitch = m[1]
}

console.log("Legal pages: placeholders left to fill in")
for (const [route, n] of rows) console.log(`  ${route.padEnd(18)} ${n}`)
console.log(`  ${"total".padEnd(18)} ${total}`)
console.log(`  draft switch (content/legal/pages.ts): ${draftSwitch}${total > 0 ? " (stays in draft while any placeholder remains)" : ""}`)

if (strict && total > 0) {
  console.error(`check:legal (strict): ${total} placeholder(s) remain. Fill them in before going live.`)
  process.exit(1)
}
