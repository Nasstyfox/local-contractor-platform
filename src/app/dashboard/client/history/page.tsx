import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ClientHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all service requests made by this client, including the contractors who received them
  const { data: requestsData, error } = await supabase
    .from('service_requests')
    .select(`
      id,
      description,
      urgency,
      created_at,
      categories (name),
      suburbs (name),
      leads (
        id,
        status,
        contractors (
          business_name
        )
      )
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching history:", error)
  }

  // Cast to any to bypass the Supabase TypeScript join bug
  const requests: any[] = requestsData || []

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 min-h-screen">
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Job History</h1>
        <p className="text-gray-500 mt-1">Review all the service requests you have submitted.</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-4xl mb-4">🗂️</div>
          <p className="text-gray-500 text-lg mb-4">You haven't submitted any job requests yet.</p>
          <Link href="/dashboard/client/request" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors">
            Submit Your First Request
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => (
            <div key={req.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Receipt Header */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {req.categories?.name || 'Service'} in {req.suburbs?.name || 'Area'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Submitted on {new Date(req.created_at).toLocaleDateString('en-ZA', { 
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-md ${
                    req.urgency === 'Emergency' ? 'bg-red-100 text-red-800' : 
                    req.urgency === 'This Week' ? 'bg-orange-100 text-orange-800' : 
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {req.urgency}
                  </span>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Job Description</h4>
                  <p className="text-gray-800 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 italic">
                    "{req.description}"
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Sent To</h4>
                  {req.leads && req.leads.length > 0 ? (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {req.leads.map((lead: any) => (
                        <li key={lead.id} className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg">
                          <span className="font-medium text-gray-800 text-sm">
                            {lead.contractors?.business_name || 'Unknown Contractor'}
                          </span>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Notified
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No contractors matched this request at the time it was sent.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}