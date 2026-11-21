import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { approveContractor, rejectContractor } from './actions'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: pendingContractors } = await supabase
    .from('contractors')
    .select(`
      *,
      profiles (full_name, phone)
    `)
    .eq('status', 'pending_verification')

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 min-h-screen bg-gray-50">
      
      {/* Consistent Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Control Room</h1>
          <p className="text-sm text-gray-500 mt-1">Review and approve pending contractors</p>
        </div>
        <Link href="/dashboard" className="text-sm font-bold bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all shadow-sm">
          Back to Dashboard
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
          <h2 className="font-bold text-lg">Pending Verifications</h2>
          <span className="bg-white text-gray-900 text-sm font-bold px-3 py-1 rounded-md">{pendingContractors?.length || 0}</span>
        </div>

        {!pendingContractors || pendingContractors.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg mb-2">No contractors are currently pending verification.</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {pendingContractors.map((contractor) => (
              <li key={contractor.id} className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{contractor.business_name}</h3>
                    <p className="text-sm text-gray-600 mt-1">Owner: {contractor.profiles?.full_name}</p>
                    <p className="text-sm text-gray-600">Phone: {contractor.profiles?.phone || 'Not provided'}</p>
                    <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-100">{contractor.bio}</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex md:flex-col gap-3 w-full md:w-auto">
                    <form action={approveContractor.bind(null, contractor.id)} className="w-full">
                      <button className="w-full bg-green-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm text-sm">
                        Approve
                      </button>
                    </form>
                    <form action={rejectContractor.bind(null, contractor.id)} className="w-full">
                      <button className="w-full bg-white border border-red-200 text-red-600 px-5 py-2.5 rounded-lg font-bold hover:bg-red-50 transition-colors text-sm">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>

                {/* Document Review Section */}
                <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-800 text-sm mb-4">Uploaded Documents:</h4>
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

async function DocumentList({ contractorId }: { contractorId: string }) {
  const supabase = await createClient()
  
  const { data: docs } = await supabase
    .from('contractor_credentials')
    .select('*')
    .eq('contractor_id', contractorId)

  if (!docs || docs.length === 0) return <p className="text-sm text-gray-500">No documents uploaded.</p>

  const docsWithUrls = await Promise.all(docs.map(async (doc) => {
    const { data } = await supabase.storage
      .from('credentials')
      .createSignedUrl(doc.file_url, 3600)
    return { ...doc, signedUrl: data?.signedUrl }
  }))

  return (
    <ul className="space-y-3">
      {docsWithUrls.map((doc) => (
        <li key={doc.id} className="text-sm flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
          <span className="font-medium text-gray-700">{doc.document_type}</span>
          {doc.signedUrl ? (
            <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
              View File ↗
            </a>
          ) : (
            <span className="text-red-500 font-bold">Error loading</span>
          )}
        </li>
      ))}
    </ul>
  )
}