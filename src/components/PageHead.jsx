import React from 'react'

// One header for every top-level page, so Dashboard, Projects, Connections and
// Person lookup all read the same: small mint label, page title, actions right.
export default function PageHead({ label, title, sub, children }) {
  return (
    <header className="page-head">
      <div className="page-head-text">
        {label && <p className="mono-label">{label}</p>}
        <h1>{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {children && <div className="page-head-actions">{children}</div>}
    </header>
  )
}
