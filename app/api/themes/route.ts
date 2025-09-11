import { NextResponse } from 'next/server'
import { getThemesWithCounts, Category } from '@/lib/weaviate-util'

// Cache for themes data
let themesCache: { data: Category[], timestamp: number } | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now()
    
    // Check if we have valid cached data
    if (themesCache && (now - themesCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached themes data')
      return NextResponse.json({ data: themesCache.data })
    }
    
    // Fetch fresh data
    console.log('Fetching fresh themes data')
    const data = await getThemesWithCounts()
    // Limit to top 8 themes based on count
    const limitedData = data.slice(0, 8)
    
    // Update cache
    themesCache = {
      data: limitedData,
      timestamp: now
    }
    
    return NextResponse.json({ data: limitedData })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /themes error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
