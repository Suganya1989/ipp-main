import weaviate from 'weaviate-ts-client';

async function checkSchema() {
  try {
    const raw = process.env.WEAVIATE_URL || process.env.WEAVIATE_HOST || "";
    const apiKey = process.env.WEAVIATE_API_KEY || "";
    const openaiKey = process.env.OPENAI_API_KEY || "";

    if (!raw || !apiKey) {
      console.error('Missing WEAVIATE_URL and WEAVIATE_API_KEY in environment');
      process.exit(1);
    }

    // Parse the URL
    let scheme: 'http' | 'https' = 'https';
    let host = raw.trim();
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      scheme = (u.protocol.replace(':', '') as 'http' | 'https') || 'https';
      host = u.host;
    }

    const client = weaviate.client({
      scheme,
      host,
      apiKey: { apiKey },
      headers: { 'X-OpenAI-Api-Key': openaiKey },
    });

    console.log('Fetching Weaviate schema...\n');
    const schema = await client.schema.getter().do();

    const docsClass = schema.classes?.find((c: any) => c.class === 'DocsWithImages');

    if (!docsClass) {
      console.error('❌ DocsWithImages collection not found!');
      console.log('\nAvailable collections:', schema.classes?.map((c: any) => c.class).join(', '));
      return;
    }

    console.log('✅ Found DocsWithImages collection\n');
    console.log('Current Configuration:');
    console.log('=====================');
    console.log('Vectorizer:', docsClass.vectorizer || 'none');
    console.log('Vector Index Type:', docsClass.vectorIndexType || 'hnsw');
    console.log('\nModule Config:', JSON.stringify(docsClass.moduleConfig, null, 2));

    console.log('\nProperties:');
    docsClass.properties?.forEach((prop: any) => {
      console.log(`  - ${prop.name} (${prop.dataType.join(', ')})`);
    });

    // Check if nearText is supported
    if (!docsClass.vectorizer || docsClass.vectorizer === 'none') {
      console.log('\n❌ PROBLEM FOUND:');
      console.log('The collection has no vectorizer configured!');
      console.log('This is why nearText queries fail.\n');
      console.log('SOLUTION: You need to either:');
      console.log('1. Create a new collection with a vectorizer (e.g., text2vec-openai)');
      console.log('2. Use nearVector with client-side embeddings');
      console.log('3. Use hybrid search or BM25 search instead\n');

      console.log('Recommended schema for semantic search:');
      console.log('========================================');
      console.log(JSON.stringify({
        class: 'DocsWithImages',
        vectorizer: 'text2vec-openai',
        moduleConfig: {
          'text2vec-openai': {
            model: 'text-embedding-3-small',
            modelVersion: '002',
            type: 'text'
          }
        },
        properties: docsClass.properties
      }, null, 2));
    } else {
      console.log('\n✅ Collection is properly configured for semantic search!');
    }

  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
