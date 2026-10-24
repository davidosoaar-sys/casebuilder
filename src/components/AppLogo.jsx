import React from 'react'
import full from '../assets/backstage-logo.svg?raw'

// CaseBuilder's own branding (app chrome): Backstage's B mark + "CaseBuilder".
// A custom C mark was tried (scripts/brand/make-mark.mjs) and rejected: it did
// not read as a C at sidebar size. The B also says "CaseBuilder, from Backstage".
// compact = mark only (collapsed sidebar).
const mark = full.replace('viewBox="0 0 2079.95 456.05"', 'viewBox="-2 8 344 400"')

export default function AppLogo({ height = 26, compact = false }) {
  return (
    <span className={`app-logo ${compact ? 'app-logo-compact' : ''}`} style={{ height }} role="img" aria-label="CaseBuilder">
      <span className="app-logo-mark" style={{ height }} dangerouslySetInnerHTML={{ __html: mark }} />
      {!compact && <span className="app-logo-word" style={{ fontSize: height * 0.86 }}>CaseBuilder</span>}
    </span>
  )
}
