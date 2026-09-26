import type { ReactNode } from 'react'

interface EmptyResultsProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function EmptyResults({
  title,
  description,
  action,
  className = '',
}: EmptyResultsProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M21 21l-5-5M11 4a7 7 0 100 14 7 7 0 000-14z" />
        </svg>
      </span>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}