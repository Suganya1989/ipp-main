'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar, ExternalLink, MapPin, User, FileText, Bookmark, Send } from 'lucide-react'
import { Instrument_Serif } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { formatDateDMY, getFallbackImage } from '@/lib/utils'

const instrument_serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"]
})

type Resource = {
  id?: string;
  title: string;
  summary: string;
  type: string;
  source: string;
  date: string;
  DateOfPublication?: string;
  image?: string;
  imageUrl?: string;
  theme?: string;
  tags?: string[];
  authors?: string;
  linkToOriginalSource?: string;
  location?: string;
  keywords?: string;
  sourceType?: string;
  sourcePlatform?: string;
}

const ResourceDetailsPage = () => {
  const params = useParams()
  const router = useRouter()
  const [resource, setResource] = useState<Resource | null>(null)
  const [relatedResources, setRelatedResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchResource = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const response = await fetch(`/api/resource/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Resource not found')
        }

        const data = await response.json()
        setResource(data.resource)

        // Reset image states when new resource loads
        const hasImage = data.resource.imageUrl || data.resource.image
        setImageLoading(hasImage ? true : false)

        // Fetch related resources based on theme
        if (data.resource.theme) {
          fetchRelatedResources(data.resource.theme, data.resource.id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resource')
      } finally {
        setLoading(false)
      }
    }

    fetchResource()
  }, [params.id])

  // Function to fetch related resources
  const fetchRelatedResources = async (theme: string, currentResourceId: string) => {
    try {
      const response = await fetch(`/api/search?themes=${encodeURIComponent(theme)}&limit=6`)
      const data = await response.json()
      
      if (data.data && Array.isArray(data.data)) {
        // Filter out the current resource and take first 3
        const filtered = data.data
          .filter((item: Resource) => item.id !== currentResourceId)
          .slice(0, 3)
        setRelatedResources(filtered)
      }
    } catch (error) {
      console.error('Error fetching related resources:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-11/12 md:w-8/12">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-11/12 md:w-6/12 p-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Resource Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The requested resource could not be found.'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <nav className="text-sm text-gray-600 mb-4">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/search" className="hover:text-gray-900">Resources</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-900">{resource.type || 'Resource'}</span>
          </nav>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 p-0 h-auto font-normal text-gray-600 hover:text-gray-900">
            <ArrowLeft className="size-4 mr-2" />
            Back to results
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <article className="space-y-8">
          {/* Title and Metadata */}
          <header className="space-y-6">
            <div className="space-y-4">
              <h1 className={`${instrument_serif.className} text-3xl md:text-4xl font-semibold text-gray-900 leading-tight`}>
                {resource.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {resource.authors && (
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>{resource.authors}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>{formatDateDMY(resource.DateOfPublication || resource.date)}</span>
                </div>
                {resource.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>{resource.location}</span>
                  </div>
                )}
                <Badge variant="outline" className="text-xs">
                  {resource.type || resource.sourceType || 'Resource'}
                </Badge>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {(() => {
            const imageUrl = resource.imageUrl || resource.image
            return imageUrl && !imageError && !imageUrl.startsWith('/') && (
              <div className="my-8">
                <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden bg-gray-100">
                  {imageLoading && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
                  )}

                  <Image
                    src={imageUrl}
                    alt={resource.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 800px"
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageError(true)
                      setImageLoading(false)
                    }}
                  />
                </div>
              </div>
            )
          })()}

          {/* Abstract/Summary */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Abstract</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              {resource.summary}
            </p>
          </section>

          {/* Key Findings */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Key Findings</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-gray-800">
                    This comprehensive study examines {resource.theme?.toLowerCase() || 'prison conditions'} and provides evidence-based recommendations for reform.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-gray-800">
                    The research contributes to the broader understanding of correctional practices and their impact on rehabilitation outcomes.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  <p className="text-gray-800">
                    Findings support the implementation of evidence-based policies to improve conditions and reduce recidivism.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Metadata */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Resource Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Source</h3>
                  <p className="text-gray-900 mt-1">{resource.source}</p>
                </div>
                {resource.theme && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Theme</h3>
                    <p className="text-gray-900 mt-1">{resource.theme}</p>
                  </div>
                )}
                {resource.location && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Location</h3>
                    <p className="text-gray-900 mt-1">{resource.location}</p>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Type</h3>
                  <p className="text-gray-900 mt-1">{resource.type || resource.sourceType || 'Resource'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Publication Date</h3>
                  <p className="text-gray-900 mt-1">{formatDateDMY(resource.DateOfPublication || resource.date)}</p>
                </div>
                {resource.authors && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Authors</h3>
                    <p className="text-gray-900 mt-1">{resource.authors}</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Keywords</h2>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Source Link */}
          {resource.linkToOriginalSource && (
            <section className="pt-6 border-t">
              <Link
                href={resource.linkToOriginalSource}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <ExternalLink className="size-4" />
                View Original Source
              </Link>
            </section>
          )}
        </article>

        {/* Companies Section */}
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 uppercase tracking-wide">As featured in</p>
            </div>
            <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap opacity-60 hover:opacity-80 transition-opacity">
              {/* The Guardian */}
              <div className="flex items-center justify-center h-8 text-gray-400">
                <svg viewBox="0 0 120 30" className="h-6 fill-current">
                  <text x="0" y="20" className="text-lg font-serif">The Guardian</text>
                </svg>
              </div>

              {/* Bloomberg */}
              <div className="flex items-center justify-center h-8 text-gray-400">
                <svg viewBox="0 0 120 30" className="h-6 fill-current">
                  <text x="0" y="20" className="text-lg font-sans font-medium">Bloomberg</text>
                </svg>
              </div>

              {/* Quotient */}
              <div className="flex items-center justify-center h-8 text-gray-400">
                <svg viewBox="0 0 120 30" className="h-6 fill-current">
                  <text x="0" y="20" className="text-lg font-sans">Quotient</text>
                </svg>
              </div>

              {/* Forbes */}
              <div className="flex items-center justify-center h-8 text-gray-400">
                <svg viewBox="0 0 120 30" className="h-6 fill-current">
                  <text x="0" y="20" className="text-lg font-serif font-bold">Forbes</text>
                </svg>
              </div>

              {/* Gizmodo */}
              <div className="flex items-center justify-center h-8 text-gray-400">
                <svg viewBox="0 0 120 30" className="h-6 fill-current">
                  <text x="0" y="20" className="text-lg font-sans font-bold">GIZMODO</text>
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Related Resources Section - Full Page Width */}
      {relatedResources.length > 0 && (
        <section className="w-3/4 mx-auto bg-gray-50 mt-1">
          <div className="w-full px-8 py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Related Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedResources.map((relatedResource, index) => (
                <Link key={relatedResource.id || index} href={`/resource/${relatedResource.id || encodeURIComponent(relatedResource.title)}`}>
                  <article className="relative h-64 rounded-lg overflow-hidden group hover:scale-105 transition-transform duration-200">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                      <Image
                        src={relatedResource.imageUrl || relatedResource.image || getFallbackImage(relatedResource?.theme, relatedResource?.tags)}
                        alt={relatedResource.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getFallbackImage(relatedResource?.theme, relatedResource?.tags)
                        }}
                      />
                    </div>

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Content Overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      {/* Top: Type Badge */}
                      <div className="flex justify-start">
                        <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs">
                          {relatedResource.type || 'Resource'}
                        </Badge>
                      </div>

                      {/* Bottom: Title and metadata */}
                      <div className="space-y-3">
                        <h3 className="text-white font-semibold text-lg leading-tight line-clamp-3">
                          {relatedResource.title}
                        </h3>

                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <span>{relatedResource.source}</span>
                          <span>•</span>
                          <span>{formatDateDMY(relatedResource.DateOfPublication || relatedResource.date)}</span>
                        </div>

                        {relatedResource.theme && (
                          <Badge variant="outline" className="bg-blue-600/20 text-blue-200 border-blue-400/30 text-xs">
                            {relatedResource.theme}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default ResourceDetailsPage
