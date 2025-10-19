import { NextRequest, NextResponse } from 'next/server';
import { hybridSearchByTopicAndTags, semanticSearchByTopic, semanticSearchByMultipleConcepts } from '@/lib/weaviate-util';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get('topic') || '';
    const tags = searchParams.getAll('tags');
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchType = searchParams.get('type') || 'hybrid'; // 'hybrid', 'semantic', or 'concepts'
    const alpha = parseFloat(searchParams.get('alpha') || '0.5'); // Default to 0.5 for balanced search
    const certainty = parseFloat(searchParams.get('certainty') || '0.5'); // Lower threshold for broader results

    console.log(`[Semantic Search API] type=${searchType}, topic="${topic}", tags=${tags}, limit=${limit}`);

    let resources;

    switch (searchType) {
      case 'semantic':
        // Pure semantic search by topic
        resources = await semanticSearchByTopic(topic, limit, certainty);
        break;

      case 'concepts':
        // Semantic search with multiple concepts (topic + tags)
        const concepts = [topic, ...tags].filter(c => c && c.trim());
        resources = await semanticSearchByMultipleConcepts(concepts, limit, certainty);
        break;

      case 'hybrid':
      default:
        // Hybrid search (recommended) - combines semantic + keyword
        resources = await hybridSearchByTopicAndTags(topic, tags, limit, alpha);
        break;
    }

    return NextResponse.json({
      success: true,
      searchType,
      count: resources.length,
      resources,
    });

  } catch (error) {
    console.error('[Semantic Search API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        resources: [],
      },
      { status: 500 }
    );
  }
}
