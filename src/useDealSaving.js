import { useEffect, useRef, useState } from 'react'
import { dealStorage, createDealAutosaver } from './dealStorage.js'
import { dealLoadError } from './projects.js'

export default function useDealSaving(deals) {
  const [status, setStatus] = useState(() => dealLoadError() ? { state: 'error', message: dealLoadError() } : { state: 'saved' })
  const seen = useRef(new Map(deals.map(d => [d.id, JSON.stringify(d)])))
  const saver = useRef(null)
  if (!saver.current) saver.current = createDealAutosaver(dealStorage, { onStatus: setStatus })
  useEffect(() => {
    for (const deal of deals) {
      const fingerprint = JSON.stringify(deal)
      if (seen.current.get(deal.id) === fingerprint) continue
      seen.current.set(deal.id, fingerprint)
      saver.current.queue(deal)
    }
  }, [deals])
  useEffect(() => {
    const flush = () => saver.current.flush()
    const hidden = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', hidden)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', hidden)
      if (saver.current.hasPending()) flush()
    }
  }, [])
  return { status, flush: () => saver.current.flush(), forget: id => { saver.current.forget(id); seen.current.delete(id) }, reportError: message => setStatus({ state: 'error', message }) }
}
