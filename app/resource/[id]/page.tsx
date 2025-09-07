'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, ExternalLink, MapPin, Tag, User } from 'lucide-react'
import { Instrument_Serif } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resource')
      } finally {
        setLoading(false)
      }
    }

    fetchResource()
  }, [params.id])

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
    <div className="min-h-screen py-8">
      <div className="w-11/12 md:w-8/12 mx-auto space-y-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>

        {/* Main Content */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Hero Image */}
            {resource.image && (
              <div className="relative h-64 md:h-96 w-full">
                <Image
                  src={resource.image}
                  alt={resource.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/Rules1.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge variant="secondary" className="mb-2">
                    {resource.type || resource.sourceType || 'Resource'}
                  </Badge>
                  <h1 className={`${instrument_serif.className} text-2xl md:text-4xl font-light text-white mb-2`}>
                    {resource.title}
                  </h1>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 md:p-8 space-y-6">
              {/* Title (if no image) */}
              {!resource.image && (
                <div>
                  <Badge variant="secondary" className="mb-4">
                    {resource.type || resource.sourceType || 'Resource'}
                  </Badge>
                  <h1 className={`${instrument_serif.className} text-3xl md:text-5xl font-light text-brand-primary-900 mb-4`}>
                    {resource.title}
                  </h1>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {resource.authors && (
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>{resource.authors}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>{resource.date}</span>
                </div>
                {resource.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span>{resource.location}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Summary */}
              <div>
                <h2 className="text-xl font-semibold mb-3">Summary</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {resource.summary}
                </p>
              </div>

              {/* Tags */}
              {resource.tags && resource.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                    <Tag className="size-4" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer hover:bg-muted">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Theme */}
              {resource.theme && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Theme</h3>
                  <Badge variant="secondary">{resource.theme}</Badge>
                </div>
              )}

              {/* Source Information */}
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="size-10">
                    <AvatarImage src="https://github.com/evilrabbit.jpg" alt="Source" />
                    <AvatarFallback>{(resource.source || 'S').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{resource.source}</p>
                    {resource.sourcePlatform && (
                      <p className="text-sm text-muted-foreground">{resource.sourcePlatform}</p>
                    )}
                  </div>
                </div>

                {/* See Original Link Button */}
                {resource.linkToOriginalSource && (
                  <Link 
                    href={resource.linkToOriginalSource} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Button className="w-full" size="lg">
                      <ExternalLink className="size-4 mr-2" />
                      See Original Link
                    </Button>
                  </Link>
                )}
              </div>

              {/* Keywords */}
              {resource.keywords && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Keywords</h3>
                  <p className="text-sm text-muted-foreground">{resource.keywords}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResourceDetailsPage
