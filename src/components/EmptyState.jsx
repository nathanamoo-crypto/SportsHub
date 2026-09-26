export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600"
        aria-hidden="true"
      >
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 9.75V5.25A2.25 2.25 0 0 1 8.25 3h7.5A2.25 2.25 0 0 1 18 5.25v4.5m-12 0A2.25 2.25 0 0 0 3.75 12v6a2.25 2.25 0 0 0 2.25 2.25h12A2.25 2.25 0 0 0 20.25 18v-6A2.25 2.25 0 0 0 18 9.75m-12 0h12"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-slate-600">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}