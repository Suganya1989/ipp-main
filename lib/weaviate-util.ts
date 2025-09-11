import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';


// Lazily create and cache the Weaviate client with robust env handling
let _client: WeaviateClient | null = null;
let _schema: WeaviateSchema | null = null;
let _schemaFields: string | null = null;

// Cache schema and fields to avoid repeated fetches
async function getSchemaFields(): Promise<string> {
  if (_schemaFields) return _schemaFields;

  try {
    const client = getClient();
    const schemaPromise = client.schema.getter().do();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Schema fetch timeout')), 10000)
    );
    
    _schema = await Promise.race([schemaPromise, timeoutPromise]) as WeaviateSchema;
    const classSchema = _schema?.classes?.find((c) => c.class === 'Docs');
    const properties = classSchema?.properties?.map((p) => p.name);
    _schemaFields = properties?.join(' ') || '';
    
    return _schemaFields;
  } catch (error) {
    console.error('Error fetching schema:', error);
    return '';
  }
}

function getClient(): WeaviateClient {
  if (_client) return _client;

  const raw = process.env.WEAVIATE_URL || process.env.WEAVIATE_HOST || "";
  const apiKey = process.env.WEAVIATE_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";

  if (!raw) {
    throw new Error("WEAVIATE_URL (or WEAVIATE_HOST) is not set. Add it to .env.local at project root.");
  }
  if (!apiKey) {
    throw new Error("WEAVIATE_API_KEY is not set. Add it to .env.local at project root.");
  }
 

  // Support either a full URL (https://host[:port]) or a plain host
  let scheme: 'http' | 'https' = 'https';
  let host = raw.trim();
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      scheme = (u.protocol.replace(':','') as 'http' | 'https') || 'https';
      host = u.host; // includes host[:port]
    }
  } catch {
    // If URL parsing fails, treat as host as-is
    host = raw.trim();
  }

  _client = weaviate.client({
    scheme,
    host,
    apiKey: new ApiKey(apiKey),
    headers: { 'X-OpenAI-Api-Key': openaiKey },
  });
  return _client;
}
// Type definitions based on ipp.json structure
export interface PrisonResource {
  id?: string;
  title: string;
  summary: string;
  type: string;
  tags: string[];
  source: string;
  date: string;
  image?: string;
  featured?: boolean;
  sourceType: string;
  sourcePlatform: string;
  authors: string;
  linkToOriginalSource: string;
  dateOfPublication: string;
  subTheme: string;
  keywords: string;
  location: string;
  theme: string;
}

export interface Category {
  name: string;
  count: number;
  href: string;
}

// Strongly-typed GraphQL where filter used for Weaviate queries
type WhereOperator =
  | 'And'
  | 'Or'
  | 'Equal'
  | 'Like'
  | 'GreaterThanEqual'
  | 'LessThanEqual';

type WherePathCondition = {
  path: string[];
  operator: Exclude<WhereOperator, 'And' | 'Or'>;
  valueText?: string;
  valueDate?: string;
};

type WhereLogical = {
  operator: Extract<WhereOperator, 'And' | 'Or'>;
  operands: WhereFilter[];
};

type WhereFilter = WherePathCondition | WhereLogical;

// Minimal Weaviate schema/result typings to avoid explicit `any`
interface WeaviateProperty { name: string }
interface WeaviateClass { class: string; properties?: WeaviateProperty[] }
interface WeaviateSchema { classes?: WeaviateClass[] }
type WeaviateGetResponse = { data?: { Get?: { [className: string]: unknown[] } } }

// Shared mapper utilities to ensure consistent field mapping and link sanitization
function isValidHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (!v || v === '#') return false;
  return /^https?:\/\//i.test(v);
}

function pickBestLink(item: unknown): string | null {
  // Consider multiple possible fields and their properties variants
  const obj = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
  const props = (obj.properties && typeof obj.properties === 'object') ? (obj.properties as Record<string, unknown>) : undefined;
  let candidates: unknown[] = [
    obj?.link,
    obj?.linkToOriginalSource,
    obj?.url,
    obj?.source_url,
    obj?.originalSource,
    obj?.original_source,
    props?.link,
    props?.linkToOriginalSource,
    props?.url,
    props?.source_url,
    props?.originalSource,
    props?.original_source,
  ];

  // Flatten arrays and coerce to strings
  candidates = candidates.flatMap((c) => Array.isArray(c) ? c : [c])
    .map((c) => {
      if (typeof c === 'string') return c.trim();
      try { return String(c ?? '').trim(); } catch { return ''; }
    })
    .filter(Boolean);

  // Prefer valid http(s) links
  const httpLink = candidates.find(isValidHttpUrl) as string | undefined;
  if (httpLink) return httpLink;

  // No valid link found
  return null;
}

