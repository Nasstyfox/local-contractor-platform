import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaystackButton from './contractor/billing/PaystackButton'
import Link from 'next/link'
import SuburbSearch from '@/components/SuburbSearch'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; suburb?: string; q?: string; role?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  let contractor = null
  let leads: any[] = []
  let clientRequests: any[] = []
  
  let categories: any[] = []
  let suburbs: any[] = []
  let searchResults: any[] = []
  let adminUsers: any[] = []

  // --- CONTRACTOR DATA ---
  if (profile?.role === 'contractor') {
    const { data } = await supabase.from('contractors').select('*').eq('id', user.id).single()
    contractor = data

    if (contractor) {
      const { data: leadsData } = await supabase
        .from('leads')
        .select(`
          id, status, created_at,
          service_requests (
            guest_name, guest_email, guest_phone, description,
            categories (name), suburbs (name)
          )
        `)
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false })
      
      if (leadsData) leads = leadsData
    }
  }

  // --- CLIENT DATA ---
  if (profile?.role === 'client') {
    const { data: cats } = await supabase.from('categories').select('*').order('name')
    const { data: subs } = await supabase.from('suburbs').select('*').order('name')
    categories = cats || []
    suburbs = subs || []

    const { data: requestsData } = await supabase
      .from('service_requests')
      .select('id')
      .eq('client_id', user.id)
    clientRequests = requestsData || []

    let query = supabase
      .from('contractors')
      .select(`
        id, business_name, bio, status, is_featured,
        contractor_categories!inner(category_id),
        contractor_suburbs!inner(suburb_id)
      `)
      .in('status', ['trial', 'active'])
      .order('is_featured', { ascending: false })
      .order('status', { ascending: true })

    if (params.category) query = query.eq('contractor_categories.category_id', params.category)
    if (params.suburb) query = query.eq('contractor_suburbs.suburb_id', params.suburb)

    const { data: results } = await query
    searchResults = results || []
  }

  // --- ADMIN DATA ---
  if (profile?.role === 'admin') {
    let query = supabase
      .from('profiles')
      .select(`
        *,
        contractors (status, business_name)
      `)
      .order('created_at', { ascending: false })

    if (params.q) {
      query = query.or(`full_name.ilike.%${params.q}%,phone.ilike.%${params.q}%`)
    }

    if (params.role && params.role !== 'all') {
      query = query.eq('role', params.role)
    }

    const { data: users } = await query
    adminUsers = users || []
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {profile?.role === 'admin' ? 'Admin Control Room' : 'Dashboard'}
          </h1>
          <p className="text-gray-500">Welcome back, {profile?.full_name || user.email}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <form action="/auth/signout" method="post">
            <button className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-lg transition-all">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* --- ADMIN VIEW --- */}
      {profile?.role === 'admin' && (
         <div>
            {/* Search Bar */}
            <form className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input 
                  type="text" 
                  name="q" 
                  defaultValue={params.q || ''} 
                  placeholder="Search by Name or Phone Number..." 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-full md:w-64">
                <select 
                  name="role" 
                  defaultValue={params.role || 'all'} 
                  className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="client">Clients Only</option>
                  <option value="contractor">Contractors Only</option>
                  <option value="admin">Admins Only</option>
                </select>
              </div>
              <button type="submit" className="bg-gray-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                Search
              </button>
            </form>

            {/* User List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-100 text-gray-800 uppercase text-xs font-bold">
                    <tr>
                      <th className="px-6 py-4">Name / Business</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {adminUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No users found matching your search.
                        </td>
                      </tr>
                    ) : (
                      adminUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{u.full_name || 'Unnamed User'}</div>
                            {u.contractors?.[0]?.business_name && (
                              <div className="text-xs text-blue-600 mt-1">{u.contractors[0].business_name}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`capitalize text-xs font-bold px-2.5 py-1 rounded-md ${
                              u.role === 'admin' ? 'bg-gray-800 text-white' :
                              u.role === 'contractor' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">{u.phone || 'N/A'}</td>
                          <td className="px-6 py-4">
                            {u.role === 'contractor' ? (
                              <span className={`uppercase text-xs font-bold px-2 py-1 rounded-md ${
                                u.contractors?.[0]?.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                                u.contractors?.[0]?.status === 'trial' ? 'bg-green-100 text-green-800' :
                                u.contractors?.[0]?.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {u.contractors?.[0]?.status?.replace('_', ' ') || 'No Profile'}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/admin/users/${u.id}`} className="text-blue-600 font-bold hover:underline">
                              View Profile →
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
         </div>
      )}

      {/* --- CONTRACTOR VIEW --- */}
      {profile?.role === 'contractor' && contractor && (
        <div className="flex flex-col gap-6 max-w-4xl">
          {/* Card 1: Verification */}
          {contractor.status === 'pending_verification' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="text-3xl">⚠️</div>
                <div>
                  <h2 className="text-lg font-bold text-yellow-900 mb-1">Verification Required</h2>
                  <p className="text-sm text-yellow-800 mb-4">Your account is currently hidden from the public. Please upload your ID and Trade Certificate so our team can verify you.</p>
                  <Link href="/dashboard/contractor/documents" className="bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-yellow-700 transition-colors text-sm inline-block">
                    Upload Documents Now
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Tier & Billing */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Subscription & Billing</h2>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex gap-2 mb-2">
                  <span className={`uppercase text-xs font-extrabold px-3 py-1 rounded-md tracking-wider ${
                    contractor.status === 'trial' ? 'bg-green-100 text-green-800' :
                    contractor.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    contractor.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {contractor.status.replace('_', ' ')}
                  </span>
                  {contractor.is_featured && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-3 py-1 rounded-md tracking-wider">
                      ⭐ FEATURED PRO
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {contractor.status === 'trial' && "You are currently on your 30-day free trial."}
                  {contractor.status === 'active' && "Your R100/month standard subscription is active."}
                  {contractor.status === 'expired' && "Your trial has expired. Subscribe to become visible again."}
                </p>
              </div>

              <div>
                {(contractor.status === 'trial' || contractor.status === 'expired') && (
                  <PaystackButton email={user.email!} contractorId={contractor.id} plan="standard" />
                )}
                {contractor.status === 'active' && !contractor.is_featured && (
                  <PaystackButton email={user.email!} contractorId={contractor.id} plan="featured" />
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Profile Details */}
          <Link href="/dashboard/contractor/profile" className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xl">🏢</div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">My Business Profile</h2>
                <p className="text-sm text-gray-500">Manage your bio, services, suburbs, and documents.</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">→</span>
          </Link>

          {/* Card 4: The Daily Grind (Leads) */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Your Job Leads</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">{leads.length} Total</span>
            </div>
            
            {leads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No leads yet. Keep your profile complete to show up in search results!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <li key={lead.id} className="py-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-bold text-gray-900 text-lg">
                          {lead.service_requests?.categories?.name || 'Service'} in {lead.service_requests?.suburbs?.name || 'Area'}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">From: {lead.service_requests?.guest_name || 'Client'}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-md ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                        {lead.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 italic">"{lead.service_requests?.description}"</p>
                    <div className="mt-4 flex flex-col sm:flex-row gap-4 text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">📞 {lead.service_requests?.guest_phone}</span>
                      <span className="flex items-center gap-2">✉️ {lead.service_requests?.guest_email}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* --- CLIENT VIEW --- */}
      {profile?.role === 'client' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link href="/dashboard/client/profile" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md hover:border-blue-300 transition-all group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">👤</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">My Details</h2>
              <p className="text-sm text-gray-500">Manage your contact info and address</p>
            </Link>

            <Link href="/dashboard/client/request" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md hover:border-green-300 transition-all group flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📝</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">New Request</h2>
              <p className="text-sm text-gray-500">Submit a new job for contractors to quote</p>
            </Link>

            <Link href="/dashboard/client/history" className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md hover:border-purple-300 transition-all group flex flex-col items-center text-center relative">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🧾</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">My History</h2>
              <p className="text-sm text-gray-500">View your past requests and receipts</p>
              {clientRequests.length > 0 && (
                <span className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {clientRequests.length}
                </span>
              )}
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">Find a Pro</h2>
            <form className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
              <select name="category" defaultValue={params.category || ''} className="flex-1 border border-gray-300 p-3 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Services</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <SuburbSearch suburbs={suburbs} defaultValue={params.suburb} />
              <button type="submit" className="bg-blue-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors shadow-sm">
                Search
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No contractors found matching your search.</p>
                </div>
              ) : (
                searchResults.map((c) => (
                  <Link href={`/contractors/${c.id}`} key={c.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all p-6 flex flex-col justify-between group">
                    <div>
                      {c.is_featured && (
                        <span className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-md mb-3">
                          ⭐ FEATURED PRO
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{c.business_name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-3 mb-4">{c.bio}</p>
                    </div>
                    <span className="text-blue-600 font-medium text-sm mt-2 flex items-center gap-1">
                      View Profile <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}