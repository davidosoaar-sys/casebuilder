// Project labels like "Nike · sample" carry a suffix for Chris. Client-facing
// artifacts show the company, the part before " · " (same rule as the worker).
export function clientCompanyName(companyName, projectName = '') {
  const raw = String(companyName || '').trim() || String(projectName || '').trim()
  return raw.split(/\s+·\s+/)[0].trim() || raw
}
