import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { uploadDocument } from './actions'
import Link from 'next/link'

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch existing uploaded documents
  const { data: documents } = await supabase
    .from('contractor_credentials')
    .select('*')
    .eq('contractor_id', user.id)

  return (
    <div className="max-w-2xl mx-auto p-8">
      <Link href="/dashboard" className="text-blue-500 hover:underline mb-6 inline-block">
        ← Back to Dashboard
      </Link>
      
      <div className="bg-white border rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Verification Documents</h1>
        <p className="text-gray-500 mb-6 text-sm">
          To get verified, please upload a copy of your ID and your Trade Certificate.
        </p>
        
        <form action={uploadDocument} className="flex flex-col gap-4 border p-4 rounded-md bg-gray-50 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <select name="document_type" className="w-full rounded-md px-4 py-2 border" required>
              <option value="ID Document">ID Document / Passport</option>
              <option value="Trade Certificate">Trade Certificate</option>
              <option value="Proof of Address">Proof of Address</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Upload File (PDF or Image)</label>
            <input 
              type="file" 
              name="file" 
              accept=".pdf,image/*"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-gray-800 text-white rounded-md px-4 py-2 font-bold hover:bg-gray-900 mt-2"
          >
            Upload Document
          </button>
        </form>

        <h2 className="text-lg font-bold mb-4">Your Uploaded Documents</h2>
        {documents && documents.length > 0 ? (
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li key={doc.id} className="flex justify-between items-center p-3 border rounded-md">
                <span className="font-medium">{doc.document_type}</span>
                <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${
                  doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  doc.status === 'approved' ? 'bg-green-100 text-green-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {doc.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
        )}
      </div>
    </div>
  )
}