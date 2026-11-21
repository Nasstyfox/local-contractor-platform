import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createContractorProfile } from '../action'
import Link from 'next/link'

export default async function ContractorSetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch categories and suburbs to populate the checkboxes
  const { data: categories } = await supabase.from('categories').select('*')
  const { data: suburbs } = await supabase.from('suburbs').select('*')

  return (
    <div className="max-w-2xl mx-auto p-8">
      <button type="submit"
          className="bg-blue-600 text-white rounded-md px-4 py-3 font-bold hover:bg-blue-700 mt-4">
        <Link href="/dashboard" className="text-blue-500 hover:underline mb-6 inline-block">
          ← Back to Dashboard
        </Link>
      </button>
      <div className="bg-white border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Setup Your Contractor Profile</h1>
        
        <form action={createContractorProfile} className="flex flex-col gap-6">
          
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="business_name">Business Name</label>
            <input
              className="w-full rounded-md px-4 py-2 border"
              name="business_name"
              placeholder="e.g., Smith Plumbing Solutions"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="bio">Short Bio / Description</label>
            <textarea
              className="w-full rounded-md px-4 py-2 border h-24"
              name="bio"
              placeholder="Tell clients a bit about your experience..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Services You Offer</label>
            <div className="grid grid-cols-2 gap-2">
              {categories?.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 text-sm border p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" name="categories" value={cat.id} className="w-4 h-4" />
                  {cat.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Areas You Serve</label>
            <div className="grid grid-cols-2 gap-2">
              {suburbs?.map((sub) => (
                <label key={sub.id} className="flex items-center gap-2 text-sm border p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" name="suburbs" value={sub.id} className="w-4 h-4" />
                  {sub.name} ({sub.city})
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white rounded-md px-4 py-3 font-bold hover:bg-blue-700 mt-4"
          >
            Save Profile & Continue
          </button>
        </form>
      </div>
    </div>
  )
}