import React from 'react'
import raw from '../assets/backstage-logo.svg?raw'

// Backstage logo (from backstage.io), inlined so it can be sized in CSS.
export default function Logo({ height = 28 }) {
  return (
    <span
      className="logo"
      style={{ height }}
      role="img"
      aria-label="Backstage"
      dangerouslySetInnerHTML={{ __html: raw }}
    />
  )
}
