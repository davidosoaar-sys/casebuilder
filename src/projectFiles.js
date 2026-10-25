// Project files: list, upload (text extracted in the browser), toggle, remove.
// Rows live in public.project_files (migration 0004), owner-only under RLS.
import { extractText } from './fileText.js'

export const INSTRUCTIONS_NAME = 'Project instructions'
const SELECT = 'id, deal_id, name, kind, mime, size_bytes, pages, enabled, created_at, text'

export async function listFiles(client, dealId) {
  const { data, error } = await client.from('project_files').select(SELECT).eq('deal_id', dealId).order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

const friendly = e => {
  const m = e?.message || String(e)
  if (/file_limit/.test(m)) return m.replace(/^.*file_limit:\s*/, '').replace(/^./, c => c.toUpperCase()) + '.'
  if (/row-level|foreign key/.test(m)) return 'This project has not finished saving yet. Try again in a second.'
  return m
}

export async function uploadFile(client, { userId, dealId, file }) {
  const { text, pages, truncated } = await extractText(file)
  const row = { owner_id: userId, deal_id: dealId, name: file.name.slice(0, 200), kind: 'context', mime: file.type || '', size_bytes: file.size || 0, text, pages: pages ?? null }
  const { data, error } = await client.from('project_files').insert(row).select(SELECT).single()
  if (error) throw new Error(friendly(error))
  return { ...data, truncated }
}

export async function setEnabled(client, id, enabled) {
  const { error } = await client.from('project_files').update({ enabled }).eq('id', id)
  if (error) throw new Error(friendly(error))
}

export async function removeFile(client, id) {
  const { error } = await client.from('project_files').delete().eq('id', id)
  if (error) throw new Error(friendly(error))
}

// Instructions are one row of kind 'instructions' per project.
export async function saveInstructions(client, { userId, dealId, existing, text }) {
  const t = String(text || '').slice(0, 20000)
  if (existing) {
    const { error } = await client.from('project_files').update({ text: t, size_bytes: t.length }).eq('id', existing.id)
    if (error) throw new Error(friendly(error))
    return { ...existing, text: t }
  }
  const { data, error } = await client.from('project_files')
    .insert({ owner_id: userId, deal_id: dealId, name: INSTRUCTIONS_NAME, kind: 'instructions', mime: 'text/markdown', size_bytes: t.length, text: t })
    .select(SELECT).single()
  if (error) throw new Error(friendly(error))
  return data
}

export const fmtSize = n => n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
export const extOf = name => (String(name).match(/\.([a-z0-9]+)$/i)?.[1] || 'txt').toUpperCase().slice(0, 4)
