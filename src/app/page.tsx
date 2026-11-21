import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; suburb?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Fetch categories and suburbs for the search dropdowns
  const { data: categories } = await supabase.from('categories').select('*').order('name')
  const { data: suburbs } = await supabase.from('suburbs').select('*').order('name')

  // Build the query for contractors
  let query = supabase
    .from('contractors')
    .select(`
      id,
      business_name,
      bio,
      status,
      is_featured,
      contractor_categories!inner(category_id),
      contractor_suburbs!inner(suburb_id)
    `)
    .in('status', ['trial', 'active']) // Only show trial and active contractors
    .order('is_featured', { ascending: false }) // Featured first!

  // Apply filters if the user searched
  if (params.category) {
    query = query.eq('contractor_categories.category_id', params.category)
  }
  if (params.suburb) {
    query = query.eq('contractor_suburbs.suburb_id', params.suburb)
  }

  const { data: contractors } = await query

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-900 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Trusted Local Pros</h1>
        <p className="text-lg mb-8 text-blue-100">Search verified plumbers, electricians, and technicians in your area.</p>
        
        <form className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 bg-white p-4 rounded-lg shadow-lg">
          <select name="category" defaultValue={params.category || ''} className="flex-1 border p-3 rounded-md text-gray-700 bg-white">
            <option value="">All Services</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select name="suburb" defaultValue={params.suburb || ''} className="flex-1 border p-3 rounded-md text-gray-700 bg-white">
            <option value="">All Suburbs</option>
            {suburbs?.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name} ({sub.city})</option>
            ))}
          </select>

          <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-md font-bold hover:bg-blue-700 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            {contractors?.length || 0} Contractors Found
          </h2>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2">Log In</Link>
            <Link href="/signup" className="text-sm font-medium bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900">Sign Up</Link>
          </div>
        </div>

        {contractors?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <p className="text-gray-500 text-lg">No contractors found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractors?.map((contractor) => (
              <Link href={`/contractors/${contractor.id}`} key={contractor.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
                <div>
                  {contractor.is_featured && (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded mb-2">
                      ⭐ FEATURED PRO
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{contractor.business_name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{contractor.bio}</p>
                </div>
                <span className="text-blue-600 font-medium text-sm mt-4">View Profile →</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}