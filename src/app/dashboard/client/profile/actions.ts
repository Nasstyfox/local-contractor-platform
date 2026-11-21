'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClientDetails(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not logged in' }

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const email = formData.get('email') as string

  // 1. Update the profiles table (Name, Phone, Address)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, phone, address })
    .eq('id', user.id)

  if (profileError) {
    console.error(profileError)
    return { error: 'Failed to update profile.' }
  }

  // 2. Update Email (if they changed it)
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email })
    
    if (emailError) {
      console.error(emailError)
      return { error: 'Failed to update email. It may already be in use.' }
    }
    
    revalidatePath('/dashboard/client/profile')
    revalidatePath('/dashboard')
    // Supabase requires email confirmation for email changes
    return { success: 'Profile updated! Please check your new email inbox to confirm the email change.' }
  }

  revalidatePath('/dashboard/client/profile')
  revalidatePath('/dashboard')
  return { success: 'Profile updated successfully.' }
}