'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin' // Added admin client

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const file = formData.get('file') as File
  const documentType = formData.get('document_type') as string

  if (!file || file.size === 0) {
    redirect('/dashboard/contractor/documents?error=Please select a file')
  }

  const fileExt = file.name.split('.').pop()
  const filePath = `${user.id}/${documentType}-${Date.now()}.${fileExt}`

  // 1. Upload file
  const { error: uploadError } = await supabase.storage
    .from('credentials')
    .upload(filePath, file)

  if (uploadError) {
    console.error(uploadError)
    redirect('/dashboard/contractor/documents?error=Failed to upload file')
  }

  // 2. Save record in DB
  const { error: dbError } = await supabase
    .from('contractor_credentials')
    .insert({
      contractor_id: user.id,
      document_type: documentType,
      file_url: filePath,
      status: 'pending'
    })

  if (dbError) {
    console.error(dbError)
    redirect('/dashboard/contractor/documents?error=Failed to save document record')
  }

  // 3. RE-VERIFICATION LOGIC: Flip their status back to pending
  const adminClient = createAdminClient()
  await adminClient
    .from('contractors')
    .update({ status: 'pending_verification' })
    .eq('id', user.id)

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard/contractor/profile?message=Document uploaded. Account requires re-verification.')
}