function mapWeaviateItemToPrisonResource(item: unknown, index: number): PrisonResource {
  const link = pickBestLink(item);
  const rec = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {};
  const props = (rec.properties && typeof rec.properties === 'object') ? (rec.properties as Record<string, unknown>) : undefined;
  const addl = (rec._additional && typeof rec._additional === 'object') ? (rec._additional as Record<string, unknown>) : undefined;

  const id = String(addl?.id ?? rec.uuid ?? Math.random().toString(36).substr(2, 9));
  const title = String((rec.source_title ?? props?.source_title ?? 'Untitled Resource'));
  const summary = String((rec.summary ?? rec.description ?? props?.summary ?? 'No summary available'));
  const type = mapSourceTypeToDisplayType(rec.sourceType ?? props?.sourceType);
  const tags = parseKeywords((rec.keywords as string | string[] | undefined) ?? (props?.keywords as string | string[] | undefined) ?? '')
    .map(k => k.trim());
  const source = String((rec.sourcePlatform ?? rec.authors ?? props?.sourcePlatform ?? props?.authors ?? 'Unknown Source'));
  const date = formatDate(rec.dateOfPublication ?? props?.dateOfPublication);
  const image = typeof rec.image === 'string' && rec.image ? rec.image
    : (typeof (rec.thumbnailUrl as unknown) === 'string' && (rec.thumbnailUrl as unknown as string)) || undefined;
  const sourceType = String(rec.sourceType ?? props?.sourceType ?? '');
  const sourcePlatform = String(rec.sourcePlatform ?? props?.sourcePlatform ?? '');
  const authors = String(rec.authors ?? props?.authors ?? '');
  const linkToOriginalSource = link ?? '';
  const dateOfPublication = String(rec.dateOfPublication ?? props?.dateOfPublication ?? new Date().toISOString());
  const subTheme = String(rec.subTheme ?? props?.subTheme ?? '');
  const keywords = String(rec.keywords ?? props?.keywords ?? '');
  const location = String(rec.location ?? props?.location ?? '');
  const theme = String(rec.theme ?? props?.theme ?? '');

  return {
    id,
    title,
    summary,
    type,
    tags,
    source,
    date,
    image,
    featured: index === 0,
    sourceType,
    sourcePlatform,
    authors,
    linkToOriginalSource,
    dateOfPublication,
    subTheme,
    keywords,
    location,
    theme,
  };
}

// Fetch a single resource by UUID (if valid) or fall back to BM25 by title
export async function getResourceByIdOrTitle(identifier: string): Promise<PrisonResource | null> {
  try {
    const client = getClient();
    //const collection = client.collections.get("Docs");
    // If identifier is a UUID, fetch by uuid from a small batch
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      // Prefer filtering by uuid; fall back to small batch search if unavailable
      let obj: unknown | undefined;
      try {
        const fields = await getSchemaFields();
        const fieldSelection = fields && fields.length > 0
          ? `${fields} _additional { id }`
          : `source_title summary sourceType keywords sourcePlatform authors dateOfPublication image linkToOriginalSource subTheme location theme _additional { id }`;
        const res = await client.graphql
          .get()
          .withClassName('Docs')
          .withFields(fieldSelection)
          .withWhere({
            path: ['id'],
            operator: 'Equal',
            valueText: identifier,
          } as WhereFilter)
          .withLimit(1)
          .do();
        const typedRes = res as WeaviateGetResponse;
        const hits = (typedRes.data?.Get?.Docs ?? []) as unknown[];
        obj = hits[0];
      } catch {
        // Ignore errors and continue
      }
      if (obj) {
        return mapWeaviateItemToPrisonResource(obj, 0);
      }
      // If no UUID match found, return null
      return null;
    } else {
      // Non-UUID identifier - search by title using BM25
      try {
        const client = getClient();
        const fields = await getSchemaFields();
        const fieldSelection = fields && fields.length > 0
          ? `${fields} _additional { id }`
          : `source_title summary sourceType keywords sourcePlatform authors dateOfPublication image linkToOriginalSource subTheme location theme _additional { id }`;
        
        const res = (await client.graphql
          .get()
          .withClassName('Docs')
          .withFields(fieldSelection)
          .withBm25({ query: identifier, properties: ['source_title'] })
          .withLimit(1)
          .do()) as WeaviateGetResponse;
        
        const hits = (res.data?.Get?.Docs ?? []) as unknown[];
        const obj = hits[0];
        
        if (obj) {
          return mapWeaviateItemToPrisonResource(obj, 0);
        }
        
        return null;
      } catch (error) {
        console.error('Error searching by title:', error);
        return null;
      }
    }
  } catch (error) {
    console.error('Error fetching resource by id or title:', error);
    return null;
  }
}
// Method 2: REST API Query

