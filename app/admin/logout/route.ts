import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

async function handle(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const url = new URL('/admin/login', request.url)
  return NextResponse.redirect(url, { status: 303 })
}

export async function POST(request: Request) {
  return handle(request)
}

export async function GET(request: Request) {
  return handle(request)
}
