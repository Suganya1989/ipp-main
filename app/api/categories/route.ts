import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/weaviate-util'

export async function GET() {
  try {
    const data = await getCategories()
    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /categories error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
