const styles = {
  draft: 'bg-slate-100 text-slate-700',
  published: 'bg-green-100 text-green-800',
  ongoing: 'bg-blue-100 text-blue-800',
  completed: 'bg-slate-200 text-slate-800',
  cancelled: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  const label = status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : '—'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {label}
    </span>
  )
}