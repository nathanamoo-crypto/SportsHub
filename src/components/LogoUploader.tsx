import { useEffect, useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from '../context/ToastContext'
import { deleteTeamLogo, teamLogoPathFromUrl, uploadTeamLogo } from '../services/storage'

const MAX_SIZE = 2 * 1024 * 1024

interface LogoUploaderProps {
  teamId: number | null
  value: string | null
  onChange: (url: string | null) => void
  onFile?: (file: File | null) => void
}

export default function LogoUploader({ teamId, value, onChange, onFile }: LogoUploaderProps) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingUrl, setPendingUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    return () => {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl)
    }
  }, [pendingUrl])

  const clearPending = () => {
    if (pendingUrl) URL.revokeObjectURL(pendingUrl)
    setPendingFile(null)
    setPendingUrl(null)
    onFile?.(null)
  }

  const upload = async (file: File) => {
    if (teamId == null) return
    setUploading(true)
    setErrorMessage('')
    const { data, error } = await uploadTeamLogo(teamId, file)
    if (error) {
      setUploading(false)
      setErrorMessage(error.message)
      toast.error(error.message)
      return
    }
    setUploading(false)
    clearPending()
    if (data) {
      onChange(data.url)
      toast.success('Logo uploaded.')
    }
  }

  const handleFile = (file: File | null) => {
    setErrorMessage('')
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose an image file.')
      return
    }
    if (file.size > MAX_SIZE) {
      setErrorMessage('Image must be 2 MB or smaller.')
      return
    }
    if (pendingUrl) URL.revokeObjectURL(pendingUrl)
    const preview = URL.createObjectURL(file)
    setPendingFile(file)
    setPendingUrl(preview)
    onFile?.(file)
    if (teamId != null) void upload(file)
  }

  const handleRemove = async () => {
    if (!value) return
    setRemoving(true)
    setErrorMessage('')
    const path = teamLogoPathFromUrl(value)
    if (path) {
      const { error } = await deleteTeamLogo(path)
      if (error) {
        setRemoving(false)
        setConfirmRemove(false)
        setErrorMessage(error.message)
        toast.error(error.message)
        return
      }
    }
    onChange(null)
    setRemoving(false)
    setConfirmRemove(false)
    toast.success('Logo removed.')
  }

  const preview = pendingUrl ?? value

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        Team logo <span className="font-normal text-slate-400">(optional)</span>
      </label>
      <div className="flex items-start gap-4">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {preview ? (
            <img
              src={preview}
              alt="Team logo preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-slate-400">No logo</span>
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? 'Uploading...' : value ? 'Replace logo' : 'Choose image'}
          </button>
          {value ? (
            <div>
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
              >
                Remove logo
              </button>
            </div>
          ) : null}
          {pendingFile && teamId == null ? (
            <p className="text-xs text-slate-500">Will be uploaded when you save the team.</p>
          ) : null}
          {errorMessage ? (
            <p role="alert" className="text-xs text-red-600">
              {errorMessage}
            </p>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <ConfirmDialog
        open={confirmRemove}
        title="Remove team logo?"
        message="This deletes the uploaded logo from storage. Your team details are kept."
        confirmLabel="Remove logo"
        busy={removing}
        onConfirm={() => void handleRemove()}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  )
}