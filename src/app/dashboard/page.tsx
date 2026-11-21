import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaystackButton from './contractor/billing/PaystackButton'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  let contractor = null
  let leads: any[] = []

  if (profile?.role === 'contractor') {
    const { data } = await supabase.from('contractors').select('*').eq('id', user.id).single()
    contractor = data

    // Fetch leads assigned to this contractor
    if (contractor) {
      const { data: leadsData } = await supabase
        .from('leads')
        .select(`
          id,
          status,
          created_at,
          service_requests (
            guest_name,
            guest_email,
            guest_phone,
            description,
            categories (name),
            suburbs (name)
          )
        `)
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false })
      
      if (leadsData) leads = leadsData
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          {profile?.role === 'admin' && (
            <Link href="/admin" className="text-sm font-bold bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-900">
              Admin Control Room
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button className="text-sm text-red-500 hover:underline">Sign Out</button>
          </form>
        </div>
      </div>

      <div className="bg-gray-50 border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <p><strong>Name:</strong> {profile?.full_name || 'Not set'}</p>
        <p><strong>Role:</strong> <span className="capitalize">{profile?.role}</span></p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      {profile?.role === 'contractor' && contractor && (
        <>
          {/* Status Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">Contractor Status</h2>
            <p><strong>Business Name:</strong> {contractor.business_name}</p>
            <p className="mt-2">
              <strong>Status:</strong>{' '}
              <span className={`uppercase text-xs font-bold px-2 py-1 rounded ${
                contractor.status === 'pending_verification' ? 'bg-yellow-200 text-yellow-800' :
                contractor.status === 'trial' ? 'bg-green-200 text-green-800' :
                contractor.status === 'active' ? 'bg-blue-200 text-blue-800' :
                'bg-red-200 text-red-800'
              }`}>
                {contractor.status.replace('_', ' ')}
              </span>
              {contractor.is_featured && (
                <span className="ml-2 bg-purple-200 text-purple-800 text-xs font-bold px-2 py-1 rounded uppercase">
                  ⭐ Featured Pro
                </span>
              )}
            </p>
            
            <div className="mt-6 pt-6 border-t border-blue-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-blue-800 font-medium mb-2">
                  {contractor.status === 'trial' && "You are on a 30-day free trial."}
                  {contractor.status === 'expired' && "Your trial has expired. Please subscribe to stay visible."}
                  {contractor.status === 'active' && "Your subscription is active. Thank you!"}
                  {contractor.status === 'pending_verification' && "Upload documents to get verified."}
                </p>
                <Link href="/dashboard/contractor/documents" className="text-sm font-medium text-blue-700 hover:underline">
                  Manage Verification Documents
                </Link>
              </div>

              {/* Billing Buttons */}
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

          {/* Inbox / Leads Box */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Your Job Leads</h2>
            {leads.length === 0 ? (
              <p className="text-gray-500 text-sm">No leads yet. Keep your profile complete to show up in search results!</p>
            ) : (
              <ul className="divide-y">
                {leads.map((lead) => (
                  <li key={lead.id} className="py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-800">
                          {lead.service_requests?.categories?.name || 'Service'} in {lead.service_requests?.suburbs?.name || 'Area'}
                        </span>
                        <p className="text-sm text-gray-500">From: {lead.service_requests?.guest_name || 'Client'}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {lead.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded mt-2 italic">"{lead.service_requests?.description}"</p>
                    <div className="mt-3 text-sm font-medium text-blue-600">
                      <p>📞 {lead.service_requests?.guest_phone}</p>
                      <p>✉️ {lead.service_requests?.guest_email}</p>
                    </div>
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