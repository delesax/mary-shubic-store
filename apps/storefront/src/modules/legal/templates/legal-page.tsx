import { buildToc, parseLegalMarkdown } from "@lib/util/legal-markdown"
import { getLegalStatus } from "@lib/util/legal-status"
import DraftBanner from "@modules/legal/components/draft-banner"
import LegalContent from "@modules/legal/components/legal-content"
import { COMPANY, LEGAL_PAGES, type LegalSlug } from "../../../content/legal/pages"

// One template for all six legal pages. The text comes from content/legal/*.ts.
const LegalPage = ({ slug }: { slug: LegalSlug }) => {
  const page = LEGAL_PAGES[slug]
  const status = getLegalStatus()
  const blocks = parseLegalMarkdown(page.body)
  const toc = page.toc ? buildToc(blocks) : []

  return (
    <div data-testid={`legal-page-${slug}`}>
      <div className="bg-blush px-6 py-12 text-center small:py-16">
        <h1
          className="font-display text-4xl font-medium italic text-wine-deep small:text-5xl"
          data-testid="legal-page-title"
        >
          {page.title}
        </h1>
      </div>

      <div className="content-container px-4 py-10 md:px-6 small:px-8">
        <div className="mx-auto max-w-3xl">
          {status.draft && <DraftBanner count={status.perPage[slug]} />}

          {toc.length > 0 && (
            <nav
              aria-label="Contents"
              className="mb-10 bg-ivory panel-pad border border-ink/10"
              data-testid="legal-toc"
            >
              <h2 className="mb-3 font-display text-xl text-wine-deep">Contents</h2>
              <ol className="columns-1 gap-x-8 space-y-1 text-sm small:columns-2">
                {toc.map((item) => (
                  <li key={item.id} className="break-inside-avoid">
                    <a
                      href={`#${item.id}`}
                      className="inline-flex min-h-[32px] items-center text-wine underline hover:text-wine/80"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <LegalContent blocks={blocks} company={COMPANY} mailto={page.mailto} />
        </div>
      </div>
    </div>
  )
}

export default LegalPage
