import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SuburbSearch from '@/components/SuburbSearch'
import { broadcastRequest } from './actions'

export default async function NewRequestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: categories } = await supabase.from('categories').select('*').order('name')
  const { data: suburbs } = await supabase.from('suburbs').select('*').order('name')

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Submit a New Request</h1>
        <p className="text-gray-500 mt-1">Broadcast your job to all matching contractors in your area.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
        <form action={broadcastRequest} className="flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">What service do you need?</label>
              <select name="category" required className="w-full border border-gray-300 p-3 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a Trade...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Where do you need it?</label>
              <SuburbSearch suburbs={suburbs || []} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">How urgent is this?</label>
            <select name="urgency" required className="w-full border border-gray-300 p-3 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Flexible">Flexible (Whenever is convenient)</option>
              <option value="This Week">This Week</option>
              <option value="Emergency">Emergency (Today)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Job Description</label>
            <textarea 
              name="description" 
              required 
              rows={5}
              placeholder="e.g., My geyser is leaking and I need it fixed today. It's in the ceiling..."
              className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-800">
            <span className="text-xl">💡</span>
            <p>By submitting this request, it will immediately be sent to all verified contractors matching your trade and area. They will contact you directly via phone or WhatsApp.</p>
          </div>

          <button 
            type="submit" 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors mt-2"
          >
            Broadcast Request to Contractors
          </button>
        </form>
      </div>
    </div>
  )
}