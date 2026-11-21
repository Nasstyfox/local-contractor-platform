import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { approveContractor, rejectContractor } from '../../actions'

export default async function AdminUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const resolvedParams = await params

  // Verify Admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: adminProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (adminProfile?.role !== 'admin') redirect('/dashboard')

  // Fetch the user's base profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (error || !profile) notFound()

  let contractor: any = null
  let documents: any[] = []
  let history: any[] = []

  // Fetch specific data if it's a contractor
  if (profile.role === 'contractor') {
    const { data: c } = await supabase.from('contractors').select('*').eq('id', profile.id).single()
    contractor = c

    // Fetch their documents
    const { data: docs } = await supabase.from('contractor_credentials').select('*').eq('contractor_id', profile.id)
    documents = await Promise.all((docs || []).map(async (doc) => {
      const { data } = await supabase.storage.from('credentials').createSignedUrl(doc.file_url, 3600)
      return { ...doc, signedUrl: data?.signedUrl }
    }))

    // Fetch their leads (receipts)
    const { data: leads } = await supabase
      .from('leads')
      .select(`
        id, status, created_at,
        service_requests (
          description, guest_name,
          categories (name), suburbs (name)
        )
      `)
      .eq('contractor_id', profile.id)
      .order('created_at', { ascending: false })
    history = leads || []
  }

  // Fetch specific data if it's a client
  if (profile.role === 'client') {
    const { data: requests } = await supabase
      .from('service_requests')
      .select(`
        id, description, created_at, urgency,
        categories (name), suburbs (name),
        leads ( contractors (business_name) )
      `)
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })
    history = requests || []
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 min-h-screen bg-gray-50">
      <div className="mb-8">
        <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to User Directory
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{profile.full_name}</h1>
            <p className="text-gray-500">{profile.phone || 'No phone provided'} • {profile.address || 'No address provided'}</p>
          </div>
          <span className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm capitalize">
            {profile.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column (Contractor Specific) */}
        {profile.role === 'contractor' && contractor && (
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4 pb-2 border-b">Verification Status</h2>
              <div className="flex flex-col gap-3 mb-4">
                <span className={`uppercase text-xs font-extrabold px-3 py-1 rounded-md text-center tracking-wider ${
                  contractor.status === 'pending_verification' ? 'bg-yellow-100 text-yellow-800' :
                  contractor.status === 'trial' ? 'bg-green-100 text-green-800' :
                  contractor.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                }`}>
                  {contractor.status.replace('_', ' ')}
                </span>
                {contractor.is_featured && <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-md text-center">⭐ FEATURED</span>}
              </div>

              {contractor.status === 'pending_verification' && (
                <div className="flex flex-col gap-2 mt-4">
                  <form action={approveContractor.bind(null, contractor.id)}>
                    <button className="w-full bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 text-sm">Approve</button>
                  </form>
                  <form action={rejectContractor.bind(null, contractor.id)}>
                    <button className="w-full bg-white border border-red-200 text-red-600 py-2 rounded-lg font-bold hover:bg-red-50 text-sm">Reject</button>
                  </form>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="font-bold text-gray-800 mb-4 pb-2 border-b">Documents</h2>
              {documents.length === 0 ? <p className="text-sm text-gray-500">No docs uploaded.</p> : (
                <ul className="space-y-3">
                  {documents.map(doc => (
                    <li key={doc.id} className="text-sm flex justify-between items-center bg-gray-50 p-2 rounded border">
                      <span className="font-medium text-gray-700">{doc.document_type}</span>
                      {doc.signedUrl && <a href={doc.signedUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline">View</a>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Right Column (History for both) */}
        <div className={profile.role === 'contractor' ? 'md:col-span-2' : 'md:col-span-3'}>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-bold text-gray-800 text-lg mb-4 pb-2 border-b">Platform History</h2>
            
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No history on the platform yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {history.map((item: any) => (
                  <li key={item.id} className="py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-gray-900">
                          {profile.role === 'contractor' ? (
                            <>{item.service_requests?.categories?.name} in {item.service_requests?.suburbs?.name}</>
                          ) : (
                            <>{item.categories?.name} in {item.suburbs?.name}</>
                          )}
                        </span>
                        <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                        {profile.role === 'contractor' ? 'Lead Received' : item.urgency}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">
                      "{profile.role === 'contractor' ? item.service_requests?.description : item.description}"
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}