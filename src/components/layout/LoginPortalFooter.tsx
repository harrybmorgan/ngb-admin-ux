export function LoginPortalFooter() {
  return (
    <footer className="mt-auto w-full bg-[hsl(var(--wex-primary-hover))] py-4 text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4">
        <nav
          aria-label="Legal and support"
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-semibold leading-4 tracking-wide"
        >
          <button type="button" className="underline decoration-solid underline-offset-2 hover:no-underline">
            Browser Requirements
          </button>
          <button type="button" className="underline decoration-solid underline-offset-2 hover:no-underline">
            Contact Us
          </button>
          <button type="button" className="underline decoration-solid underline-offset-2 hover:no-underline">
            Privacy Policy
          </button>
          <button type="button" className="underline decoration-solid underline-offset-2 hover:no-underline">
            Accessibility Statement
          </button>
        </nav>
        <p className="text-center text-[11px] font-normal leading-4 tracking-wide text-white/95">
          Copyright 2005–2026. Powered by WEX Health, a WEX Inc. proprietary web product. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
