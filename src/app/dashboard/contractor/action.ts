'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createContractorProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const business_name = formData.get('business_name') as string
  const bio = formData.get('bio') as string
  const category_ids = formData.getAll('categories') as string[]
  const suburb_ids = formData.getAll('suburbs') as string[]

  // 1. Create the contractor profile
  const { error: contractorError } = await supabase
    .from('contractors')
    .insert({
      id: user.id,
      business_name,
      bio,
      status: 'pending_verification', // They start in pending status
    })

  if (contractorError) {
    console.error(contractorError)
    redirect('/dashboard/contractor/setup?error=Failed to create profile')
  }

  // 2. Link their categories
  if (category_ids.length > 0) {
    const categoryLinks = category_ids.map(id => ({ contractor_id: user.id, category_id: id }))
    await supabase.from('contractor_categories').insert(categoryLinks)
  }

  // 3. Link their suburbs
  if (suburb_ids.length > 0) {
    const suburbLinks = suburb_ids.map(id => ({ contractor_id: user.id, suburb_id: id }))
    await supabase.from('contractor_suburbs').insert(suburbLinks)
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}