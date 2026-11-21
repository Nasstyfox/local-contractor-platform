'use client'

import { useState } from 'react'
import { updateClientDetails } from './actions'

export default function ProfileForm({ profile, userEmail }: { profile: any, userEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage(null)
    
    const result = await updateClientDetails(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: result.success })
    }
    
    setLoading(false)
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
          <input 
            name="full_name" 
            defaultValue={profile?.full_name || ''} 
            required 
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
          <input 
            name="email" 
            type="email"
            defaultValue={userEmail} 
            required 
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          />
          <p className="text-xs text-gray-500 mt-1">Changing this requires email confirmation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
          <input 
            name="phone" 
            defaultValue={profile?.phone || ''} 
            required 
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Physical Address</label>
          <input 
            name="address" 
            defaultValue={profile?.address || ''} 
            required 
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" 
          />
        </div>
      </div>

      <div className="mt-4">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}