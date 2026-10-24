// Self-contained: serialized into the standalone website, without a runtime CDN.
export function createWebsiteMotion(root, env = window, { pageScroll = false } = {}) {
  const seen = new Set()
  const preference = env.matchMedia('(prefers-reduced-motion: reduce)')
  let observer = null
  const reveal = element => {
    seen.add(element.dataset.motionKey)
    element.classList.remove('motion-pending')
    element.classList.add('motion-visible')
  }
  function refresh() {
    observer?.disconnect()
    observer = null
    const elements = [...root.querySelectorAll('.slide .blk, .overview-bento, .website-actions')]
    elements.forEach((element, index) => {
      element.dataset.motionKey = element.hasAttribute('data-b') ? 'block-' + element.dataset.s + '-' + element.dataset.b : 'extra-' + index
      element.style.setProperty('--reveal-delay', Math.min(index % 4, 3) * 45 + 'ms')
    })
    // No dependency on animation support for reading content.
    if (preference.matches || !env.IntersectionObserver) { elements.forEach(reveal); return }
    try {
      observer = new env.IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          reveal(entry.target)
          observer?.unobserve(entry.target)
        })
      }, { root:pageScroll ? null : root, threshold: 0, rootMargin: '0px 0px -24px 0px' })
      const bounds = pageScroll ? {top:0,bottom:env.innerHeight} : root.getBoundingClientRect()
      elements.forEach(element => {
        const rect = element.getBoundingClientRect()
        if (seen.has(element.dataset.motionKey) || (rect.top < bounds.bottom && rect.bottom > bounds.top)) reveal(element)
        else {
          element.classList.add('motion-pending')
          observer.observe(element)
        }
      })
    } catch {
      observer?.disconnect()
      elements.forEach(reveal)
    }
  }
  preference.addEventListener?.('change', refresh)
  return { refresh, destroy() { observer?.disconnect(); preference.removeEventListener?.('change', refresh); root.querySelectorAll('.motion-pending').forEach(reveal) } }
}