export async function getFeaturedResources(limit: number = 5): Promise<PrisonResource[]> {
  try {
    console.log("Get featured")
    const client = getClient();
    const fields = await getSchemaFields();
    const fieldSelection = fields && fields.length > 0
      ? `${fields} _additional { id }`
      : `source_title summary sourceType keywords sourcePlatform authors dateOfPublication image linkToOriginalSource subTheme location theme _additional { id }`;
    const res = (await client.graphql
      .get()
      .withClassName('Docs')
      .withFields(fieldSelection)
      .withLimit(limit)
      .do()) as WeaviateGetResponse;
    const docs = (res.data?.Get?.Docs ?? []) as unknown[];
    return docs.map((item, index) => mapWeaviateItemToPrisonResource(item, index));
  } catch (error) {
    console.error('Error fetching resources via Collections API:', error);
    return [];
  }
}



// Method 4: Keyword/BM25 Search
export async function searchResourcesByKeyword(query: string, limit: number = 5): Promise<PrisonResource[]> {
  try {
    const client = getClient();
    const fields = await getSchemaFields();
    const fieldSelection = fields && fields.length > 0
      ? `${fields} _additional { id }`
      : `source_title summary sourceType keywords sourcePlatform authors dateOfPublication image linkToOriginalSource subTheme location theme _additional { id }`;
    
    // Build query; if query is empty, fetch a sample without BM25 so callers like the filters API can aggregate
    const getBuilder = client.graphql
      .get()
      .withClassName('Docs')
      .withFields(fieldSelection)
      .withLimit(limit);

    if (query && String(query).trim().length > 0) {
      getBuilder.withBm25({ query, properties: ['source_title', 'summary','keywords'] });
    }

    const res = (await getBuilder.do()) as WeaviateGetResponse;

    const items = (res.data?.Get?.Docs ?? []) as unknown[];
    return items.map((item, index) => mapWeaviateItemToPrisonResource(item, index));
  } catch (error) {
    console.error('Error in keyword search:', error);
    return [];
  }
}

// Enhanced search with filters
export interface SearchFilters {
  types?: string[];
  themes?: string[];
  sources?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  locations?: string[];
  authors?: string[];
}

