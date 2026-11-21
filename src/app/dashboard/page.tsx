import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaystackButton from './contractor/billing/PaystackButton'
import Link from 'next/link'
import { updateClientProfile } from './actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  let contractor = null
  let leads: any[] = []
  let clientRequests: any[] = []

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
    const { data: requestsData } = await supabase
      .from('service_requests')
      .select(`
        id,
        description,
        created_at,
        categories (name),
        suburbs (name),
        leads (
          contractors (business_name)
        )
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      
    if (requestsData) clientRequests = requestsData
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 min-h-screen">
      
      {/* Consistent Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200 gap-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
        
        <div className="flex items-center gap-3">
          {profile?.role === 'admin' && (
            <Link href="/admin" className="text-sm font-bold bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all shadow-sm">
              Admin Control Room
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-5 py-2.5 rounded-lg transition-all">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* --- ADMIN & CONTRACTOR PROFILE CARD --- */}
      {profile?.role !== 'client' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500 block mb-1">Name</span> <span className="font-medium text-gray-900">{profile?.full_name || 'Not set'}</span></div>
            <div><span className="text-gray-500 block mb-1">Role</span> <span className="font-medium text-gray-900 capitalize">{profile?.role}</span></div>
            <div><span className="text-gray-500 block mb-1">Email</span> <span className="font-medium text-gray-900">{user.email}</span></div>
          </div>
        </div>
      )}

      {/* --- CONTRACTOR VIEW --- */}
      {profile?.role === 'contractor' && contractor && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Contractor Status</h2>
                <p className="text-gray-600">{contractor.business_name}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`uppercase text-xs font-extrabold px-3 py-1 rounded-md tracking-wider ${
                  contractor.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                  contractor.status === 'trial' ? 'bg-green-100 text-green-800' :
                  contractor.status === 'active' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {contractor.status.replace('_', ' ')}
                </span>
                {contractor.is_featured && (
                  <span className="bg-purple-100 text-purple-800 text-xs font-extrabold px-3 py-1 rounded-md tracking-wider">
                    ⭐ FEATURED PRO
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">
                  {contractor.status === 'trial' && "You are on a 30-day free trial."}
                  {contractor.status === 'expired' && "Your trial has expired. Please subscribe to stay visible."}
                  {contractor.status === 'active' && "Your subscription is active. Thank you!"}
                  {contractor.status === 'pending_verification' && "Upload documents to get verified."}
                </p>
                <Link href="/dashboard/contractor/documents" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                  Manage Verification Documents
                </Link>
              </div>

              <div className="flex gap-3">
                {(contractor.status === 'trial' || contractor.status === 'expired') && (
                  <PaystackButton email={user.email!} contractorId={contractor.id} plan="standard" />
                )}
                {contractor.status === 'active' && !contractor.is_featured && (
                  <PaystackButton email={user.email!} contractorId={contractor.id} plan="featured" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Your Job Leads</h2>
            {leads.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No leads yet. Keep your profile complete to show up in search results!</p>
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
        </>
      )}

      {/* --- CLIENT VIEW --- */}
      {profile?.role === 'client' && (
        <>
          {/* Client Details Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">My Details</h2>
              <Link href="/" className="text-sm font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                + Find a New Pro
              </Link>
            </div>
            <p className="text-sm text-gray-500 mb-4">Contractors will use these details to contact you about your jobs.</p>
            
            <form action={updateClientProfile} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input name="full_name" defaultValue={profile.full_name || ''} required className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input name="phone" defaultValue={profile.phone || ''} required className="w-full border border-gray-300 p-2.5 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              </div>
              <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-md font-bold hover:bg-gray-800 transition-colors w-full sm:w-auto">
                Save Details
              </button>
            </form>
          </div>

          {/* Client Job History */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">My Service Requests</h2>
            {clientRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven't requested any jobs yet.</p>
                <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                  Browse Contractors
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {clientRequests.map((req) => (
                  <li key={req.id} className="py-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-900 text-lg">
                          {req.categories?.name || 'Service'} in {req.suburbs?.name || 'Area'}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Sent to: <span className="font-medium text-gray-700">{req.leads?.[0]?.contractors?.business_name || 'Contractor'}</span>
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-md">
                        {new Date(req.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 italic mt-3">"{req.description}"</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}