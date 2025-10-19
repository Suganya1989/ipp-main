'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { MessageSquare, Eye, Menu, X, FileText, Mic, Video, FileType, ChevronDown, Search, Bookmark } from 'lucide-react'
import { formatDateDMY } from '@/lib/utils'
import { pageCache } from '@/lib/cache'

import { Instrument_Serif } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

const instrument_serif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"]
})

const topicTitles = [
    "All Topics",
    "Standards",
    "Overcrowding",
    "Health",
    "Reintegration",
    "Economy",
    "Justice",
    "Rights",
    "Technology",
    "Innovation",
    "Disparities",
    "Stories",
    "Case Laws",
    "Comparative",
    "Philosophy"
]

type Resource = {
    id?: string;
    title: string;
    summary: string;
    type: string;
    source: string;
    date: string;
    dateOfPublication?: string;
    image?: string;
    imageUrl?: string;
    theme?: string;
    authors?: string;
    linkToOriginalSource?: string;
}

type TopicCount = {
    name: string;
    count: number;
}

const resourceTypes = [
    { name: 'Article', icon: FileText },
    { name: 'Report', icon: FileType },
    { name: 'Podcast', icon: Mic },
    { name: 'Video', icon: Video }
]

const TopicsPageContent = () => {
    const searchParams = useSearchParams()
    const theme = searchParams.get('theme')
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedTheme, setSelectedTheme] = useState<string>(theme || 'All Topics')
    const [topicCounts, setTopicCounts] = useState<TopicCount[]>([])
    const [totalResults, setTotalResults] = useState(0)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // New filter states
    const [selectedLocation, setSelectedLocation] = useState('Island')
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [availableTags, setAvailableTags] = useState<string[]>([])

    useEffect(() => {
        // DON'T load topic counts on mount - too slow!
        // fetchTopicCounts()

        // Load tags in background
        fetchTags()

        if (theme) {
            setSelectedTheme(theme)
            fetchResourcesByTheme(theme)
        }
    }, [theme])

    const fetchTags = async () => {
        try {
            const response = await fetch('/api/tags')
            const data = await response.json()
            const allTags = Array.isArray(data.data) ? data.data.map((t: { name: string }) => t.name) : []

            // Deduplicate tags case-insensitively and rank by frequency (same logic as search page)
            const tagFrequency = allTags.reduce((acc, tag) => {
                if (tag && tag.trim()) {
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

            setAvailableTags(sortedTags)
        } catch (error) {
            console.error('Error fetching tags:', error)
            setAvailableTags([])
        }
    }

    const fetchTopicCounts = async () => {
        try {
            // Check cache first
            const cacheKey = 'topics-page-counts'
            const cachedCounts = pageCache.get(cacheKey) as TopicCount[] | null

            if (cachedCounts) {
                console.log('[Topics] Using cached topic counts')
                setTopicCounts(cachedCounts)
                return
            }

            // Initialize with standard topics
            const standardTopics = topicTitles.map(title => ({ name: title, count: 0 }))
            setTopicCounts(standardTopics)

            // Fetch counts sequentially to avoid overwhelming the server
            const topicCounts: TopicCount[] = []

            for (const topic of topicTitles.slice(1)) { // Skip "All Topics"
                try {
                    // Only make one request per topic with a reasonable limit
                    const response = await fetch(`/api/theme-resources?theme=${encodeURIComponent(topic)}&limit=50`)
                    const data = await response.json()
                    const estimatedCount = Array.isArray(data.resources) ? data.resources.length : 0

                    topicCounts.push({ name: topic, count: estimatedCount })

                    // Small delay to prevent overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 100))
                } catch (error) {
                    console.error(`Error fetching count for ${topic}:`, error)
                    topicCounts.push({ name: topic, count: 0 })
                }
            }

            const totalCount = topicCounts.reduce((sum, topic) => sum + topic.count, 0)

            const finalCounts = [
                { name: 'All Topics', count: totalCount },
                ...topicCounts
            ]

            // Cache for 10 minutes
            pageCache.set(cacheKey, finalCounts, 600)

            setTopicCounts(finalCounts)
        } catch (error) {
            console.error('Error fetching topic counts:', error)
            // Fallback to standard topics without counts
            setTopicCounts(topicTitles.map(title => ({ name: title, count: 0 })))
        }
    }

    const fetchResourcesByTheme = async (themeName: string) => {
        if (themeName === 'All Topics') {
            setResources([])
            setTotalResults(0)
            return
        }

        setLoading(true)
        try {
            // Check cache first
            const cacheKey = `topics-page-keyword-${themeName}`
            const cachedResources = pageCache.get(cacheKey) as Resource[] | null

            if (cachedResources) {
                console.log(`[Topics] Using cached keyword search results for ${themeName}`)
                setResources(cachedResources)
                setTotalResults(cachedResources.length)
                setLoading(false)
                return
            }

            // Use keyword search API
            console.log(`[Topics] Performing keyword search for: ${themeName}`)
            const params = new URLSearchParams({
                query: themeName,
                limit: '20'
            })
            const response = await fetch(`/api/search?${params.toString()}`)
            const data = await response.json()
            const resourcesData = Array.isArray(data.data) ? data.data : []
            console.log(`[Topics] Keyword search found ${resourcesData.length} results`)

            // Set initial resources with imageUrl support
            type UnknownResource = Resource & { ['date of publication']?: string }
            const initialResources = (resourcesData as UnknownResource[]).map((item) => ({
                ...item,
                DateOfPublication: item.dateOfPublication || item.date,
            }))

            // Cache for 10 minutes
            pageCache.set(cacheKey, initialResources, 600)

            setResources(initialResources)
            setTotalResults(initialResources.length)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching resources:', error)
            setResources([])
            setLoading(false)
        }
    }

    const handleThemeClick = (themeName: string) => {
        setSelectedTheme(themeName)
        setIsMobileMenuOpen(false) // Close mobile menu when theme is selected
        if (themeName === 'All Topics') {
            setResources([])
            setTotalResults(0)
        } else {
            fetchResourcesByTheme(themeName)
        }
    }

    const handleTopicToggle = (topic: string) => {
        const newSelectedTopics = selectedTopics.includes(topic)
            ? selectedTopics.filter(t => t !== topic)
            : [...selectedTopics, topic]

        setSelectedTopics(newSelectedTopics)

        // Trigger search with new topics selection
        if (newSelectedTopics.length > 0) {
            // Combine all selected topics into semantic search
            fetchResourcesByMultipleTopics(newSelectedTopics)
        } else if (selectedTheme && selectedTheme !== 'All Topics') {
            // If no topics selected, fall back to main theme search
            fetchResourcesByTheme(selectedTheme)
        }
    }

    const handleTypeToggle = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        )
    }

    const handleTagToggle = (tag: string) => {
        // When a tag is clicked, perform semantic search with the current theme + tag
        if (selectedTheme && selectedTheme !== 'All Topics') {
            fetchResourcesWithTags(selectedTheme, [tag])
        }
    }

    const fetchResourcesByMultipleTopics = async (topics: string[]) => {
        setLoading(true)
        try {
            console.log(`[Topics] Keyword search with multiple topics: ${topics.join(', ')}`)

            // Combine all topics into a single query string for keyword search
            const combinedQuery = topics.join(' ')

            // Build query parameters for keyword search
            const params = new URLSearchParams({
                query: combinedQuery,
                limit: '20'
            })

            const response = await fetch(`/api/search?${params.toString()}`)
            const data = await response.json()
            const resourcesData = Array.isArray(data.data) ? data.data : []

            type UnknownResource = Resource & { ['date of publication']?: string }
            const initialResources = (resourcesData as UnknownResource[]).map((item) => ({
                ...item,
                DateOfPublication: item.dateOfPublication || item.date,
            }))

            console.log(`[Topics] Found ${initialResources.length} results for multiple topics`)
            setResources(initialResources)
            setTotalResults(initialResources.length)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching resources with multiple topics:', error)
            setResources([])
            setLoading(false)
        }
    }

    const fetchResourcesWithTags = async (theme: string, tags: string[]) => {
        setLoading(true)
        try {
            console.log(`[Topics] Keyword search with theme: ${theme} and tags: ${tags.join(', ')}`)

            // Combine theme and tags into a single query string for keyword search
            const combinedQuery = [theme, ...tags].join(' ')

            // Build query parameters for keyword search
            const params = new URLSearchParams({
                query: combinedQuery,
                limit: '20'
            })

            console.log("Keyword search called")
            const response = await fetch(`/api/search?${params.toString()}`)
            const data = await response.json()
            const resourcesData = Array.isArray(data.data) ? data.data : []

            type UnknownResource = Resource & { ['date of publication']?: string }
            const initialResources = (resourcesData as UnknownResource[]).map((item) => ({
                ...item,
                DateOfPublication: item.dateOfPublication || item.date,
            }))

            console.log(`[Topics] Found ${initialResources.length} results with tags`)
            setResources(initialResources)
            setTotalResults(initialResources.length)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching resources with tags:', error)
            setResources([])
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Topics */}
            <div className="bg-white shadow-sm p-6 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center mb-4">
                        <div className="flex items-center justify-between w-full mb-6">
                            <div className="flex-1"></div>
                            <h1 className="text-2xl md:text-3xl font-semibold text-brand-primary-900 text-center">Explore Topics</h1>
                            <div className="flex-1 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="md:hidden flex items-center gap-2"
                                >
                                    <Menu className="w-4 h-4" />
                                    Filters
                                </Button>
                            </div>
                        </div>

                        {/* All Topics - Wrap to multiple lines */}
                        <div className="flex flex-wrap gap-2 w-full justify-center px-4">
                            {topicTitles.map((topic) => (
                                <Badge
                                    key={topic}
                                    variant={selectedTheme === topic ? "default" : "outline"}
                                    className="cursor-pointer whitespace-nowrap text-sm px-4 py-2 hover:bg-accent transition-colors"
                                    onClick={() => handleThemeClick(topic)}
                                >
                                    {topic}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-semibold text-brand-primary-900">Filters</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Mobile Filter Content - Same as desktop */}
                        <div className="p-4 space-y-6">
                            {/* Search */}
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Location */}
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Location</Label>
                                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Island">Island</SelectItem>
                                        <SelectItem value="National">National</SelectItem>
                                        <SelectItem value="Regional">Regional</SelectItem>
                                        <SelectItem value="Global">Global</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Separator />

                            {/* Topics */}
                            <div>
                                <Label className="text-sm font-medium mb-3 block">Topics</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {topicTitles.slice(1).map((topic) => (
                                        <div key={topic} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`mobile-${topic}`}
                                                checked={selectedTopics.includes(topic)}
                                                onCheckedChange={() => handleTopicToggle(topic)}
                                            />
                                            <label
                                                htmlFor={`mobile-${topic}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {topic}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            {/* Types */}
                            <div>
                                <Label className="text-sm font-medium mb-3 block">Types</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {resourceTypes.map((type) => {
                                        const Icon = type.icon
                                        const isSelected = selectedTypes.includes(type.name)
                                        return (
                                            <button
                                                key={type.name}
                                                onClick={() => handleTypeToggle(type.name)}
                                                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                                                    isSelected
                                                        ? 'border-brand-primary-900 bg-brand-primary-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-brand-primary-900' : 'text-gray-600'}`} />
                                                <span className={`text-xs font-medium ${isSelected ? 'text-brand-primary-900' : 'text-gray-700'}`}>
                                                    {type.name}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <Separator />

                            {/* Tags */}
                            <div>
                                <Label className="text-sm font-medium mb-3 block">Tags</Label>
                                <div className="flex flex-wrap gap-2">
                                    {availableTags.length > 0 ? (
                                        availableTags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-brand-primary-100 hover:border-brand-primary-500 transition-colors"
                                                onClick={() => handleTagToggle(tag)}
                                            >
                                                {tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Loading tags...</p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Date Range */}
                            <div>
                                <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-xs text-gray-600 mb-1 block">From</Label>
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-600 mb-1 block">To</Label>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex">
                {/* Desktop Sidebar with Filters */}
                <div className="hidden md:block w-80 bg-white shadow-sm fixed h-full overflow-y-auto" style={{top: '180px'}}>
                    <div className="p-6 space-y-6">

                        {/* Search */}
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <Separator />

                        {/* Location */}
                        <div>
                            <Label className="text-sm font-medium mb-2 block">Location</Label>
                            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Island">Island</SelectItem>
                                    <SelectItem value="National">National</SelectItem>
                                    <SelectItem value="Regional">Regional</SelectItem>
                                    <SelectItem value="Global">Global</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        {/* Topics */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Topics</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {topicTitles.slice(1).map((topic) => (
                                    <div key={topic} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={topic}
                                            checked={selectedTopics.includes(topic)}
                                            onCheckedChange={() => handleTopicToggle(topic)}
                                        />
                                        <label
                                            htmlFor={topic}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {topic}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Types */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Types</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {resourceTypes.map((type) => {
                                    const Icon = type.icon
                                    const isSelected = selectedTypes.includes(type.name)
                                    return (
                                        <button
                                            key={type.name}
                                            onClick={() => handleTypeToggle(type.name)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                                                isSelected
                                                    ? 'border-brand-primary-900 bg-brand-primary-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-brand-primary-900' : 'text-gray-600'}`} />
                                            <span className={`text-xs font-medium ${isSelected ? 'text-brand-primary-900' : 'text-gray-700'}`}>
                                                {type.name}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <Separator />

                        {/* Tags */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Tags</Label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.length > 0 ? (
                                    availableTags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-brand-primary-100 hover:border-brand-primary-500 transition-colors"
                                            onClick={() => handleTagToggle(tag)}
                                        >
                                            {tag}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">Loading tags...</p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Date Range */}
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-gray-600 mb-1 block">14/Aug/2025 - 14/Aug/2025</Label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        placeholder="14/Aug/2025"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button className="w-full">Read all</Button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 md:ml-80 p-4 md:p-6">
                    {/* Results info */}
                    {selectedTheme !== 'All Topics' && (
                        <div className="mb-6">
                            <Badge variant="secondary" className="mb-2 uppercase text-xs">DELHI_INDIA</Badge>
                            <p className="text-sm text-muted-foreground">
                                {totalResults} Results for {selectedTheme}
                            </p>
                        </div>
                    )}

                    {/* Content Area */}
                    {selectedTheme === 'All Topics' ? (
                        <div className="flex items-center justify-center h-64 md:h-96">
                            <div className="text-center px-4">
                                <h3 className="text-lg font-semibold text-brand-primary-900 mb-2">Select a topic to explore</h3>
                                <p className="text-muted-foreground text-sm md:text-base">
                                    <span className="md:hidden">Use the Filters button to select topics and filters</span>
                                    <span className="hidden md:inline">Choose from the topics and apply filters to view related resources</span>
                                </p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 md:p-4 shadow-sm border">
                                    <div className="flex gap-4">
                                        <div className="w-32 h-32 bg-gray-300 rounded animate-pulse flex-shrink-0"></div>
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                                            <div className="h-3 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                                            <div className="h-3 bg-gray-300 rounded w-1/4 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {resources.map((resource, idx) => (
                                <Link key={resource.id || idx} href={`/resource/${resource.id || encodeURIComponent(resource.title)}`}>
                                    <Card className="bg-white hover:shadow-md transition-shadow border rounded-lg overflow-hidden">
                                        <div className="flex gap-4 p-4">
                                            {/* Image */}
                                            <div className="w-32 h-32 flex-shrink-0">
                                                <Image
                                                    src={resource.imageUrl || resource.image || "/Rules1.png"}
                                                    alt={resource.title}
                                                    width={128}
                                                    height={128}
                                                    className="w-full h-full object-cover rounded"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "/Rules1.png";
                                                    }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <Badge variant="secondary" className="mb-2 text-xs uppercase">
                                                            {resource.theme || 'DELHI_INDIA'}
                                                        </Badge>
                                                        <h3 className="text-lg font-semibold text-brand-primary-900 mb-2 line-clamp-2">
                                                            {resource.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                            <Avatar className="w-5 h-5">
                                                                <AvatarFallback className="text-xs">
                                                                    {(resource.authors || 'A').charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{resource.authors || resource.source}</span>
                                                            <span>•</span>
                                                            <span>{formatDateDMY(resource.dateOfPublication || resource.date)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Bookmark className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const TopicsPage = () => {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <TopicsPageContent />
        </Suspense>
    )
}

export default TopicsPage
