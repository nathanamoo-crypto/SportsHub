const styles: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-green-100 text-green-800',
  ongoing: 'bg-blue-100 text-blue-800',
  completed: 'bg-slate-200 text-slate-800',
  cancelled: 'bg-red-100 text-red-700',
  scheduled: 'bg-blue-100 text-blue-800',
  postponed: 'bg-amber-100 text-amber-800',
}

export default function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        status ? styles[status] ?? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {label}
    </span>
  )
}