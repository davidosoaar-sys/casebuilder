// Skill library helpers. A skill = named instructions + optional inputs + per-
// project settings. Prebuilt skills come from prebuiltSkills.json (the worker
// reads the same file); custom skills live in public.skills (migration 0012).
import data from './prebuiltSkills.json' with { type: 'json' }

export const PREBUILT = data.skills
export const prebuiltByKey = key => PREBUILT.find(s => s.key === key) || null
export const MAX_SKILL_INSTRUCTIONS = 8000

// The library for one project: every prebuilt skill (with this project's row if
// configured) plus the project's custom skills.
export function librarySkills(rows = []) {
  const pre = PREBUILT.map(p => {
    const row = rows.find(r => r.prebuilt_key === p.key)
    return { ...p, id: row?.id || null, prebuilt: true, enabled: row ? row.enabled : true, settings: settingsFor(p, row?.settings) }
  })
  const custom = rows.filter(r => !r.prebuilt_key).map(r => ({
    key: null, id: r.id, prebuilt: false, name: r.name, description: r.description, instructions: r.instructions,
    mode: r.settings?.mode === 'research' ? 'research' : 'chat', inputs: [], settings: {}, enabled: r.enabled
  }))
  return [...pre, ...custom]
}

export function settingsFor(skill, saved = {}) {
  const out = {}
  for (const s of skill.settings || []) out[s.key] = s.options.includes(saved?.[s.key]) ? saved[s.key] : s.default
  return out
}

// What the user sees in their chat when they use a skill: the skill name plus
// the inputs they filled in. The instructions themselves are added by the worker.
export function skillMessage(skill, inputs = {}) {
  const parts = (skill.inputs || []).filter(i => String(inputs[i.key] || '').trim()).map(i => `${i.label.replace(/\?.*$/, '').replace(/\s*\(optional\)\s*/, '')}: ${String(inputs[i.key]).trim()}`)
  return [`Use skill: ${skill.name}`, ...parts].join('\n')
}

export function missingInput(skill, inputs = {}) {
  return (skill.inputs || []).find(i => i.required && !String(inputs[i.key] || '').trim()) || null
}

// Job payload reference: the worker resolves this to instructions itself.
export function skillRef(skill, inputs = {}) {
  const clean = {}
  for (const i of skill.inputs || []) if (String(inputs[i.key] || '').trim()) clean[i.key] = String(inputs[i.key]).trim().slice(0, 500)
  return skill.prebuilt ? { skill_key: skill.key, skill_inputs: clean } : { skill_id: skill.id }
}