export async function searchResourcesWithFilters(
  query: string, 
  filters: SearchFilters = {}, 
  limit: number = 20
): Promise<PrisonResource[]> {
  try {
    const client = getClient();
    const fields = await getSchemaFields();
    
    const fieldSelection = fields && fields.length > 0
      ? `${fields} _additional { id score }`
      : `source_title summary sourceType keywords sourcePlatform authors dateOfPublication image link subTheme location theme _additional { id score }`;

    // Build where conditions for filters
    const whereConditions: WhereFilter[] = [];

    // Add text search condition if query exists
    if (query && query.trim()) {
      whereConditions.push({
        operator: 'Or',
        operands: [
          { path: ['source_title'], operator: 'Like', valueText: `*${query}*` },
          { path: ['summary'], operator: 'Like', valueText: `*${query}*` },
          { path: ['keywords'], operator: 'Like', valueText: `*${query}*` }
        ]
      });
    }

    // Add type filters (robust LIKE with synonyms)
    if (filters.types && filters.types.length > 0) {
      const typeSynonyms: Record<string, string[]> = {
        report: ['*report*', '*Report*'],
        article: ['*article*', '*Article*', '*journal*', '*Journal*', '*paper*', '*Paper*'],
        judgment: ['*judgment*', '*Judgment*', '*judgement*', '*Judgement*', '*court*', '*Court*', '*case*', '*Case*'],
        video: ['*video*', '*Video*', '*documentary*', '*Documentary*'],
        podcast: ['*podcast*', '*Podcast*', '*audio*', '*Audio*']
      };

      const operands: WhereFilter[] = [];
      for (const t of filters.types) {
        const key = String(t).trim().toLowerCase();
        const patterns = typeSynonyms[key] || [`*${t}*`, `*${String(t).toLowerCase()}*`, `*${String(t).toUpperCase()}*`];
        for (const p of patterns) {
          operands.push({ path: ['sourceType'], operator: 'Like', valueText: p });
        }
      }

      if (operands.length === 1) {
        whereConditions.push(operands[0]);
      } else {
        whereConditions.push({ operator: 'Or', operands });
      }
    }

    // Add theme filters
    if (filters.themes && filters.themes.length > 0) {
      if (filters.themes.length === 1) {
        whereConditions.push({ path: ['theme'], operator: 'Like', valueText: `*${filters.themes[0]}*` });
      } else {
        whereConditions.push({
          operator: 'Or',
          operands: filters.themes.map(theme => ({ path: ['theme'], operator: 'Like', valueText: `*${theme}*` }))
        });
      }
    }

    // Add source platform filters
    if (filters.sources && filters.sources.length > 0) {
      if (filters.sources.length === 1) {
        whereConditions.push({ path: ['sourcePlatform'], operator: 'Like', valueText: `*${filters.sources[0]}*` });
      } else {
        whereConditions.push({
          operator: 'Or',
          operands: filters.sources.map(source => ({ path: ['sourcePlatform'], operator: 'Like', valueText: `*${source}*` }))
        });
      }
    }

    // Add location filters
    if (filters.locations && filters.locations.length > 0) {
      if (filters.locations.length === 1) {
        whereConditions.push({ path: ['location'], operator: 'Like', valueText: `*${filters.locations[0]}*` });
      } else {
        whereConditions.push({
          operator: 'Or',
          operands: filters.locations.map(location => ({ path: ['location'], operator: 'Like', valueText: `*${location}*` }))
        });
      }
    }

    // Add author filters
    if (filters.authors && filters.authors.length > 0) {
      if (filters.authors.length === 1) {
        whereConditions.push({
          path: ['authors'],
          operator: 'Like',
          valueText: `*${filters.authors[0]}*`
        });
      } else {
        whereConditions.push({
          operator: 'Or',
          operands: filters.authors.map(author => ({
            path: ['authors'],
            operator: 'Like',
            valueText: `*${author}*`
          }))
        });
      }
    }

    // Add date range filters
    if (filters.dateRange?.from || filters.dateRange?.to) {
      const dateConditions: WhereFilter[] = [];
      
      if (filters.dateRange.from) {
        dateConditions.push({
          path: ['dateOfPublication'],
          operator: 'GreaterThanEqual',
          valueDate: filters.dateRange.from
        });
      }
      
      if (filters.dateRange.to) {
        dateConditions.push({
          path: ['dateOfPublication'],
          operator: 'LessThanEqual',
          valueDate: filters.dateRange.to
        });
      }
      
      if (dateConditions.length === 1) {
        whereConditions.push(dateConditions[0]);
      } else if (dateConditions.length === 2) {
        whereConditions.push({
          operator: 'And',
          operands: dateConditions
        });
      }
    }

    // Build the final where clause
    let whereClause: WhereFilter | null = null;
    if (whereConditions.length === 1) {
      whereClause = whereConditions[0];
    } else if (whereConditions.length > 1) {
      whereClause = {
        operator: 'And',
        operands: whereConditions
      };
    }
    // no-op: avoid logging in production

    // Build and execute the query
    let queryBuilder = client.graphql
      .get()
      .withClassName('Docs')
      .withFields(fieldSelection)
      .withLimit(limit);

    if (whereClause) {
      queryBuilder = queryBuilder.withWhere(whereClause);
    }

    // Add timeout wrapper for the query
    const queryPromise = queryBuilder.do();
    const queryTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('GraphQL query timeout')), 15000)
    );
    
    const res = await Promise.race([queryPromise, queryTimeoutPromise]) as WeaviateGetResponse;
    const items = (res?.data?.Get?.Docs ?? []) as unknown[];
    return items.map((item, index) => mapWeaviateItemToPrisonResource(item, index));

  } catch (error) {
    console.error('Error in filtered search:', error);
    
    // Check if it's a timeout or connection error
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('Connect Timeout'))) {
      console.log('Weaviate connection timeout '+error);
 
    }
    
    return [];
  }
}

