import { NextResponse } from 'next/server'
import { getLocations } from '@/lib/weaviate-util'

// Cache for locations data
let locationsCache: { data: string[], timestamp: number } | null = null
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

export async function GET() {
  try {
    const now = Date.now()

    // Check if we have valid cached data
    if (locationsCache && (now - locationsCache.timestamp) < CACHE_DURATION) {
      console.log('Returning cached locations data')
      return NextResponse.json({ data: locationsCache.data })
    }

    // Fetch fresh data from database
    console.log('Fetching fresh locations data from database')
    const data = await getLocations()

    // Update cache
    locationsCache = {
      data: data,
      timestamp: now
    }

    return NextResponse.json({ data: data })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('API /locations error', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
