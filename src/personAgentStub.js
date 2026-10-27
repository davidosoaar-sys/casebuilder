// Explicit demo fixture. Never substituted for a failed real search.
const claim = value => ({ value, sourceUrl: 'https://example.com/demo-person', sourceType: 'web' })
export async function* stubSearchPerson(request = {}, { signal } = {}) {
  const name = request.name?.trim() || request.email?.trim() || request.linkedinUrl || 'Demo person'
  const identity = { name: claim(name), title: claim('Head of Platform Engineering'), company: claim(request.company?.trim() || 'Northwind (fictional)'), tenure: claim('2 years (demo)'), publicSignals: [], sourcesUsed: ['web'], sourcesSkipped: [] }
  if (signal?.aborted) return
  yield identity
  await new Promise(resolve => setTimeout(resolve, 450))
  if (signal?.aborted) return
  yield { ...identity, bio: claim('Fictional demo profile: leads platform engineering and developer experience at the example company.'), reportsTo: claim('CTO (demo)'), reports: [claim('Platform engineering team (demo)')], likelyCares: claim('Inferred: reducing platform upkeep so engineers can ship.'), publicSignals: [{ claim: 'Demo statement about reducing developer friction — fictional, not a real quote.', sourceUrl: 'https://example.com/demo-talk', sourceType: 'web' }], suggestedInputs: [{ key: 'engineers', value: 500, sourceUrl: 'https://example.com/demo-company', sourceType: 'web' }] }
}
