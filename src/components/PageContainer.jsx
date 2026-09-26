export default function PageContainer({
  title,
  description,
  children,
  className = '',
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16 ${className}`}>
      {title || description ? (
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-base text-slate-600">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </div>
  )
}