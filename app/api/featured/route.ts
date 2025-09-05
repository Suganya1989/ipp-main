import { NextResponse } from 'next/server'
import { getFeaturedResources } from '@/lib/weaviate-util'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') ?? '5')
    const data = await getFeaturedResources(limit)
    return NextResponse.json({ data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /featured error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
