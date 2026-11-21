'use client'

import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from './actions'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    await requestPasswordReset(formData)
    setLoading(false)
    setSuccess(true)
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <Link href="/login" className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm">
        ← Back to Login
      </Link>

      <div className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <h1 className="text-2xl font-bold mb-2 text-center">Reset Password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Enter your email and we'll send you a link to reset your password.</p>

        {success ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center">
            <h3 className="font-bold text-lg mb-2">Check your inbox!</h3>
            <p className="text-sm">We've sent a password reset link to your email address.</p>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-md block mb-2" htmlFor="email">Email</label>
              <input
                className="rounded-md px-4 py-2 bg-inherit border w-full"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white rounded-md px-4 py-2 font-bold hover:bg-blue-700 disabled:opacity-50 mt-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}