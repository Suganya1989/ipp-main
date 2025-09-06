import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { resourceId, url } = await request.json()
    
    if (!resourceId || !url) {
      return NextResponse.json({ error: 'resourceId and url are required' }, { status: 400 })
    }

    // Validate URL
    let targetUrl: URL
    try {
      targetUrl = new URL(url)
      if (!['http:', 'https:'].includes(targetUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the webpage with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      const response = await fetch(targetUrl.toString(), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
      }

      const html = await response.text()
      
      // Extract OG image using regex
      const ogImageRegex = /<meta\s+(?:property="og:image"[^>]*content="([^"]*)"[^>]*|content="([^"]*)"[^>]*property="og:image"[^>]*)/i
      const twitterImageRegex = /<meta\s+(?:name="twitter:image"[^>]*content="([^"]*)"[^>]*|content="([^"]*)"[^>]*name="twitter:image"[^>]*)/i
      
      let ogImage = ''
      
      // Try OG image first
      const ogMatch = html.match(ogImageRegex)
      if (ogMatch) {
        ogImage = ogMatch[1] || ogMatch[2]
      }
      
      // Fallback to Twitter image
      if (!ogImage) {
        const twitterMatch = html.match(twitterImageRegex)
        if (twitterMatch) {
          ogImage = twitterMatch[1] || twitterMatch[2]
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
            return NextResponse.json({ error: 'Invalid relative OG image URL' }, { status: 400 })
          }
        } else if (ogImage.startsWith('//')) {
          ogImage = `${targetUrl.protocol}${ogImage}`
        }

        // Validate the final image URL
        try {
          new URL(ogImage)
          return NextResponse.json({ resourceId, ogImage })
        } catch {
          return NextResponse.json({ error: 'Invalid OG image URL format' }, { status: 400 })
        }
      }

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
    return NextResponse.json({ error: 'Failed to extract OG image' }, { status: 500 })
  }
}
