import { login } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <Link href="/" className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm">
        ← Back to Home
      </Link>

      <form action={login} className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <h1 className="text-2xl font-bold mb-6 text-center">Log In to ProFind</h1>
        
        <label className="text-md" htmlFor="email">Email</label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        
        <label className="text-md" htmlFor="password">Password</label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <button
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-foreground mb-2 hover:bg-blue-700"
        >
          Log In
        </button>
        
        <p className="text-center text-sm mt-4">
          Don't have an account? <Link href="/signup" className="text-blue-500 hover:underline">Sign up</Link>
        </p>
      </form>
    </div>
  )
}