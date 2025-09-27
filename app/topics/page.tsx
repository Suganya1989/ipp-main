'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bookmark, FileText, Pencil, Send, MessageSquare, Eye, Menu, X } from 'lucide-react'
import { formatDateDMY } from '@/lib/utils'

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
    theme?: string;
    authors?: string;
    linkToOriginalSource?: string;
}

type TopicCount = {
    name: string;
    count: number;
}

const TopicsPageContent = () => {
    const searchParams = useSearchParams()
    const theme = searchParams.get('theme')
    const [resources, setResources] = useState<Resource[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedTheme, setSelectedTheme] = useState<string>(theme || 'All Topics')
    const [topicCounts, setTopicCounts] = useState<TopicCount[]>([])
    const [totalResults, setTotalResults] = useState(0)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        // Load topic counts for standard topics on component mount
        fetchTopicCounts()

        if (theme) {
            setSelectedTheme(theme)
            fetchResourcesByTheme(theme)
        }
    }, [theme])

    const fetchTopicCounts = async () => {
        try {
            // Initialize with standard topics
            const standardTopics = topicTitles.map(title => ({ name: title, count: 0 }))
            setTopicCounts(standardTopics)

            // Fetch counts for each standard topic
            const countsPromises = topicTitles.slice(1).map(async (topic) => { // Skip "All Topics"
                try {
                    const response = await fetch(`/api/theme-resources?theme=${encodeURIComponent(topic)}&limit=1`)
                    const data = await response.json()
                    const count = Array.isArray(data.resources) ? data.resources.length : 0

                    // For a more accurate count, we could make another call to get the total
                    // but for now we'll use a rough estimate
                    const estimateResponse = await fetch(`/api/theme-resources?theme=${encodeURIComponent(topic)}&limit=100`)
                    const estimateData = await estimateResponse.json()
                    const estimatedCount = Array.isArray(estimateData.resources) ? estimateData.resources.length : 0

                    return { name: topic, count: estimatedCount }
                } catch (error) {
                    console.error(`Error fetching count for ${topic}:`, error)
                    return { name: topic, count: 0 }
                }
            })

            const topicCounts = await Promise.all(countsPromises)
            const totalCount = topicCounts.reduce((sum, topic) => sum + topic.count, 0)

            setTopicCounts([
                { name: 'All Topics', count: totalCount },
                ...topicCounts
            ])
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
            const response = await fetch(`/api/theme-resources?theme=${encodeURIComponent(themeName)}&limit=20`)
            const data = await response.json()
            const resourcesData = Array.isArray(data.resources) ? data.resources : []

            // Set initial resources without default images
            type UnknownResource = Resource & { ['date of publication']?: string }
            const initialResources = (resourcesData as UnknownResource[]).map((item) => ({
                ...item,
                DateOfPublication: item.dateOfPublication  || item.date,
                image: item.image || undefined // Don't set default image initially
            }))

            setResources(initialResources)
            setTotalResults(initialResources.length)
            setLoading(false) // Complete loading immediately after setting resources
            
            // Fetch OG images in the background without blocking
            setTimeout(() => {
                initialResources.forEach((item: Resource) => {
                    if (item.linkToOriginalSource && item.linkToOriginalSource.startsWith('http')) {
                        // Use requestIdleCallback for better performance if available
                        const fetchOGImage = () => {
                            fetch('/api/og-image-async', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    resourceId: item.id || `resource-${Date.now()}`,
                                    url: item.linkToOriginalSource
                                })
                            })
                            .then(response => {
                                console.log('OG Image API Response Status:', response.status)
                                if (!response.ok) {
                                    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                                }
                                return response.json()
                            })
                            .then(ogData => {
                                console.log('OG Image fetched for:', item.title, ogData)
                                if (ogData.ogImage) {
                                    // Update the specific resource with the OG image
                                    setResources(prev => prev.map(resource => 
                                        resource.id === item.id 
                                            ? { ...resource, image: ogData.ogImage }
                                            : resource
                                    ))
                                } else {
                                    // If no OG image found, keep image undefined (blank)
                                    setResources(prev => prev.map(resource => 
                                        resource.id === item.id 
                                            ? { ...resource, image: undefined }
                                            : resource
                                    ))
                                }
                            })
                            .catch((error) => {
                                console.error('Error fetching OG image for:', item.title, error)
                                // Keep image blank on error
                                setResources(prev => prev.map(resource => 
                                    resource.id === item.id 
                                        ? { ...resource, image: undefined }
                                        : resource
                                ))
                            })
                        }
                        
                        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                            window.requestIdleCallback(fetchOGImage)
                        } else {
                            setTimeout(fetchOGImage, 100)
                        }
                    } else {
                        // If no linkToOriginalSource, keep image blank
                        setResources(prev => prev.map(resource => 
                            resource.id === item.id 
                                ? { ...resource, image: undefined }
                                : resource
                        ))
                    }
                })
            }, 0)
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="md:hidden bg-white shadow-sm p-4 sticky top-16 z-30">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold text-brand-primary-900">Topics</h1>
                        {selectedTheme !== 'All Topics' && (
                            <p className="text-sm text-gray-600">
                                {selectedTheme} • {totalResults} Results
                            </p>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Menu className="w-4 h-4" />
                        Browse
                    </Button>
                </div>
            </div>

            {/* Mobile Topics Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                        className="absolute right-0 top-0 h-full w-80 max-w-[90vw] bg-white shadow-xl overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-brand-primary-900">Explore Topics</h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-4 space-y-2">
                            {topicCounts.map((topic) => (
                                <button
                                    key={topic.name}
                                    onClick={() => handleThemeClick(topic.name)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                                        selectedTheme === topic.name
                                            ? 'bg-brand-primary-900 text-white'
                                            : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                >
                                    <span className="text-sm font-medium">{topic.name}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        selectedTheme === topic.name
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {topic.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex">
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-64 bg-white shadow-sm p-6 fixed h-full overflow-y-auto">
                    <h1 className="text-xl font-semibold text-brand-primary-900 mb-6">Explore Topics</h1>

                    <div className="space-y-2">
                        {topicCounts.map((topic) => (
                            <button
                                key={topic.name}
                                onClick={() => handleThemeClick(topic.name)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                                    selectedTheme === topic.name
                                        ? 'bg-brand-primary-900 text-white'
                                        : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                <span className="text-sm font-medium">{topic.name}</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    selectedTheme === topic.name
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-200 text-gray-600'
                                }`}>
                                    {topic.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 md:ml-64 p-4 md:p-6">
                    {/* Desktop Header */}
                    <div className="hidden md:block mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-brand-primary-900">
                                    {selectedTheme === 'All Topics' ? 'All Topics' : selectedTheme}
                                </h2>
                                {selectedTheme !== 'All Topics' && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {totalResults} Results
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    {selectedTheme === 'All Topics' ? (
                        <div className="flex items-center justify-center h-64 md:h-96">
                            <div className="text-center px-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a topic to explore</h3>
                                <p className="text-gray-600 text-sm md:text-base">
                                    <span className="md:hidden">Use the Browse button to select a topic and view related resources</span>
                                    <span className="hidden md:inline">Choose from the topics in the sidebar to view related resources</span>
                                </p>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-3 md:p-4 shadow-sm border">
                                    <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                                        <div className="w-full h-48 md:w-24 md:h-24 bg-gray-300 rounded animate-pulse"></div>
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
                                    <Card className="bg-white hover:shadow-md transition-shadow border rounded-lg p-3 md:p-4">
                                        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                                            <div className="w-full h-48 md:w-24 md:h-24 flex-shrink-0">
                                                <Image
                                                    src={resource.image || "/Rules1.png"}
                                                    alt={resource.title}
                                                    width={320}
                                                    height={192}
                                                    className="w-full h-full object-cover rounded"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = "/Rules1.png";
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                                    <div className="flex-1">
                                                        <Badge variant="secondary" className="mb-2 text-xs">
                                                            {resource.theme || 'ARTICLE'}
                                                        </Badge>
                                                        <h3 className="font-semibold text-brand-primary-900 mb-2 line-clamp-2 text-sm md:text-base">
                                                            {resource.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 md:line-clamp-3">
                                                            {resource.summary}
                                                        </p>
                                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-xs text-gray-500">
                                                            <span className="font-medium">{resource.source || 'Source'}</span>
                                                            <span className="hidden md:inline">•</span>
                                                            <span>{formatDateDMY(resource.dateOfPublication || resource.date)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-3 md:mt-0 md:ml-4">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <Eye className="w-4 h-4" />
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