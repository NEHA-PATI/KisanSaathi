import { Link } from 'react-router-dom'

export default function PageNotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-green">404</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-4 text-slate-600">
          The page you are looking for does not exist or has moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
