'use client'

import { useState } from 'react'
import PaystackPop from '@paystack/inline-js'
import { useRouter } from 'next/navigation'
import { verifyPayment } from './actions'

export default function PaystackButton({ 
  email, 
  contractorId,
  plan = 'standard'
}: { 
  email: string, 
  contractorId: string,
  plan?: 'standard' | 'featured'
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handlePayment = () => {
    setLoading(true)
    const paystack = new PaystackPop()
    
    // Set amount based on plan: R100 (10000) or R250 (25000)
    const amount = plan === 'featured' ? 25000 : 10000
    const planName = plan === 'featured' ? 'Featured Pro' : 'Standard'

    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
      email: email,
      amount: amount,
      currency: 'ZAR',
      metadata: {
        contractor_id: contractorId,
        plan_type: plan,
        custom_fields: [
          {
            display_name: "Subscription",
            variable_name: "subscription",
            value: planName
          }
        ]
      },
      onSuccess: async (transaction) => {
        const result = await verifyPayment(transaction.reference, contractorId, plan)
        if (result.success) {
          alert(`Payment successful! You are now on the ${planName} plan.`)
          router.refresh()
        } else {
          alert("Payment verification failed. Please contact support.")
        }
        setLoading(false)
      },
      onCancel: () => {
        setLoading(false)
      }
    })
  }

  const buttonText = plan === 'featured' ? 'Upgrade to Featured (R250/mo)' : 'Pay R100 / Month'
  const buttonColor = plan === 'featured' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'

  return (
    <button 
      onClick={handlePayment} 
      disabled={loading}
      className={`${buttonColor} text-white px-6 py-3 rounded-md font-bold disabled:opacity-50`}
    >
      {loading ? 'Processing...' : buttonText}
    </button>
  )
}