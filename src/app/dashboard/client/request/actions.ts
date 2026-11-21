'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function broadcastRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const category_id = formData.get('category') as string
  const suburb_id = formData.get('suburb') as string
  const description = formData.get('description') as string
  const urgency = formData.get('urgency') as string

  if (!category_id || !suburb_id) {
    return { error: 'Please select a category and a suburb.' }
  }

  // 1. Get the client's profile to grab their name/phone for the lead
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // 2. Create the Service Request
  const adminClient = createAdminClient()
  const { data: request, error: requestError } = await adminClient
    .from('service_requests')
    .insert({
      client_id: user.id,
      guest_name: profile?.full_name,
      guest_email: user.email,
      guest_phone: profile?.phone,
      category_id,
      suburb_id,
      description,
      urgency
    })
    .select()
    .single()

  if (requestError) {
    console.error(requestError)
    return { error: 'Failed to create request.' }
  }

  // 3. Find ALL matching contractors (Active or Trial)
  const { data: matchedContractors } = await adminClient
    .from('contractors')
    .select(`
      id,
      contractor_categories!inner(category_id),
      contractor_suburbs!inner(suburb_id)
    `)
    .in('status', ['trial', 'active'])
    .eq('contractor_categories.category_id', category_id)
    .eq('contractor_suburbs.suburb_id', suburb_id)

  // 4. Dispatch the lead to all matched contractors
  if (matchedContractors && matchedContractors.length > 0) {
    const leadsToInsert = matchedContractors.map((c) => ({
      request_id: request.id,
      contractor_id: c.id,
      status: 'new'
    }))

    await adminClient.from('leads').insert(leadsToInsert)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/client/history')
  redirect('/dashboard/client/history')
}