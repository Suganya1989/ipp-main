import { NextResponse } from 'next/server'

// In-memory cache for OG images
const ogImageCache = new Map<string, { image: string; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

// Fallback image function

export async function POST(request: Request) {
  let resourceId: string | undefined
  try {
    const requestData = await request.json()
    resourceId = requestData.resourceId
    const url = requestData.url
    
    if (!resourceId || !url) {
      return NextResponse.json({ error: 'resourceId and url are required' }, { status: 400 })
    }

    // Check cache first
    const cached = ogImageCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({ resourceId, ogImage: cached.image })
    }

    // Validate URL
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      console.log(`Invalid URL provided: ${url}`)
      return NextResponse.json({ resourceId, ogImage: null })
    }

    // Fetch the webpage with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.log(`Failed to fetch URL ${url}: ${response.status} ${response.statusText}`)
        // Only use fallback for actual errors, not for bot protection
        if (response.status === 403 || response.status === 503) {
        
          return NextResponse.json({ resourceId, ogImage: null })
        }
        return NextResponse.json({ resourceId, ogImage: null })
      }

      const html = await response.text()
      console.log(`[OG-API] Successfully fetched HTML for ${url}, length: ${html.length}`)
      
      // Extract OG image using more flexible regex patterns
      const ogImageRegex = /<meta[^>]*(?:property=["']og:image["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*property=["']og:image["'])[^>]*>/i
      const twitterImageRegex = /<meta[^>]*(?:name=["']twitter:image["'][^>]*content=["']([^"']*)["']|content=["']([^"']*)["'][^>]*name=["']twitter:image["'])[^>]*>/i
      
      // Additional patterns for different formats
      const ogImageRegex2 = /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i
      const ogImageRegex3 = /<meta\s+content=["']([^"']*)["']\s+property=["']og:image["']/i
      
      let ogImage = ''
      
      // Try OG image with multiple patterns
      let ogMatch = html.match(ogImageRegex)
      if (!ogMatch) ogMatch = html.match(ogImageRegex2)
      if (!ogMatch) ogMatch = html.match(ogImageRegex3)
      
      if (ogMatch) {
        ogImage = ogMatch[1] || ogMatch[2]
        console.log(`[OG-API] Found OG image: ${ogImage}`)
      } else {
        console.log(`[OG-API] No OG image meta tag found with any pattern`)
        // Debug: show a sample of meta tags
        const metaTags = html.match(/<meta[^>]*>/gi)?.slice(0, 5) || []
        console.log(`[OG-API] Sample meta tags:`, metaTags)
      }
      
      // Fallback to Twitter image
      if (!ogImage) {
        const twitterMatch = html.match(twitterImageRegex)
        if (twitterMatch) {
          ogImage = twitterMatch[1] || twitterMatch[2]
          console.log(`[OG-API] Found Twitter image: ${ogImage}`)
        } else {
          console.log(`[OG-API] No Twitter image meta tag found`)
        }
      }

      if (ogImage) {
        // Handle relative URLs
        if (ogImage.startsWith('/')) {
          ogImage = `${targetUrl.protocol}//${targetUrl.host}${ogImage}`
        } else if (ogImage.startsWith('./') || (!ogImage.startsWith('http') && !ogImage.startsWith('//'))) {
          try {
            ogImage = new URL(ogImage, targetUrl.toString()).toString()
          } catch {
            console.log(`Invalid relative OG image URL: ${ogImage}`)
          
            return NextResponse.json({ resourceId, ogImage: null })
          }
        } else if (ogImage.startsWith('//')) {
          ogImage = `${targetUrl.protocol}${ogImage}`
        }

        // Validate the final image URL
        try {
          new URL(ogImage)
          // Cache the successful result
          ogImageCache.set(url, { image: ogImage, timestamp: Date.now() })
          return NextResponse.json({ resourceId, ogImage })
        } catch {
          console.log(`Invalid OG image URL format: ${ogImage}`)
          
          return NextResponse.json({ resourceId, ogImage: null })
        }
      }

      // No OG image found, use fallback=
      return NextResponse.json({ resourceId, ogImage: null })

    } catch (error: unknown) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({ resourceId, ogImage: null })
      }
      throw error
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Async OG image extraction error:', message)
    // Return success response with null ogImage instead of 500 error
    return NextResponse.json({ resourceId, ogImage: null })
  }
}
