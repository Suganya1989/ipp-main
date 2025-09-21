import { NextResponse } from 'next/server'
import { getThemesWithCounts, Category } from '@/lib/weaviate-util'

// Cache for themes data
let themesCache: { data: Category[], timestamp: number } | null = null
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now()

    // Check if we have valid cached data
    if (themesCache && (now - themesCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached themes data')
      return NextResponse.json({ data: themesCache.data })
    }

    // Fetch fresh data from database
    console.log('Fetching fresh themes data from database')
    const data = await getThemesWithCounts()

    // Update cache
    themesCache = {
      data: data,
      timestamp: now
    }

    return NextResponse.json({ data: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /themes error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
