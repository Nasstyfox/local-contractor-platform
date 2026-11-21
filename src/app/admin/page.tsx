import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // 1. Verify Admin Access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') redirect('/dashboard')

  // 2. Build the Query
  let query = supabase
    .from('profiles')
    .select(`
      *,
      contractors (status, business_name)
    `)
    .order('created_at', { ascending: false })

  // Apply Search Filter (Name, Email, or Phone)
  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,phone.ilike.%${params.q}%`)
    // Note: Email is in auth.users, not profiles, so we can only search name/phone directly here.
    // We will filter by role to help narrow it down.
  }

  // Apply Role Filter
  if (params.role && params.role !== 'all') {
    query = query.eq('role', params.role)
  }

  const { data: users } = await query

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Control Room</h1>
          <p className="text-sm text-gray-500 mt-1">Manage users, verify contractors, and track history.</p>
        </div>
        <Link href="/dashboard" className="text-sm font-bold bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
          Back to Dashboard
        </Link>
      </div>

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
              {users?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                users?.map((u) => (
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
  )
}