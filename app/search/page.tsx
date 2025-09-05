"use client"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn as classNameMerge } from "@/lib/utils"
import { Bookmark, FileText, Funnel, Gavel, Mic2, Newspaper, Pencil, Send, Sparkle, Video } from 'lucide-react'
import { Instrument_Serif } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { Suspense, useEffect, useMemo, useState } from 'react'


const instrument_serif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"]
})
type TypeKey = "Report" | "Article" | "Judgement" | "Video" | "Podcast"

type Resource = {
    id?: string
    title: string
    summary: string
    type: string
    tags: string[]
    source: string
    date: string
    image?: string
    theme?: string
    authors?: string
}

const SearchContent = () => {
    const [selectedState, setSelectedState] = useState<string | null>("All state")
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
    const [selectedTypes, setSelectedTypes] = useState<Set<TypeKey>>(new Set())
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
    const [results, setResults] = useState<Resource[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [topics, setTopics] = useState<string[]>([])
    const [tags, setTags] = useState<string[]>([])
    const searchParams = useSearchParams()
    const query = searchParams.get("query") || ""

    // Load topics and tags
    useEffect(() => {
        let mounted = true
        const themesController = new AbortController()
        const catsController = new AbortController()
        Promise.all([
            fetch('/api/themes', { signal: themesController.signal }).then(r => r.json()).catch(() => ({ data: [] })),
            fetch('/api/categories', { signal: catsController.signal }).then(r => r.json()).catch(() => ({ data: [] })),
        ]).then(([themesRes, categoriesRes]) => {
            if (!mounted) return
            const tps = Array.isArray(themesRes.data) ? themesRes.data.map((t: { name: string }) => t.name) : []
            const tgs = Array.isArray(categoriesRes.data) ? categoriesRes.data.map((c: { name: string }) => c.name) : []
            setTopics(tps)
            setTags(tgs)
            if (!selectedTopic && tps.length) setSelectedTopic(tps[0])
        })
        return () => { mounted = false; themesController.abort(); catsController.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fetch results when filters change
    useEffect(() => {
        let mounted = true
        const controller = new AbortController()
        setLoading(true)
        const params = new URLSearchParams()
        if (query) params.set('query', query)
        // Append selected tags to query for keyword narrowing
        if (selectedTags.size) {
            params.set('query', `${params.get('query') || ''} ${Array.from(selectedTags).join(' ')}`.trim())
        }
        // Types filters
        if (selectedTypes.size) {
            Array.from(selectedTypes).forEach((t) => params.append('types', t))
        }
        // Theme filter (topic)
        if (selectedTopic) params.append('themes', selectedTopic)

        fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
            .then(r => r.json())
            .then(j => { if (mounted) setResults(Array.isArray(j.data) ? j.data : []) })
            .catch((err) => { if (mounted && err?.name !== 'AbortError') setResults([]) })
            .finally(() => { if (mounted) setLoading(false) })
        return () => { mounted = false; controller.abort() }
    }, [query, selectedTopic, selectedTypes, selectedTags])

    const onToggleType = (t: TypeKey) => {
        const next = new Set(selectedTypes)
        if (next.has(t)) {
            next.delete(t)
        } else {
            next.add(t)
        }
        setSelectedTypes(next)
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
        <div className='flex items-center justify-center min-h-screen pt-14 pb-24'>
            <main className="w-11/12 md:w-10/12 space-y-10">
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
                                    {/* State */}
                                    <section className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">State</h3>
                                        <Select value={selectedState ?? "All state"} onValueChange={(v) => setSelectedState(v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="All state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </section>

                                    {/* Topics */}
                                    <section className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">Topics</h3>
                                        <Select value={selectedTopic ?? undefined} onValueChange={(v) => setSelectedTopic(v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select topic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {topics.map((t) => (
                                                    <SelectItem key={t} value={t}>
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </section>

                                    {/* Types */}
                                    <section className="space-y-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">Types</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <TypeButton
                                                active={selectedTypes.has("Report")}
                                                onClick={() => onToggleType("Report")}
                                                label="Reports"
                                                icon={<FileText className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Article")}
                                                onClick={() => onToggleType("Article")}
                                                label="Article"
                                                icon={<Newspaper className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Judgement")}
                                                onClick={() => onToggleType("Judgement")}
                                                label="Judgement"
                                                icon={<Gavel className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Video")}
                                                onClick={() => onToggleType("Video")}
                                                label="Video"
                                                icon={<Video className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Podcast")}
                                                onClick={() => onToggleType("Podcast")}
                                                label="Podcast"
                                                icon={<Mic2 className="size-4" strokeWidth={1.5} />}
                                            />
                                        </div>
                                    </section>

                                    {/* Tags */}
                                    <section className="space-y-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((t) => {
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
                                    {/* State */}
                                    <section className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">State</h3>
                                        <Select value={selectedState ?? "All state"} onValueChange={(v) => setSelectedState(v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="All state" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map((s) => (
                                                    <SelectItem key={s} value={s}>
                                                        {s}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </section>

                                    {/* Topics */}
                                    <section className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground">Topics</h3>
                                        <Select value={selectedTopic ?? undefined} onValueChange={(v) => setSelectedTopic(v)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select topic" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {topics.map((t) => (
                                                    <SelectItem key={t} value={t}>
                                                        {t}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </section>

                                    {/* Types */}
                                    <section className="space-y-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">Types</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <TypeButton
                                                active={selectedTypes.has("Report")}
                                                onClick={() => onToggleType("Report")}
                                                label="Reports"
                                                icon={<FileText className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Article")}
                                                onClick={() => onToggleType("Article")}
                                                label="Article"
                                                icon={<Newspaper className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Judgement")}
                                                onClick={() => onToggleType("Judgement")}
                                                label="Judgement"
                                                icon={<Gavel className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Video")}
                                                onClick={() => onToggleType("Video")}
                                                label="Video"
                                                icon={<Video className="size-4" strokeWidth={1.5} />}
                                            />
                                            <TypeButton
                                                active={selectedTypes.has("Podcast")}
                                                onClick={() => onToggleType("Podcast")}
                                                label="Podcast"
                                                icon={<Mic2 className="size-4" strokeWidth={1.5} />}
                                            />
                                        </div>
                                    </section>

                                    {/* Tags */}
                                    <section className="space-y-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {tags.map((t) => {
                                                const active = selectedTags.has(t)
                                                return (
                                                    <Button
                                                        key={t}
                                                        variant={active ? "default" : "outline"}
                                                        size="sm"
                                                        className={classNameMerge("rounded-full px-3 h-auto py-1 shadow-none text-xs font-normal", active ? "" : "bg-background")}
                                                        onClick={() => onToggleTag(t)}
                                                    >
                                                        {t}
                                                    </Button>
                                                )
                                            })}
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
                                    <div className="flex flex-col md:flex-row gap-3.5 h-fit md:h-36">
                                        {/* Thumbnail */}
                                        <div className="relative h-28 w-36 shrink-0 overflow-hidden rounded-md bg-muted md:h-full md:w-44">
                                            {r.image ? (
                                                <Image
                                                    src={r.image}
                                                    alt="Result thumbnail"
                                                    fill
                                                    sizes="128px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-muted animate-pulse" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-col justify-center gap-1.5 md:gap-1 h-full">
                                            <div className='flex items-center justify-between w-full'>
                                                <Label className="text-muted-foreground uppercase text-sm">{r.theme || 'Resource'}</Label>
                                                <div className="flex items-center md:hidden">
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
                                            <h2 className="text-lg md:text-2xl font-semibold text-brand-primary-900">{r.title}</h2>
                                            <div className='flex flex-col md:flex-row gap-2 md:items-center justify-between mt-2'>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="rounded-full size-6">
                                                        <AvatarImage
                                                            src="https://github.com/evilrabbit.jpg"
                                                            alt="@evilrabbit"
                                                        />
                                                        <AvatarFallback className="text-xs">{(r.authors || 'A').slice(0,1)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <h4>{r.source}</h4>
                                                        <Sparkle className="size-3 text-muted" strokeWidth={1.5} fill="" />
                                                        <p>{r.date}</p>
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
                                    </div>
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
            </main>
        </div>
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