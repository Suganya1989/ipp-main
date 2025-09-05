import { NextResponse } from 'next/server'
import { getThemesWithCounts } from '@/lib/weaviate-util'

export async function GET() {
  try {
    const data = await getThemesWithCounts()
    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /themes error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
