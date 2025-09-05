import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    
    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
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

    // Fetch the webpage
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 })
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract OG image with fallbacks
    let ogImage = $('meta[property="og:image"]').attr('content') ||
                  $('meta[property="og:image:url"]').attr('content') ||
                  $('meta[name="twitter:image"]').attr('content') ||
                  $('meta[name="twitter:image:src"]').attr('content')

    if (ogImage) {
      // Handle relative URLs
      if (ogImage.startsWith('/')) {
        ogImage = `${targetUrl.protocol}//${targetUrl.host}${ogImage}`
      } else if (ogImage.startsWith('./') || !ogImage.startsWith('http')) {
        ogImage = new URL(ogImage, targetUrl.toString()).toString()
      }

      // Validate the image URL
      try {
        new URL(ogImage)
        return NextResponse.json({ ogImage })
      } catch {
        return NextResponse.json({ error: 'Invalid OG image URL' }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'No OG image found' }, { status: 404 })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('OG image extraction error:', message)
    return NextResponse.json({ error: 'Failed to extract OG image' }, { status: 500 })
  }
}
