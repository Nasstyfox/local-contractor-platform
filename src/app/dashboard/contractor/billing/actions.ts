'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { revalidatePath } from 'next/cache'

export async function verifyPayment(reference: string, contractorId: string, plan: string) {
  // 1. Verify with Paystack API
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    },
  })

  const data = await response.json()

  if (!data.status || data.data.status !== 'success') {
    return { success: false, error: 'Payment not successful' }
  }

  // 2. Update the database using the Admin Client
  const adminClient = createAdminClient()

  // Calculate 30 days from now
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)

  // Update Contractor Status
  const isFeatured = plan === 'featured'
  
  await adminClient
    .from('contractors')
    .update({ 
      status: 'active',
      is_featured: isFeatured, // Set to true if they bought Featured Pro
      paystack_customer_code: data.data.customer.customer_code
    })
    .eq('id', contractorId)

  // Create Subscription Record
  await adminClient
    .from('subscriptions')
    .insert({
      contractor_id: contractorId,
      plan_type: plan,
      status: 'active',
      paystack_subscription_code: data.data.reference,
      current_period_end: nextMonth.toISOString()
    })

  revalidatePath('/dashboard')
  revalidatePath('/') // Refresh the homepage so their featured status shows immediately
  return { success: true }
}