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
  const [ogImage, setOgImage] = useState<string | null>(null)

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
        setImageLoading(data.resource.image ? true : false)
        // Fetch OG image if resource has linkToOriginalSource but no image
        if (data.resource.linkToOriginalSource && !data.resource.image) {
          setImageLoading(true)
          // Add timeout to prevent indefinite loading
          const timeoutId = setTimeout(() => {
            setImageLoading(false)
          }, 10000) // 10 second timeout
          
          fetchOGImage(data.resource.id, data.resource.linkToOriginalSource).finally(() => {
            clearTimeout(timeoutId)
          })
        }

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

  // Track processed related resources to avoid duplicate OG fetches
  const processedRelated = useRef<Set<string | undefined>>(new Set())

  // Fetch OG images for related resources after they are loaded
  useEffect(() => {
    const toProcess = relatedResources.filter((item) => {
      const key = item.id || item.title
      return (
        !!key &&
        !processedRelated.current.has(key) &&
        !item.image &&
        !!item.linkToOriginalSource &&
        item.linkToOriginalSource.startsWith('http')
      )
    })

    if (toProcess.length === 0) return

    toProcess.forEach(async (item) => {
      const key = item.id || item.title
      if (!key) return
      processedRelated.current.add(key)
      try {
        const resp = await fetch('/api/og-image-async', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resourceId: item.id, url: item.linkToOriginalSource })
        })
        if (!resp.ok) return
        const ogData = await resp.json()
        if (ogData?.ogImage && typeof ogData.ogImage === 'string' && !ogData.ogImage.startsWith('/')) {
          setRelatedResources((prev) => prev.map((r) =>
            (r.id && ogData.resourceId && r.id === ogData.resourceId)
              ? { ...r, image: ogData.ogImage }
              : r
          ))
        }
      } catch {
        // ignore
      }
    })
  }, [relatedResources])

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

  // Function to fetch OG image
  const fetchOGImage = async (resourceId: string, url: string) => {
    try {
      // Add timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      const response = await fetch('/api/og-image-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId,
          url
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const ogData = await response.json()
        if (ogData.ogImage) {
          setOgImage(ogData.ogImage)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('OG image fetch timed out')
      } else {
        console.error('Error fetching OG image:', error)
      }
    } finally {
      setImageLoading(false)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Indian Prison Portal</span>
            <span>/</span>
            <span>Resources</span>
            <span>/</span>
            <span className="text-foreground">{resource.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white">
              <CardContent className="p-8">
                {/* Header */}
                <div className="mb-6">
                  <Badge variant="secondary" className="mb-4">
                    {resource.type || resource.sourceType || 'Resource'}
                  </Badge>
                  <h1 className={`${instrument_serif.className} text-3xl md:text-4xl font-normal text-gray-900 mb-4 leading-tight`}>
                    {resource.title}
                  </h1>
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
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
                  </div>
                </div>

                {/* Featured Image - Only show if we have a real external image */}
                {(resource.image || ogImage) && !imageError && !resource.image?.startsWith('/') && !ogImage?.startsWith('/') && (
                  <div className="mb-8">
                    <div className="relative h-64 md:h-96 w-full rounded-lg overflow-hidden">
                      {imageLoading && (
                        <div className="absolute inset-0 bg-muted animate-pulse"></div>
                      )}
                      
                      <Image
                        src={resource.image || ogImage || ''}
                        alt={resource.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
                        onLoad={() => setImageLoading(false)}
                        onError={() => {
                          setImageError(true)
                          setImageLoading(false)
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900">Summary</h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed text-base">
                      {resource.summary}
                    </p>
                  </div>
                </div>

                {/* Key Findings Section */}
                <div className="mb-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h3 className="text-lg font-semibold mb-3 text-blue-900">Key Findings</h3>
                  <div className="text-blue-800">
                    <p>This resource provides valuable insights into {resource.theme?.toLowerCase() || 'prison reform'} and contributes to the broader understanding of correctional practices and policies.</p>
                  </div>
                </div>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {resource.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source Link */}
                {resource.linkToOriginalSource && (
                  <div className="mb-8">
                    <Link 
                      href={resource.linkToOriginalSource} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <ExternalLink className="size-4 mr-2" />
                        View Original Source
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white mb-6">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-gray-900">Resource Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Source</Label>
                    <p className="text-sm text-gray-900 mt-1">{resource.source}</p>
                  </div>
                  
                  {resource.theme && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Theme</Label>
                      <Badge variant="secondary" className="mt-1">{resource.theme}</Badge>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Type</Label>
                    <p className="text-sm text-gray-900 mt-1">{resource.type || resource.sourceType || 'Resource'}</p>
                  </div>
                  
                  {resource.keywords && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Keywords</Label>
                      <p className="text-sm text-gray-700 mt-1">{resource.keywords}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Author Info */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 text-gray-900">About the Source</h3>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="size-12">
                    <AvatarImage src="https://github.com/evilrabbit.jpg" alt="Source" />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {(resource.source || 'S').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{resource.source}</p>
                    {resource.sourcePlatform && (
                      <p className="text-sm text-gray-600">{resource.sourcePlatform}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Trusted source providing research and insights on prison reform and correctional practices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Resources Section */}
        {relatedResources.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Related Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedResources.map((relatedResource, index) => (
                <Link key={relatedResource.id || index} href={`/resource/${relatedResource.id || encodeURIComponent(relatedResource.title)}`}>
                  <Card className="bg-white hover:shadow-lg transition-shadow duration-200 h-full">
                    <CardContent className="p-0 relative group overflow-hidden">
                      <div className="h-48 w-full overflow-hidden">
                        {relatedResource.image ? (
                          <Image 
                            src={relatedResource.image} 
                            alt={relatedResource.title} 
                            width={400} 
                            height={200} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = getFallbackImage(relatedResource?.theme, relatedResource?.tags)
                            }}
                          />
                        ) : (
                          <Image 
                            src={getFallbackImage(relatedResource?.theme, relatedResource?.tags)} 
                            alt="Default" 
                            width={400} 
                            height={200} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                          />
                        )}
                      </div>
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="size-3 mr-1" />
                          {relatedResource.type || 'Resource'}
                        </Badge>
                      </div>
                      
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="rounded-full bg-white/90 hover:bg-white">
                            <Bookmark className="size-3" />
                          </Button>
                          <Button size="sm" variant="secondary" className="rounded-full bg-white/90 hover:bg-white">
                            <Send className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-4">
                      <div className="w-full">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {relatedResource.theme || 'General'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">
                          {relatedResource.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Avatar className="size-4">
                            <AvatarFallback className="text-xs bg-gray-100">
                              {(relatedResource.authors || relatedResource.source || 'A').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{relatedResource.source}</span>
                          <span aria-hidden>•</span>
                          <span>{formatDateDMY(relatedResource.DateOfPublication || relatedResource.date)}</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResourceDetailsPage
