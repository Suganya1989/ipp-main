import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch URL content' }, { status: 400 })
    }

    const html = await response.text()

    // First try to extract basic meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descriptionMatch = html.match(/<meta[^>]*name=['""]description['""][^>]*content=['""]([^'"]*)['""][^>]*>/i) ||
                            html.match(/<meta[^>]*content=['""]([^'"]*)['""][^>]*name=['""]description['""][^>]*>/i)
    const ogTitleMatch = html.match(/<meta[^>]*property=['""]og:title['""][^>]*content=['""]([^'"]*)['""][^>]*>/i)
    const ogDescriptionMatch = html.match(/<meta[^>]*property=['""]og:description['""][^>]*content=['""]([^'"]*)['""][^>]*>/i)

    // Use meta tags if available, otherwise fall back to OpenAI
    const metaTitle = ogTitleMatch?.[1] || titleMatch?.[1]
    const metaDescription = ogDescriptionMatch?.[1] || descriptionMatch?.[1]

    if (metaTitle && metaDescription) {
      return NextResponse.json({
        title: metaTitle.trim().substring(0, 100),
        summary: metaDescription.trim().substring(0, 300),
        success: true
      })
    }

    // Extract text content for OpenAI analysis (basic HTML stripping)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000) // Limit content length for API

    // Get cached tags for filtering suggestions
    const tagsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tags`)
    const tagsData = await tagsResponse.json()
    interface Tag {
      tag: string;
      count?: number;
    }
    const availableTags = tagsData.data?.map((tag: Tag) => tag.tag.toLowerCase()) || []

    // Use OpenAI to extract title, summary, and suggest relevant tags
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert at extracting key information from web content. Extract a clear, concise title and summary from the provided text. Also suggest 3-5 relevant keywords/tags that best describe the content. Focus on content related to prison reform, criminal justice, policy, or social issues. Return your response as JSON with 'title', 'summary', and 'suggestedTags' fields."
        },
        {
          role: "user",
          content: `Please extract a title, summary, and suggest relevant tags from this web content:\n\n${textContent}\n\nReturn only a JSON object with:\n- 'title': clear and descriptive (max 100 characters)\n- 'summary': informative and capture key points (max 300 characters)\n- 'suggestedTags': array of 3-5 relevant keywords/tags that describe the content\n\nAvailable tags to choose from: ${availableTags.slice(0, 50).join(', ')}`
        }
      ],
      temperature: 0.3,
      max_tokens: 700
    })

    const result = completion.choices[0]?.message?.content

    if (!result) {
      return NextResponse.json({ error: 'Failed to extract content' }, { status: 500 })
    }

    try {
      const extracted = JSON.parse(result)

      // Filter suggested tags to only include ones that exist in our database
      const suggestedTags = extracted.suggestedTags || []
      const filteredTags = suggestedTags.filter((tag: string) =>
        availableTags.includes(tag.toLowerCase())
      )

      return NextResponse.json({
        title: extracted.title || '',
        summary: extracted.summary || '',
        suggestedTags: filteredTags,
        success: true
      })
    } catch (parseError) {
      // If JSON parsing fails, try to extract manually
      const titleMatch = result.match(/"title":\s*"([^"]+)"/i)
      const summaryMatch = result.match(/"summary":\s*"([^"]+)"/i)
      const tagsMatch = result.match(/"suggestedTags":\s*\[([^\]]+)\]/i)

      let suggestedTags: string[] = []
      if (tagsMatch) {
        try {
          const tagsArray = JSON.parse(`[${tagsMatch[1]}]`)
          suggestedTags = tagsArray.filter((tag: string) =>
            availableTags.includes(tag.toLowerCase())
          )
        } catch {
          suggestedTags = []
        }
      }

      return NextResponse.json({
        title: titleMatch?.[1] || 'Extracted Content',
        summary: summaryMatch?.[1] || 'Summary could not be extracted',
        suggestedTags: suggestedTags,
        success: true
      })
    }

  } catch (error) {
    console.error('Error extracting URL content:', error)
    return NextResponse.json({
      error: 'Failed to extract content from URL',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}