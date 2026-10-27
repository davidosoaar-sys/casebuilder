// Shared by the local and remote MCP bridges. Returns a patch without mutating.
export function reviewedInputs(current, approved, inputs) {
  if (approved !== true) throw Error('Review proposed inputs with the user before applying')
  if (!Array.isArray(inputs) || !inputs.length || inputs.length > 100) throw Error('Provide 1–100 reviewed inputs')
  const patch = {}
  for (const i of inputs) {
    if (!i || Object.keys(i).some(k => !['key','value','state','origin','quote','link'].includes(k)) || !Object.hasOwn(current, i.key) || Object.hasOwn(patch, i.key)) throw Error('Unknown or duplicate input')
    if (!['input','assumption','suggestion'].includes(i.state) || typeof i.origin !== 'string' || !i.origin.trim()) throw Error('State and origin required')
    if (!['string','number'].includes(typeof i.value) || typeof i.value === 'number' && !Number.isFinite(i.value)) throw Error('Invalid value')
    if (i.quote !== undefined && typeof i.quote !== 'string' || i.link !== undefined && (typeof i.link !== 'string' || i.link && !/^https?:\/\//i.test(i.link))) throw Error('Invalid source quote or HTTP(S) link')
    const field = current[i.key]
    if (['number','percent'].includes(field.type) && i.value !== '' && (typeof i.value !== 'number' || i.value < 0 || field.type === 'percent' && i.value > 100)) throw Error('Invalid numeric input')
    if (field.type === 'select' && !field.options?.includes(i.value)) throw Error('Invalid selection')
    patch[i.key] = {...current[i.key], value:i.value, confirmed:i.state === 'input', source:{state:i.state, origin:i.origin, quote:i.quote || '', link:i.link || '', pinnedAt:''}}
  }
  return patch
}
