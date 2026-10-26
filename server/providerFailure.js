// Classify known provider failures without exposing raw requests or credentials.
export function anthropicFailure(error) {
  const detail=String(error?.error?.error?.message||error?.error?.message||error?.message||'')
  if(error?.status===400&&/credit balance.*too low|insufficient.*credits/i.test(detail))return {status:402,body:{error:'The Anthropic key used for this search has insufficient API credits. Check billing for the key saved in Settings. If you have no saved key, the workspace owner needs to fund the server key.',code:'insufficient_credits'}}
  return {status:502,body:{error:`The AI service returned an error (${error?.status}).`}}
}
