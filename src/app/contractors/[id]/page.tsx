import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import LeadForm from './LeadForm'

export default async function ContractorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const resolvedParams = await params
  const { data: { user } } = await supabase.auth.getUser()

  const { data: contractor, error } = await supabase
    .from('contractors')
    .select(`
      *,
      profiles (full_name, phone),
      contractor_categories (category_id, categories (name)),
      contractor_suburbs (suburb_id, suburbs (name, city))
    `)
    .eq('id', resolvedParams.id)
    .single()

  if (error || !contractor || !['trial', 'active'].includes(contractor.status)) {
    notFound()
  }

  // Grab the first category and suburb to satisfy the database requirements
  const primaryCategory = contractor.contractor_categories?.[0]?.category_id || ''
  const primarySuburb = contractor.contractor_suburbs?.[0]?.suburb_id || ''

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          ← Back to Directory
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{contractor.business_name}</h1>
              <p className="text-gray-500">Contact: {contractor.profiles?.full_name}</p>
            </div>
            {contractor.is_featured && (
              <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded">
                ⭐ FEATURED PRO
              </span>
            )}
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-2">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{contractor.bio}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Services Offered</h2>
              <ul className="list-disc pl-5 text-gray-700">
                {contractor.contractor_categories?.map((cc: any, i: number) => (
                  <li key={i}>{cc.categories.name}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Areas Served</h2>
              <ul className="list-disc pl-5 text-gray-700">
                {contractor.contractor_suburbs?.map((cs: any, i: number) => (
                  <li key={i}>{cs.suburbs.name} ({cs.suburbs.city})</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Request a Quote</h2>
            <p className="text-sm text-gray-500 mb-4">Contact this professional directly to discuss your project.</p>
            
            <div className="bg-gray-50 border p-6 rounded-md">
              <LeadForm 
                contractorId={contractor.id} 
                categoryId={primaryCategory} 
                suburbId={primarySuburb} 
                isLoggedIn={!!user} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}