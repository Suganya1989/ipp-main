import { NextResponse } from 'next/server'
import { getTagsWithCounts } from '@/lib/weaviate-util'

// Cache for tags data
let tagsCache: { data: any[], timestamp: number } | null = null
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now()

    // Check if we have valid cached data
    if (tagsCache && (now - tagsCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached tags data')
      return NextResponse.json({ data: tagsCache.data })
    }

    // Fetch fresh data from database
    console.log('Fetching fresh tags data from database')
    const data = await getTagsWithCounts()

    // Update cache
    tagsCache = {
      data: data,
      timestamp: now
    }

    return NextResponse.json({ data: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /tags error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
