'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateContractorDetails(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not logged in' }

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const email = formData.get('email') as string
  const business_name = formData.get('business_name') as string
  const bio = formData.get('bio') as string

  // 1. Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, phone, address })
    .eq('id', user.id)

  if (profileError) return { error: 'Failed to update profile.' }

  // 2. Update contractors table
  const { error: contractorError } = await supabase
    .from('contractors')
    .update({ business_name, bio })
    .eq('id', user.id)

  if (contractorError) return { error: 'Failed to update business details.' }

  // 3. Update Email if changed
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email })
    if (emailError) return { error: 'Failed to update email.' }
    
    revalidatePath('/dashboard/contractor/profile')
    return { success: 'Details updated! Please check your new email inbox to confirm the email change.' }
  }

  revalidatePath('/dashboard/contractor/profile')
  revalidatePath('/dashboard')
  return { success: 'Profile updated successfully.' }
}