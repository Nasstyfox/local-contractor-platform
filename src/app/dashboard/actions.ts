'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateClientProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone })
    .eq('id', user.id)

  if (error) {
    console.error("Failed to update profile:", error)
    // We don't return anything, we just stop execution
    return
  }

  revalidatePath('/dashboard')
  // We don't return anything here either
}