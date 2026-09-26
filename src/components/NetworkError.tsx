interface NetworkErrorProps {
  message: string
  onRetry?: () => void
}

export default function NetworkError({ message, onRetry }: NetworkErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        <svg
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
        </svg>
      </span>
      <div>
        <p className="font-semibold text-red-900">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  )
}