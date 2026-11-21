'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function uploadDocument(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const file = formData.get('file') as File
  const documentType = formData.get('document_type') as string

  if (!file || file.size === 0) {
    redirect('/dashboard/contractor/documents?error=Please select a file')
  }

  // 1. Upload file to Supabase Storage
  // We save it as: credentials/{user_id}/{document_type}-{timestamp}.pdf
  const fileExt = file.name.split('.').pop()
  const filePath = `${user.id}/${documentType}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('credentials')
    .upload(filePath, file)

  if (uploadError) {
    console.error(uploadError)
    redirect('/dashboard/contractor/documents?error=Failed to upload file')
  }

  // 2. Save the record in the database
  const { error: dbError } = await supabase
    .from('contractor_credentials')
    .insert({
      contractor_id: user.id,
      document_type: documentType,
      file_url: filePath, // We store the path, not the public URL (because it's private)
      status: 'pending'
    })

  if (dbError) {
    console.error(dbError)
    redirect('/dashboard/contractor/documents?error=Failed to save document record')
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard?message=Document uploaded successfully')
}