// Shown at the top of every legal page while it is a draft (see content/legal/pages.ts).
const DraftBanner = ({ count }: { count: number }) => (
  <div
    role="note"
    data-testid="legal-draft-banner"
    className="mb-8 border border-wine bg-blush/60 px-4 py-3 text-sm text-ink"
  >
    <strong className="font-semibold text-wine-deep">DRAFT.</strong> This page is a
    draft and has not been reviewed by a solicitor.{" "}
    {count > 0
      ? `It still has ${count} placeholder${count === 1 ? "" : "s"} in [square brackets] to complete. `
      : "All placeholders are filled in, but it is still marked as a draft. "}
    Search engines are asked not to index it.
  </div>
)

export default DraftBanner
