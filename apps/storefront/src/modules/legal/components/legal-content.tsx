import {
  findPlaceholders,
  placeholderKey,
  POLICY_LINKS,
  resolvePlaceholder,
  type Block,
  type Company,
} from "@lib/util/legal-markdown"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

type InlineOptions = { company: Company; mailto: boolean }

const LINK = "text-wine underline hover:text-wine/80"

// Names of the other policies become links
const linkPolicies = (text: string, keyPrefix: string): React.ReactNode[] => {
  const pattern = new RegExp(
    `(${POLICY_LINKS.map((l) => l.phrase).join("|")})`,
    "g"
  )
  return text.split(pattern).map((part, i) => {
    const link = POLICY_LINKS.find((l) => l.phrase === part)
    return link ? (
      <LocalizedClientLink key={`${keyPrefix}-${i}`} href={link.href} className={LINK}>
        {part}
      </LocalizedClientLink>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
    )
  })
}

// One segment of text (no bold markers): placeholders are highlighted, or replaced by the
// company detail once it is filled in; the rest gets policy links.
const renderSegment = (
  text: string,
  { company, mailto }: InlineOptions,
  keyPrefix: string
): React.ReactNode[] => {
  const nodes: React.ReactNode[] = []
  let cursor = 0

  findPlaceholders(text).forEach((span, i) => {
    if (span.start > cursor) {
      nodes.push(...linkPolicies(text.slice(cursor, span.start), `${keyPrefix}-t${i}`))
    }

    const value = resolvePlaceholder(span.text, company)
    const isEmail = placeholderKey(span.text) === "CONTACT EMAIL"

    if (value) {
      nodes.push(
        isEmail && mailto ? (
          <a key={`${keyPrefix}-p${i}`} href={`mailto:${value}`} className={LINK}>
            {value}
          </a>
        ) : (
          <React.Fragment key={`${keyPrefix}-p${i}`}>{value}</React.Fragment>
        )
      )
    } else {
      // Still a placeholder: keep the text exactly as written, just make it visible
      const mark = (
        <mark
          key={`${keyPrefix}-p${i}`}
          data-placeholder=""
          className="rounded-soft bg-blush px-1 text-wine-deep"
        >
          {span.text}
        </mark>
      )
      nodes.push(
        isEmail && mailto ? (
          <a key={`${keyPrefix}-m${i}`} href={`mailto:${span.text}`} className={LINK}>
            {mark}
          </a>
        ) : (
          mark
        )
      )
    }

    cursor = span.end
  })

  if (cursor < text.length) {
    nodes.push(...linkPolicies(text.slice(cursor), `${keyPrefix}-end`))
  }

  return nodes
}

// **bold** first, then placeholders and links inside each piece
export const renderInline = (
  text: string,
  options: InlineOptions,
  keyPrefix = "i"
): React.ReactNode[] =>
  text.split(/(\*\*.+?\*\*)/g).map((part, i) => {
    const bold = /^\*\*(.+)\*\*$/.exec(part)
    return bold ? (
      <strong key={`${keyPrefix}-${i}`} className="font-semibold">
        {renderSegment(bold[1], options, `${keyPrefix}-${i}`)}
      </strong>
    ) : (
      <React.Fragment key={`${keyPrefix}-${i}`}>
        {renderSegment(part, options, `${keyPrefix}-${i}`)}
      </React.Fragment>
    )
  })

const LegalContent = ({
  blocks,
  company,
  mailto,
}: {
  blocks: Block[]
  company: Company
  mailto: boolean
}) => {
  const options: InlineOptions = { company, mailto }
  let lastHeading = ""

  return (
    <div className="font-body text-base leading-relaxed text-ink" data-testid="legal-content">
      {blocks.map((block, index) => {
        const key = `b${index}`

        switch (block.type) {
          case "heading": {
            // The page title (the draft's "# Title") is shown once by the page template
            if (block.level === 1) return null
            lastHeading = block.text.replace(/\[[^\]]*\]/g, "").trim()
            const Tag = block.level === 2 ? "h2" : "h3"
            return (
              <Tag
                key={key}
                id={block.id}
                className={
                  block.level === 2
                    ? "mb-3 mt-10 scroll-mt-28 font-display text-2xl text-wine-deep"
                    : "mb-2 mt-6 scroll-mt-28 font-display text-xl text-wine-deep"
                }
              >
                {renderInline(block.text, options, key)}
              </Tag>
            )
          }

          case "paragraph":
            return (
              <p key={key} className="mb-4">
                {block.lines.map((line, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <br />}
                    {renderInline(line, options, `${key}-${i}`)}
                  </React.Fragment>
                ))}
              </p>
            )

          case "list": {
            const Tag = block.ordered ? "ol" : "ul"
            return (
              <Tag
                key={key}
                className={`mb-4 space-y-1 pl-6 ${block.ordered ? "list-decimal" : "list-disc"}`}
              >
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, options, `${key}-${i}`)}</li>
                ))}
              </Tag>
            )
          }

          case "table":
            // Wide tables scroll sideways on a phone instead of squashing the text
            return (
              <div
                key={key}
                role="region"
                aria-label={lastHeading ? `${lastHeading} table` : "Table"}
                tabIndex={0}
                className="mb-6 overflow-x-auto border border-ink/10"
              >
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead>
                    <tr>
                      {block.header.map((cell, i) => (
                        <th
                          key={i}
                          scope="col"
                          className="bg-blush/50 px-3 py-2 font-semibold"
                        >
                          {renderInline(cell, options, `${key}-h${i}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="border-t border-ink/10">
                        {row.map((cell, c) => (
                          <td key={c} className="px-3 py-2 align-top">
                            {renderInline(cell, options, `${key}-${r}-${c}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        }
      })}
    </div>
  )
}

export default LegalContent
