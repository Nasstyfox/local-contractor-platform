import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { approveContractor, rejectContractor } from './actions'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verify the user is an admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch contractors pending verification, along with their profile info
  const { data: pendingContractors } = await supabase
    .from('contractors')
    .select(`
      *,
      profiles (full_name, phone)
    `)
    .eq('status', 'pending_verification')

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Control Room</h1>
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">Go to normal Dashboard</Link>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-800 text-white p-4">
          <h2 className="font-bold">Pending Verifications ({pendingContractors?.length || 0})</h2>
        </div>

        {!pendingContractors || pendingContractors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No contractors are currently pending verification. Good job!
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pendingContractors.map((contractor) => (
              <li key={contractor.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{contractor.business_name}</h3>
                    <p className="text-sm text-gray-500">Owner: {contractor.profiles?.full_name}</p>
                    <p className="text-sm text-gray-500">Phone: {contractor.profiles?.phone || 'Not provided'}</p>
                    <p className="mt-2 text-sm text-gray-700 max-w-xl">{contractor.bio}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <form action={rejectContractor.bind(null, contractor.id)}>
                      <button className="bg-red-100 text-red-700 px-4 py-2 rounded-md font-bold hover:bg-red-200 text-sm">
                        Reject
                      </button>
                    </form>
                    <form action={approveContractor.bind(null, contractor.id)}>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-md font-bold hover:bg-green-700 text-sm">
                        Approve & Start Trial
                      </button>
                    </form>
                  </div>
                </div>

                {/* Document Review Section */}
                <div className="mt-6 bg-gray-50 p-4 rounded-md border">
                  <h4 className="font-semibold text-sm mb-3">Uploaded Documents:</h4>
                  <DocumentList contractorId={contractor.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// A helper component to fetch and generate secure, temporary links for the files
async function DocumentList({ contractorId }: { contractorId: string }) {
  const supabase = await createClient()
  
  const { data: docs } = await supabase
    .from('contractor_credentials')
    .select('*')
    .eq('contractor_id', contractorId)

  if (!docs || docs.length === 0) return <p className="text-sm text-gray-500">No documents uploaded.</p>

  // Generate secure signed URLs that expire in 1 hour
  const docsWithUrls = await Promise.all(docs.map(async (doc) => {
    const { data } = await supabase.storage
      .from('credentials')
      .createSignedUrl(doc.file_url, 3600) // 1 hour expiration
    
    return { ...doc, signedUrl: data?.signedUrl }
  }))

  return (
    <ul className="space-y-2">
      {docsWithUrls.map((doc) => (
        <li key={doc.id} className="text-sm flex items-center gap-4">
          <span className="font-medium w-40">{doc.document_type}</span>
          {doc.signedUrl ? (
            <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              View File ↗
            </a>
          ) : (
            <span className="text-red-500">Error loading file</span>
          )}
        </li>
      ))}
    </ul>
  )
}