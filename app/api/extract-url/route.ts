import { NextRequest, NextResponse } from 'next/server'
import { chromium } from 'playwright'

async function fetchWithPlaywright(url: string): Promise<string> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    const page = await context.newPage()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    const html = await page.content()
    await browser.close()
    return html
  } catch (error) {
    await browser.close()
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    let html = ''

    // Try regular fetch first
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        redirect: 'follow'
      })

      if (!response.ok) {
        throw new Error('Fetch failed, trying Playwright')
      }

      html = await response.text()
    } catch (fetchError) {
      // Fallback to Playwright if regular fetch fails
      console.log('Regular fetch failed, using Playwright...', fetchError)
      try {
        html = await fetchWithPlaywright(url)
      } catch (playwrightError) {
        console.error('Playwright also failed:', playwrightError)
        return NextResponse.json({
          error: 'Failed to fetch URL content',
          details: playwrightError instanceof Error ? playwrightError.message : String(playwrightError)
        }, { status: 400 })
      }
    }

    // Extract OG image from HTML
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["'][^>]*>/i)

    const image = ogImageMatch?.[1] || ''

    return NextResponse.json({
      image: image,
      success: true
    })

  } catch (error) {
    console.error('Error extracting URL content:', error)
    return NextResponse.json({
      error: 'Failed to extract content from URL',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
