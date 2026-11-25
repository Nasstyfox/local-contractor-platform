'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function closeLead(leadId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return

  // Update the lead status to 'closed' (only if it belongs to this contractor)
  await supabase
    .from('leads')
    .update({ status: 'closed' })
    .eq('id', leadId)
    .eq('contractor_id', user.id)

  // Refresh the dashboard to make the lead disappear
  revalidatePath('/dashboard')
}