// Method 5: Filtered Query with Where Conditions
export async function getResourcesByTheme(theme: string, limit: number = 5): Promise<PrisonResource[]> {
  try {
    console.log("Themed resources")
    const client = getClient();
    const fields = await getSchemaFields();
    
    // Add timeout wrapper for GraphQL query
    const queryPromise = client.graphql
      .get()
      .withClassName('Docs')
      .withWhere({ path: ['theme'], operator: 'Like', valueText: String(theme) } as WhereFilter)
      .withFields(fields && fields.length > 0
        ? `${fields} _additional { id }`
        : `source_title summary sourceType keywords sourcePlatform authors dateOfPublication image link subTheme location theme _additional { id }`)
      .withLimit(limit)
      .do();
      
    const queryTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('GraphQL query timeout')), 15000)
    );
    
    const res = await Promise.race([queryPromise, queryTimeoutPromise]) as WeaviateGetResponse;

    const items = (res?.data?.Get?.Docs ?? []) as unknown[];
    return items.map((item, index) => mapWeaviateItemToPrisonResource(item, index));
  } catch (error) {
    console.error('Error fetching resources by theme:', error);
    
    // Check if it's a timeout or connection error
    if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('Connect Timeout'))) {
      console.log('Weaviate connection timeout '+error);
    }
    
    return [];
  }
}

// Fetch all resources and generate categories with counts
export async function getCategories(): Promise<Category[]> {
  try {
    const client = getClient();
    const fields = await getSchemaFields();
    const res = await client.graphql
      .get()
      .withClassName('Docs')
      .withFields(fields && fields.length > 0
        ? `${fields} _additional { id }`
        : `theme subTheme keywords _additional { id }`)
      .withLimit(1000) // Get a large number to capture all categories
      .do();
    type DocLite = { theme?: unknown; subTheme?: unknown; keywords?: unknown };
    const resources = ((res as WeaviateGetResponse)?.data?.Get?.Docs ?? []) as DocLite[];
    const categoryMap = new Map<string, number>();

    // Count occurrences of themes, subthemes, and keywords
    resources.forEach((resource: DocLite) => {
      // Add theme
      if (resource.theme) {
        const theme = String(resource.theme);
        categoryMap.set(theme, (categoryMap.get(theme) || 0) + 1);
      }
      // Add subTheme
      if (resource.subTheme) {
        const subTheme = String(resource.subTheme);
        categoryMap.set(subTheme, (categoryMap.get(subTheme) || 0) + 1);
      }
      // Add keywords (split by comma if string)
      const keywords = resource.keywords;
      if (typeof keywords === 'string') {
        keywords.split(',').map(k => k.trim()).filter(Boolean).forEach(k => {
      categoryMap.set(k, (categoryMap.get(k) || 0) + 1);
        });
      }
    });

    // Convert to category format and sort by count
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        href: `/tag/${name.toLowerCase().replace(/\s+/g, '-')}`
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6); // Limit to top 6 categories

  } catch (error) {
    console.error('Error fetching categories from Weaviate:', error);
    return [];
  }
}

