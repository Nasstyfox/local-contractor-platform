'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitLead(formData: FormData) {
  const contractorId = formData.get('contractor_id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const description = formData.get('description') as string
  
  // We need the category and suburb to satisfy the database schema
  const categoryId = formData.get('category_id') as string
  const suburbId = formData.get('suburb_id') as string

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Use the Admin client to bypass RLS for secure background inserts
  const adminClient = createAdminClient()

  // 1. Create the Service Request
  const { data: request, error: requestError } = await adminClient
    .from('service_requests')
    .insert({
      client_id: user?.id || null, // Link to account if logged in
      guest_name: user ? null : name,
      guest_email: user?.email || email,
      guest_phone: phone,
      category_id: categoryId,
      suburb_id: suburbId,
      description: description,
    })
    .select()
    .single()

  if (requestError) {
    console.error("Request Error:", requestError)
    return { error: "Failed to submit request." }
  }

  // 2. Dispatch the Lead to this specific contractor
  const { error: leadError } = await adminClient
    .from('leads')
    .insert({
      request_id: request.id,
      contractor_id: contractorId,
      status: 'new',
    })

  if (leadError) {
    console.error("Lead Error:", leadError)
    return { error: "Failed to dispatch lead." }
  }

  revalidatePath(`/contractors/${contractorId}`)
  return { success: true }
}