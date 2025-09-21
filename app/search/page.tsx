"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn as classNameMerge, formatDateDMY } from "@/lib/utils"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Bookmark, FileText, Funnel, Gavel, Mic2, Newspaper, Pencil, Send, Video } from 'lucide-react'
import { Instrument_Serif } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { Suspense, useEffect, useState } from 'react'

// Component for handling OG image fetching using the cached async endpoint
const ResourceThumbnail = ({ resource }: { resource: Resource }) => {
  const [ogImage, setOgImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!resource.image && resource.linkToOriginalSource && resource.id) {
      setIsLoading(true)
      fetch('/api/og-image-async', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId: resource.id,
          url: resource.linkToOriginalSource
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.ogImage) {
            setOgImage(data.ogImage)
          }
        })
        .catch(() => setHasError(true))
        .finally(() => setIsLoading(false))
    }
  }, [resource.image, resource.linkToOriginalSource, resource.id])

  const imageUrl = resource.image || ogImage

  return (
    <div className="relative h-28 w-36 shrink-0 overflow-hidden rounded-md bg-muted md:h-full md:w-44">
      {imageUrl && !hasError ? (
        <Image
          src={imageUrl}
          alt={`Thumbnail for ${resource.title}`}
          fill
          sizes="(max-width: 768px) 144px, 176px"
          className="object-cover group-hover:opacity-95 transition-opacity"
          onError={() => setHasError(true)}
        />
      ) : null}
      {(!imageUrl || hasError) && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            {isLoading ? (
              <div className="animate-pulse">
                <FileText className="mx-auto h-8 w-8 mb-2" strokeWidth={1} />
                <p className="text-xs font-medium">Loading...</p>
              </div>
            ) : (
              <>
                <FileText className="mx-auto h-8 w-8 mb-2" strokeWidth={1} />
                <p className="text-xs font-medium">{resource.type}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


const instrument_serif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"]
})
type TypeKey = string

type Resource = {
    id?: string
    title: string
    summary: string
    type: string
    tags: string[]
    source: string
    sourceType?: string
    date: string
    DateOfPublication?: string
    image?: string
    theme?: string
    authors?: string
    linkToOriginalSource?: string
}

const SearchContent = (): React.JSX.Element => {
    const [selectedState, setSelectedState] = useState<string | null>("All state")
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<Set<TypeKey>>(new Set())
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
    const [results, setResults] = useState<Resource[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [topics, setTopics] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const [types, setTypes] = useState<string[]>([])
    const [relevantTypes, setRelevantTypes] = useState<string[]>([])
    const [relevantTags, setRelevantTags] = useState<string[]>([])
    const [relevantTopics, setRelevantTopics] = useState<string[]>([])
    const [filtersInitialized, setFiltersInitialized] = useState<boolean>(false)
   
    const searchParams = useSearchParams()
    const query = searchParams.get("query") || ""

    // Load topics, tags, and types
    useEffect(() => {
        let mounted = true
        const themesController = new AbortController()
        const catsController = new AbortController()
        const typesController = new AbortController()
        Promise.all([
            fetch('/api/themes', { signal: themesController.signal })
                .then(r => r.ok ? r.json() : { data: [] })
                .catch(() => ({ data: ['General', 'Legal', 'Reform', 'Statistics', 'Education'] })),
            fetch('/api/tags', { signal: catsController.signal })
                .then(r => r.ok ? r.json() : { data: [] })
                .catch(() => ({ data: ['Policy', 'Research', 'News', 'Case Studies', 'Reports'] })),
            fetch('/api/types', { signal: typesController.signal })
                .then(r => r.ok ? r.json() : { data: [] })
                .catch(() => ({ data: ['Report', 'Article', 'Judgement', 'Video', 'Podcast'] })),
        ]).then(([themesRes, categoriesRes, typesRes]) => {
            if (!mounted) return
            const tps = Array.isArray(themesRes?.data) && themesRes.data.length > 0
                ? themesRes.data.map((t: { name: string }) => t.name)
                : ['General', 'Legal', 'Reform', 'Statistics', 'Education']
            const tgs = Array.isArray(categoriesRes?.data) && categoriesRes.data.length > 0
                ? categoriesRes.data.map((c: { name: string }) => c.name)
                : ['Policy', 'Research', 'News', 'Case Studies', 'Reports']
                console.log('types fetched ',typesRes)
            const tys = Array.isArray(typesRes?.data) && typesRes.data.length > 0
                ? typesRes.data
                : ['Report', 'Article', 'Judgement', 'Video', 'Podcast']
            setTopics(tps)
            setTags(tgs)
            setTypes(tys)
            // No need to set default selection for multi-select
        })
        return () => { mounted = false; themesController.abort(); catsController.abort(); typesController.abort() }
    }, [])

    // Fetch results when filters change
    useEffect((): (() => void) => {
        let mounted = true
        const controller = new AbortController()
        setLoading(true)
        const params = new URLSearchParams()
        // Only set the query if it's not empty and not just whitespace
        const trimmedQuery = query?.trim()
        
        if (trimmedQuery) {
            params.set('query', trimmedQuery)
        }

        // Append selected tags to query for keyword narrowing
        if (selectedTags.size) {
            const currentQuery = params.get('query') || ''
            const tagsQuery = Array.from(selectedTags).join(' ')
            params.set('query', currentQuery ? `${currentQuery} ${tagsQuery}`.trim() : tagsQuery)
        }

        // Types filter (sent as sourceTypes to API)
        if (selectedTypes.size) {
            Array.from(selectedTypes).forEach((t) => params.append('sourceTypes', t))
        }

        // Theme filter (topics)
        if (selectedTopics.length > 0) {
            selectedTopics.forEach(topic => params.append('themes', topic));
        }

        fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
            .then(r => r.json())
            .then(j => {
              if (!mounted) return
              type UnknownResource = Resource & { ['date of publication']?: string }
              const list: UnknownResource[] = Array.isArray(j.data) ? j.data : []
              const normalized: Resource[] = list.map((it) => ({
                ...it,
                DateOfPublication: it.DateOfPublication || it['date of publication'] || it.date
              }))
              setResults(normalized)

              // Extract and rank tags by frequency, show top 15 unique tags (case insensitive)
              const allResultTags = normalized.flatMap(resource => resource.tags || [])
              const tagFrequency = allResultTags.reduce((acc, tag) => {
                if (tag && tag.trim()) { // Filter out empty/null tags
                  const cleanTag = tag.trim()
                  const lowerKey = cleanTag.toLowerCase()
                  if (!acc[lowerKey]) {
                    acc[lowerKey] = { count: 0, displayName: cleanTag }
                  }
                  acc[lowerKey].count += 1
                }
                return acc
              }, {} as Record<string, { count: number, displayName: string }>)

              const sortedTags = Object.values(tagFrequency)
                .sort((a, b) => b.count - a.count)
                .slice(0, 15)
                .map(item => item.displayName)

              setRelevantTags(sortedTags)

              // Extract unique types from search results (only on first load)
              if (!filtersInitialized) {
                const allTypes = normalized.map(resource => resource.type).filter((type): type is string => Boolean(type))
                const uniqueTypes = [...new Set(allTypes)]
                setRelevantTypes(uniqueTypes)
              }


              // Extract and rank themes from search results
              const allThemes = normalized.map(resource => resource.theme).filter((theme): theme is string => Boolean(theme))
              const themeFrequency = allThemes.reduce((acc, theme) => {
                if (theme && theme.trim()) {
                  const cleanTheme = theme.trim()
                  const lowerKey = cleanTheme.toLowerCase()
                  if (!acc[lowerKey]) {
                    acc[lowerKey] = { count: 0, displayName: cleanTheme }
                  }
                  acc[lowerKey].count += 1
                }
                return acc
              }, {} as Record<string, { count: number, displayName: string }>)

              const sortedThemes = Object.values(themeFrequency)
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map(item => item.displayName)

              setRelevantTopics(sortedThemes)

              // Mark filters as initialized so types won't change again
              if (!filtersInitialized) {
                setFiltersInitialized(true)
              }
            })
            .catch((err) => { if (mounted && err?.name !== 'AbortError') setResults([]) })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false; controller.abort() }
    }, [query, selectedTopics, selectedTypes, selectedTags, setResults, setLoading])

    const onToggleType = (type: TypeKey) => {
        setSelectedTypes(prev => {
            const newSet = new Set(prev)
            if (newSet.has(type)) {
                newSet.delete(type)
            } else {
                newSet.add(type)
            }
            return newSet
        })
    }

    // Helper function to get icon for type
    const getTypeIcon = (type: string) => {
        const lowerType = type.toLowerCase()
        if (lowerType.includes('report')) return <FileText className="size-4" strokeWidth={1.5} />
        if (lowerType.includes('article') || lowerType.includes('news')) return <Newspaper className="size-4" strokeWidth={1.5} />
        if (lowerType.includes('judgment') || lowerType.includes('judgement') || lowerType.includes('court')) return <Gavel className="size-4" strokeWidth={1.5} />
        if (lowerType.includes('video')) return <Video className="size-4" strokeWidth={1.5} />
        if (lowerType.includes('podcast') || lowerType.includes('audio')) return <Mic2 className="size-4" strokeWidth={1.5} />
        return <FileText className="size-4" strokeWidth={1.5} /> // Default icon
    }

    const toggleTopic = (topic: string, checked: boolean) => {
        setSelectedTopics(prev =>
            checked
                ? [...prev, topic]
                : prev.filter(t => t !== topic)
        );
    }

    const onToggleTag = (t: string) => {
        const next = new Set(selectedTags)
        if (next.has(t)) {
            next.delete(t)
        } else {
            next.add(t)
        }
        setSelectedTags(next)
    }


  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        {/* Breadcrumb */}
        <div className='space-y-6'>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Search</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Heading */}
          <div className="">
            <h1 className={`text-3xl md:text-4xl font-medium text-balance text-brand-primary-700 ${instrument_serif.className}`}>
              Results for <span className="text-brand-primary-900 font-bold">{query}</span>
            </h1>
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="mt-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent font-normal">
                <Funnel className="size-4" strokeWidth={1.5} />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0">
              <SheetHeader className="p-4">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <Separator />
              <div className="p-4">
                <div className="space-y-6">
                
                  {/* Topics */}
                  <section className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Topics</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                      {topics.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Loading topics...</p>
                      ) : (
                        topics.map((topic) => (
                          <div key={topic} className="flex items-center space-x-2">
                            <Checkbox
                              id={`mobile-topic-${topic}`}
                              checked={selectedTopics.includes(topic)}
                              onCheckedChange={(checked) => toggleTopic(topic, checked as boolean)}
                            />
                            <Label
                              htmlFor={`mobile-topic-${topic}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {topic}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Types */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Types</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {relevantTypes.length === 0 ? (
                        <div className="col-span-2 text-sm text-muted-foreground">Loading types...</div>
                      ) : (
                        relevantTypes.map((type) => (
                          <TypeButton
                            key={type}
                            active={selectedTypes.has(type)}
                            onClick={() => onToggleType(type)}
                            label={type}
                            icon={getTypeIcon(type)}
                          />
                        ))
                      )}
                    </div>
                  </section>


                  {/* Tags */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {relevantTags.map((t) => {
                        const active = selectedTags.has(t)
                        return (
                          <Button
                            key={t}
                            variant={active ? "default" : "outline"}
                            size="sm"
                            className={classNameMerge("rounded-full px-3 font-normal shadow-none text-xs h-auto py-1", active ? "" : "bg-background")}
                            onClick={() => onToggleTag(t)}
                          >
                            {t}
                          </Button>
                        )
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Content */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-10 gap-6">
          {/* Sidebar */}
          <div className="hidden md:block md:col-span-5 lg:col-span-3">
            <Card className='shadow-sm shadow-muted'>
              <CardContent className="p-4">
                <div className="space-y-6">
                
                  {/* Topics */}
                  <section className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Topics</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {topics.length > 0 ? (
                        topics.map((topic) => (
                          <div key={topic} className="flex items-center space-x-2">
                            <Checkbox
                              id={`topic-${topic}`}
                              checked={selectedTopics.includes(topic)}
                              onCheckedChange={(checked) => {
                                setSelectedTopics(prev =>
                                  checked
                                    ? [...prev, topic]
                                    : prev.filter(t => t !== topic)
                                );
                              }}
                            />
                            <Label htmlFor={`topic-${topic}`} className="text-sm font-normal">
                              {topic}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Loading topics...</p>
                      )}
                    </div>
                  </section>

                  {/* Types */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground">Types</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {relevantTypes.length === 0 ? (
                        <div className="col-span-2 text-sm text-muted-foreground">Loading types...</div>
                      ) : (
                        relevantTypes.map((type) => (
                          <TypeButton
                            key={type}
                            active={selectedTypes.has(type)}
                            onClick={() => onToggleType(type)}
                            label={type}
                            icon={getTypeIcon(type)}
                          />
                        ))
                      )}
                    </div>
                  </section>


                  {/* Tags */}
                  <section className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {relevantTags.length > 0 ? (
                        relevantTags.map((tag) => (
                          <div key={tag} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tag-${tag}`}
                              checked={selectedTags.has(tag)}
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedTags);
                                if (checked) {
                                  next.add(tag);
                                } else {
                                  next.delete(tag);
                                }
                                setSelectedTags(next);
                              }}
                            />
                            <Label htmlFor={`tag-${tag}`} className="text-sm font-normal">
                              {tag}
                            </Label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags found in results</p>
                      )}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <section className="md:col-span-7 lg:col-span-7">
            <div className="space-y-6">
              {loading && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">Loading results...</CardContent>
                </Card>
              )}
              {!loading && results.map((r, i) => (
                <div key={r.id}>
                  <Link href={`/resource/${r.id || encodeURIComponent(r.title)}`} className="flex flex-col md:flex-row gap-3.5 h-fit md:h-36 group">
                    {/* Thumbnail */}
                    <ResourceThumbnail resource={r} />

                    {/* Content */}
                    <div className="flex flex-col justify-center gap-1.5 md:gap-1 h-full">
                      <div className='flex items-center justify-between w-full'>
                        <Label className="text-muted-foreground uppercase text-sm">{r.theme || 'Resource'}</Label>
                        <div className="flex items-center gap-1">
                          <div className="flex flex-wrap gap-1 max-w-[100px] md:max-w-none overflow-hidden">
                            {[...new Set(r.tags)].slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-muted rounded-full whitespace-nowrap">
                                {tag}
                              </span>
                            ))}
                            {[...new Set(r.tags)].length > 2 && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                                +{[...new Set(r.tags)].length - 2}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center md:hidden">
                            <Button className="rounded-full border-none shadow-none hover:bg-background p-0" variant="outline" size="sm">
                              <Send className="size-4" strokeWidth={1.5} />
                            </Button>
                            <Button className="rounded-full border-none shadow-none hover:bg-background p-0" variant="outline" size="sm">
                              <Bookmark className="size-4" strokeWidth={1.5} />
                            </Button>
                          </div>
                          <Button className="rounded-full border-none shadow-none hover:bg-background p-0" variant="outline" size="sm" >
                            <Pencil className="size-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                      <h2 className="text-lg md:text-2xl font-semibold text-brand-primary-900 group-hover:underline">{r.title}</h2>
                      <div className='flex flex-col md:flex-row gap-2 md:items-center justify-between mt-2'>
                        <div className="flex items-center gap-2">
                          <Avatar className="rounded-full size-6">
                            <AvatarImage
                              src="https://github.com/evilrabbit.jpg"
                              alt="@evilrabbit"
                            />
                            <AvatarFallback className="text-xs">{(r.authors || 'A').slice(0,1)}</AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <h4>{r.source}</h4>
                            <span aria-hidden className="text-muted-foreground">•</span>
                            <p>{formatDateDMY(r.DateOfPublication || r.date)}</p>
                          </div>
                        </div>
                        <div className="hidden md:flex items-center">
                          <Button className="rounded-full border-none shadow-none hover:bg-background p-0" variant="outline" size="sm" >
                            <Send className="size-4" strokeWidth={1.5} />
                          </Button>
                          <Button className="rounded-full border-none shadow-none hover:bg-background p-0" variant="outline" size="sm" >
                            <Bookmark className="size-4" strokeWidth={1.5} />
                          </Button>
                          <Button className="rounded-full border-none shadow-none hover:bg-background p-0" variant="outline" size="sm" >
                            <Pencil className="size-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                  {i < results.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
              {!loading && results.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No results match your filters.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

const SearchPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  )
}

export default SearchPage

function TypeButton({
    active,
    onClick,
    label,
    icon,
}: {
    active: boolean
    onClick: () => void
    label: string
    icon: React.ReactNode
}) {
    return (
        <Button
            type="button"
            variant={active ? "default" : "outline"}
            className={classNameMerge("w-full justify-start gap-2 font-normal shadow-none", active ? "" : "bg-background")}
            onClick={onClick}
        >
            {icon}
            <span>{label}</span>
        </Button>
    )
}