// Method 6: Get all tags with resource counts
export async function getTagsWithCounts(): Promise<Category[]> {
  try {
    const client = getClient();
    const fields = await getSchemaFields();
    const fieldSelection = fields && fields.length > 0
      ? `${fields} _additional { id }`
      : `keywords _additional { id }`;
    
    // Get all resources to count tags
    const res = await client.graphql
      .get()
      .withClassName('Docs')
      .withFields(fieldSelection)
      .withLimit(1000) // Get a large number to capture all tags
      .do();

    type DocLite = { keywords?: unknown; properties?: { keywords?: unknown } };
    const resources = ((res as WeaviateGetResponse)?.data?.Get?.Docs ?? []) as DocLite[];

    // Count tags from keywords
    const tagCounts = new Map<string, number>();
    
    resources.forEach((resource: DocLite) => {
      const keywords = resource.keywords ?? resource.properties?.keywords;
      const tags = parseKeywords(keywords);
      
      tags.forEach(tag => {
        if (tag && tag.trim() && tag !== 'null' && tag !== 'undefined') {
          const tagStr = tag.trim();
          tagCounts.set(tagStr, (tagCounts.get(tagStr) || 0) + 1);
        }
      });
    });

    // Convert to Category array and sort by count
    const tags: Category[] = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({
        name: tag,
        count: count,
        href: `/tag/${encodeURIComponent(tag.toLowerCase().replace(/\s+/g, '-'))}`
      }))
      .sort((a, b) => b.count - a.count);
    
    console.log('Tags with counts:', tags);
    return tags;

  } catch (error) {
    console.error('Error fetching tags from Weaviate:', error);
    return [];
  }
}

// Method 7: Get all themes with resource counts
export async function getThemesWithCounts(): Promise<Category[]> {
  try {
    const client = getClient();
    const fields = await getSchemaFields();
    const fieldSelection = fields && fields.length > 0
      ? `${fields} _additional { id }`
      : `theme _additional { id }`;
    
    // Get all resources to count themes
    const res = await client.graphql
      .get()
      .withClassName('Docs')
      .withFields(fieldSelection)
      .withLimit(10) // Get a large number to capture all themes
      .do();

    type DocLite = { theme?: unknown; properties?: { theme?: unknown } };
    const resources = ((res as WeaviateGetResponse)?.data?.Get?.Docs ?? []) as DocLite[];

    // Count themes
    const themeCounts = new Map<string, number>();
    
    resources.forEach((resource: DocLite) => {
      const theme = resource.theme ?? resource.properties?.theme ?? 'Uncategorized';
      const themeStr = String(theme).trim();
      
      if (themeStr && themeStr !== 'null' && themeStr !== 'undefined') {
        themeCounts.set(themeStr, (themeCounts.get(themeStr) || 0) + 1);
      }
    });

    // Convert to Category array and sort by count
    const themes: Category[] = Array.from(themeCounts.entries())
      .map(([theme, count]) => ({
        name: theme,
        count: count,
        href: `/tag/${encodeURIComponent(theme.toLowerCase().replace(/\s+/g, '-'))}`
      }))
      .sort((a, b) => b.count - a.count);
    console.log(themes);
    return themes;

  } catch (error) {
    console.error('Error fetching themes from Weaviate:', error);
    return[];
  }
}

// Helper functions
function mapSourceTypeToDisplayType(sourceType: unknown): string {
  if (!sourceType) return 'Report';
  
  const type = String(sourceType).trim().toLowerCase();
  if (type.includes('report')) return 'Report';
  if (type.includes('article') || type.includes('journal')) return 'Article';
  if (type.includes('judgment') || type.includes('court')) return 'Judgment';
  if (type.includes('video') || type.includes('documentary')) return 'Video';
  if (type.includes('podcast') || type.includes('audio')) return 'Podcast';
  
  return 'Report'; // Default fallback
}

function parseKeywords(keywords: unknown): string[] {
  if (keywords == null) return [];
  if (Array.isArray(keywords)) return (keywords as unknown[]).map(v => String(v)).map(k => k.trim()).filter(k => k.length > 0);
  if (typeof keywords === 'string') return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  // Unsupported type: coerce to string safely
  try {
    return String(keywords).split(',').map(k => k.trim()).filter(k => k.length > 0);
  } catch {
    return [];
  }
}

function formatDate(dateInput: unknown): string {
  if (dateInput == null || dateInput === '') return new Date().toISOString().split('T')[0];
  try {
    if (dateInput instanceof Date) return dateInput.toISOString().split('T')[0];
    if (typeof dateInput === 'number') return new Date(dateInput).toISOString().split('T')[0];
    // For strings or other types
    const s = String(dateInput);
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}


export default getClient;
