import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SuburbSearch from '@/components/SuburbSearch'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; suburb?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Fetch categories and suburbs
  const { data: categories } = await supabase.from('categories').select('*').order('name')
  const { data: suburbs } = await supabase.from('suburbs').select('*').order('name')

  // Build the query
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
    .in('status', ['trial', 'active'])
    // SORTING LOGIC: Featured first, then Active (paying), then Trial (free)
    .order('is_featured', { ascending: false })
    .order('status', { ascending: true }) 

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
      <div className="bg-blue-900 text-white py-24 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Find Trusted Local Pros</h1>
        <p className="text-lg mb-10 text-blue-100">Search verified plumbers, electricians, and technicians in your area.</p>
        
        <form className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-xl mb-8">
          <select name="category" defaultValue={params.category || ''} className="flex-1 border border-gray-300 p-3 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Services</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Replaced the native select with our custom Typeahead component */}
          <SuburbSearch suburbs={suburbs || []} defaultValue={params.suburb} />

          <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
            Search
          </button>
        </form>

        <div className="flex justify-center gap-4 mt-8">
          <Link href="/login" className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-8 py-2.5 rounded-lg font-medium transition-all">
            Log In
          </Link>
          <Link href="/signup" className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-2.5 rounded-lg font-bold transition-all shadow-md">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          {contractors?.length || 0} Contractors Found
        </h2>

        {contractors?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-lg">No contractors found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractors?.map((contractor) => (
              <Link href={`/contractors/${contractor.id}`} key={contractor.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all p-6 flex flex-col justify-between group">
                <div>
                  {contractor.is_featured && (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-md mb-3">
                      ⭐ FEATURED PRO
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{contractor.business_name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">{contractor.bio}</p>
                </div>
                <span className="text-blue-600 font-medium text-sm mt-4 flex items-center gap-1">
                  View Profile <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}