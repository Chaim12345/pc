import React from 'react'

export default function SkipLinks() {
  return (
    <div className="skip-to-main">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-monday-primary focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-monday-primary/50"
      >
        Skip to main content
      </a>
    </div>
  )
}

