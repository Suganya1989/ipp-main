# Weaviate Semantic Search Configuration Guide

## Current Status

The `DocsWithImages` collection is currently **NOT configured with a vectorizer**, which means:

- ❌ `nearText` queries are not supported (cause GraphQL errors)
- ❌ `hybrid` search falls back to BM25 keyword search only
- ✅ BM25 keyword search works fine
- ✅ All filter-based queries work

**Current Workaround**: The codebase has been updated to use BM25 keyword search as a fallback for all semantic/hybrid search functions.

## How to Enable True Semantic Search

To enable true semantic search with vector embeddings, you need to configure the `DocsWithImages` collection with a text vectorizer module.

### Step 1: Configure Weaviate with OpenAI Vectorizer

Add the text2vec-openai module to your collection schema:

```typescript
import weaviate from 'weaviate-ts-client';

async function recreateCollectionWithVectorizer() {
  const client = weaviate.client({
    scheme: 'https',
    host: 'your-weaviate-instance.weaviate.network',
    apiKey: { apiKey: process.env.WEAVIATE_API_KEY },
    headers: { 'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY }
  });

  // Delete existing collection (WARNING: This deletes all data!)
  try {
    await client.schema.classDeleter().withClassName('DocsWithImages').do();
  } catch (e) {
    // Collection might not exist
  }

  // Create new collection with vectorizer
  const classObj = {
    class: 'DocsWithImages',
    vectorizer: 'text2vec-openai',
    moduleConfig: {
      'text2vec-openai': {
        model: 'text-embedding-3-small',  // Fast and cost-effective
        modelVersion: '002',
        type: 'text',
        vectorizeClassName: false
      }
    },
    properties: [
      {
        name: 'source_title',
        dataType: ['text'],
        moduleConfig: {
          'text2vec-openai': {
            skip: false,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: 'summary',
        dataType: ['text'],
        moduleConfig: {
          'text2vec-openai': {
            skip: false,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: 'keywords',
        dataType: ['text'],
        moduleConfig: {
          'text2vec-openai': {
            skip: false,
            vectorizePropertyName: false
          }
        }
      },
      {
        name: 'theme',
        dataType: ['text']
      },
      {
        name: 'subTheme',
        dataType: ['text']
      },
      {
        name: 'sourceType',
        dataType: ['text']
      },
      {
        name: 'sourcePlatform',
        dataType: ['text']
      },
      {
        name: 'authors',
        dataType: ['text']
      },
      {
        name: 'dateOfPublication',
        dataType: ['date']
      },
      {
        name: 'location',
        dataType: ['text']
      },
      {
        name: 'image',
        dataType: ['text'],
        moduleConfig: {
          'text2vec-openai': {
            skip: true  // Don't vectorize image URLs
          }
        }
      },
      {
        name: 'imageUrl',
        dataType: ['text'],
        moduleConfig: {
          'text2vec-openai': {
            skip: true
          }
        }
      },
      {
        name: 'linkToOriginalSource',
        dataType: ['text'],
        moduleConfig: {
          'text2vec-openai': {
            skip: true
          }
        }
      }
    ]
  };

  await client.schema.classCreator().withClass(classObj).do();
  console.log('✅ DocsWithImages collection created with text2vec-openai vectorizer');
}
```

### Step 2: Re-import Your Data

After recreating the collection, you'll need to re-import all your prison portal data. The vectorizer will automatically generate embeddings for each document.

### Step 3: Restore True Semantic Search Functions

Once the vectorizer is configured, you can restore the original semantic search functions that use `nearText` and `hybrid` queries:

```typescript
// Example: True semantic search with nearText
export async function semanticSearchByTopic(
  topic: string,
  limit: number = 20,
  certainty: number = 0.7
): Promise<PrisonResource[]> {
  const client = getClient();
  const res = await client.graphql
    .get()
    .withClassName('DocsWithImages')
    .withFields('...')
    .withNearText({
      concepts: [topic],
      certainty: certainty
    })
    .withLimit(limit)
    .do();
  // ... process results
}

// Example: True hybrid search
export async function hybridSearchByTopicAndTags(
  topic: string,
  tags: string[] = [],
  limit: number = 20,
  alpha: number = 0.5
): Promise<PrisonResource[]> {
  const client = getClient();
  const searchConcepts = [topic, ...tags].filter(c => c && c.trim()).join(' ');

  const res = await client.graphql
    .get()
    .withClassName('DocsWithImages')
    .withFields('...')
    .withHybrid({
      query: searchConcepts,
      alpha: alpha  // 0=pure keyword, 1=pure vector, 0.5=balanced
    })
    .withLimit(limit)
    .do();
  // ... process results
}
```

## Alternative: Use Weaviate Cloud with Pre-configured Modules

If you're using Weaviate Cloud Services (WCS):

1. When creating your cluster, ensure you enable the `text2vec-openai` module
2. Provide your OpenAI API key in the WCS dashboard or via headers
3. Configure your collection schema to use the vectorizer as shown above

## Benefits of True Semantic Search

Once configured properly:

- ✅ **Conceptual matching**: Find documents based on meaning, not just keywords
- ✅ **Better search quality**: "prisoner rights" will find documents about "inmate welfare"
- ✅ **Hybrid search**: Combines BM25 keyword + vector semantic for best results
- ✅ **Similarity threshold**: Control result quality with certainty/distance parameters

## Cost Considerations

Using OpenAI's text-embedding-3-small:
- Cost: ~$0.02 per 1M tokens
- For 10,000 documents averaging 500 tokens each: ~$0.10 total
- Very affordable for most use cases

## References

- [Weaviate Modules Documentation](https://weaviate.io/developers/weaviate/modules/retriever-vectorizer-modules/text2vec-openai)
- [OpenAI Embeddings Pricing](https://openai.com/pricing)
- [Hybrid Search Guide](https://weaviate.io/developers/weaviate/search/hybrid)
