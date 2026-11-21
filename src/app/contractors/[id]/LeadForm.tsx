'use client'

import { useState } from 'react'
import { submitLead } from './actions'

export default function LeadForm({ 
  contractorId, 
  categoryId, 
  suburbId,
  isLoggedIn
}: { 
  contractorId: string, 
  categoryId: string, 
  suburbId: string,
  isLoggedIn: boolean 
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await submitLead(formData)
    
    if (result?.success) {
      setSuccess(true)
    } else {
      alert(result?.error || "Something went wrong")
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-md text-center">
        <h3 className="font-bold text-lg mb-2">Request Sent!</h3>
        <p>This contractor has been notified and will contact you shortly.</p>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="contractor_id" value={contractorId} />
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="suburb_id" value={suburbId} />

      {!isLoggedIn && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <input name="name" placeholder="Your Name" required className="border p-3 rounded-md" />
            <input name="email" type="email" placeholder="Your Email" required className="border p-3 rounded-md" />
          </div>
          <input name="phone" placeholder="Your Phone Number" required className="border p-3 rounded-md" />
        </>
      )}

      <textarea 
        name="description" 
        placeholder="Describe the job (e.g., 'My geyser is leaking, need it fixed today')" 
        required 
        className="border p-3 rounded-md h-24"
      />
      
      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-md font-bold hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Request to Contractor'}
      </button>
    </form>
  )
}