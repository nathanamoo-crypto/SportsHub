import { supabase, isSupabaseConfigured } from './supabase'

const BUCKET = 'team-logos'
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`

export interface LogoUploadData {
  path: string
  url: string
}

export interface LogoStorageResult {
  data: LogoUploadData | null
  error: { message: string } | null
}

function logoObjectPath(teamId: number): string {
  return `teams/${teamId}/logo`
}

function publicUrlFor(path: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

export function teamLogoPathFromUrl(url: string | null): string | null {
  if (!url) return null
  const index = url.indexOf(PUBLIC_PREFIX)
  return index === -1 ? null : url.slice(index + PUBLIC_PREFIX.length)
}

function storageError(message: string): { message: string } {
  return { message }
}

export async function uploadTeamLogo(
  teamId: number,
  file: File,
): Promise<LogoStorageResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: storageError('Supabase is not configured.') }
  }
  const path = logoObjectPath(teamId)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || 'image/png' })
  if (error) {
    return { data: null, error: storageError(error.message) }
  }
  return { data: { path, url: publicUrlFor(path) }, error: null }
}

export async function deleteTeamLogo(path: string): Promise<LogoStorageResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: storageError('Supabase is not configured.') }
  }
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    return { data: null, error: storageError(error.message) }
  }
  return { data: null, error: null }
}