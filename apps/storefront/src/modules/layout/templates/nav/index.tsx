{/* Left column: menu trigger + desktop nav links */}
<div className="flex-1 basis-0 h-full flex items-center gap-x-6">
  <div className="h-full flex-shrink-0">
    <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
  </div>
  <div className="hidden small:flex items-center gap-x-6 h-full flex-shrink-0">
    {NAV_LINKS.map((link) => (
      <LocalizedClientLink
        key={link.href}
        href={link.href}
        className="text-xs font-body font-medium uppercase tracking-widest text-ink pb-1 border-b border-transparent hover:border-wine hover:text-wine transition-colors duration-200 whitespace-nowrap"
      >
        {link.label}
      </LocalizedClientLink>
    ))}
  </div>
</div>

{/* Center column: logo, true center */}
<div className="flex items-center justify-center h-full flex-1 basis-0">
  <LocalizedClientLink
    href="/"
    className="flex items-center h-full"
    data-testid="nav-store-link"
  >
    <Image
      src="/logo/mary-shubic-logo5-wine-rose.svg"
      alt="Mary Shubic"
      width={220}
      height={60}
      priority
      unoptimized
      className="h-10 w-auto small:h-12"
    />
  </LocalizedClientLink>
</div>