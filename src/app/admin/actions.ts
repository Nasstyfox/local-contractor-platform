'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function approveContractor(contractorId: string) {
  const supabase = await createClient()

  // Calculate 30 days from today for the trial end
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 30)

  // 1. Update the contractor's status to 'trial'
  const { error: contractorError } = await supabase
    .from('contractors')
    .update({ 
      status: 'trial',
      trial_ends_at: trialEndsAt.toISOString()
    })
    .eq('id', contractorId)

  if (contractorError) console.error(contractorError)

  // 2. Mark all their documents as 'approved'
  await supabase
    .from('contractor_credentials')
    .update({ status: 'approved' })
    .eq('contractor_id', contractorId)

  revalidatePath('/admin')
}

export async function rejectContractor(contractorId: string) {
  const supabase = await createClient()

  // Update the contractor's status to 'rejected'
  await supabase
    .from('contractors')
    .update({ status: 'rejected' })
    .eq('id', contractorId)

  revalidatePath('/admin')
}