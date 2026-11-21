import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileForm from './ProfileForm'

export default async function ContractorProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: contractor } = await supabase.from('contractors').select('*').eq('id', user.id).single()

  // Fetch documents and generate secure 1-hour download links
  const { data: docs } = await supabase
    .from('contractor_credentials')
    .select('*')
    .eq('contractor_id', user.id)

  const docsWithUrls = docs ? await Promise.all(docs.map(async (doc) => {
    const { data } = await supabase.storage.from('credentials').createSignedUrl(doc.file_url, 3600)
    return { ...doc, signedUrl: data?.signedUrl }
  })) : []

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Business Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account details and verification documents.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm mb-8">
        <ProfileForm profile={profile} contractor={contractor} userEmail={user.email || ''} />
      </div>

      {/* Document Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Verification Documents</h2>
            <p className="text-sm text-gray-500">Documents you have uploaded for admin review.</p>
          </div>
          {/* This links back to the upload page we built earlier */}
          <Link href="/dashboard/contractor/documents" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors text-sm">
            + Upload New
          </Link>
        </div>

        {docsWithUrls.length === 0 ? (
          <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-3">
            {docsWithUrls.map((doc) => (
              <li key={doc.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <span className="font-bold text-gray-800 block">{doc.document_type}</span>
                  <span className={`text-xs font-bold uppercase ${doc.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {doc.status}
                  </span>
                </div>
                {doc.signedUrl && (
                  <a href={doc.signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline text-sm bg-white border border-gray-200 px-4 py-2 rounded-md shadow-sm">
                    Download
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}