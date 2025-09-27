"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Link as LinkIcon, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'

const ContributePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    resourceUrl: '',
    title: '',
    summary: '',
    resourceType: '',
    location: '',
    theme: '',
    customTag: ''
  })

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sourceTypes, setSourceTypes] = useState<string[]>([])
  const [themes, setThemes] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [articleSuggestedTags, setArticleSuggestedTags] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{type: 'success' | 'error', message: string} | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch source types
        const typesResponse = await fetch('/api/types')
        const typesResult = await typesResponse.json()
        if (typesResult.data) {
          setSourceTypes(typesResult.data)
        }

        // Fetch themes
        const themesResponse = await fetch('/api/themes')
        const themesResult: { data: Array<{ name: string }> } = await themesResponse.json()
        console.log('Raw themes data in contribute page:', themesResult?.data)
        if (themesResult.data) {
          // Get unique theme names (same logic as search page)
          const uniqueThemeNames = [...new Set(themesResult.data.map(theme => theme.name))]
            .filter((name): name is string => Boolean(name))
          console.log('Unique theme names in contribute page:', uniqueThemeNames)
          setThemes(uniqueThemeNames)
        }

        // Fetch tags
        const tagsResponse = await fetch('/api/tags')
        const tagsResult: { data: Array<{ tag: string; count: number }> } = await tagsResponse.json()
        if (tagsResult.data) {
          // Extract just the tag names and limit to most relevant ones
          const tags = tagsResult.data
            .filter((tag) => tag.tag && !tag.tag.includes('.') && tag.tag.length > 2)
            .sort((a, b) => b.count - a.count) // Sort by usage count
            .slice(0, 12) // Take top 12 most used tags
            .map((tag) => tag.tag.charAt(0).toUpperCase() + tag.tag.slice(1))
          setSuggestedTags(tags)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.title || !formData.summary || !formData.resourceUrl) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in the title, summary, and resource URL'
      })
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/contribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: selectedTags
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Your contribution has been submitted successfully and is now under review!'
        })

        // Reset form after successful submission
        setFormData({
          name: '',
          email: '',
          resourceUrl: '',
          title: '',
          summary: '',
          resourceType: '',
          location: '',
          theme: '',
          customTag: ''
        })
        setSelectedTags([])
        setArticleSuggestedTags([])
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to submit contribution'
        })
      }
    } catch (error) {
      console.error('Error submitting contribution:', error)
      setSubmitStatus({
        type: 'error',
        message: 'Network error. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFetchDetails = async () => {
    if (!formData.resourceUrl) {
      alert('Please enter a URL first')
      return
    }

    setIsExtracting(true)
    try {
      const response = await fetch('/api/extract-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.resourceUrl }),
      })

      const result = await response.json()

      if (result.success) {
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title,
          summary: result.summary || prev.summary,
        }))

        // Auto-select suggested tags from the article
        if (result.suggestedTags && result.suggestedTags.length > 0) {
          setArticleSuggestedTags(result.suggestedTags)
          setSelectedTags(prev => {
            const newTags = result.suggestedTags.filter((tag: string) => !prev.includes(tag))
            return [...prev, ...newTags]
          })
        }
      } else {
        alert('Failed to extract details: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error fetching details:', error)
      alert('Failed to extract details from URL')
    } finally {
      setIsExtracting(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    if (formData.customTag && !selectedTags.includes(formData.customTag)) {
      setSelectedTags(prev => [...prev, formData.customTag])
      setFormData(prev => ({ ...prev, customTag: '' }))
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-black mb-3">Contribute a Resource</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Help build our knowledge base by sharing valuable content related to prison reform in India.
            Simply paste a link and we will automatically extract the details for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Your Information */}
          <section>
            <h2 className="text-xl font-normal text-black mb-2">Your Information</h2>
            <p className="text-gray-500 text-sm mb-4">Help us attribute your contribution properly (optional but recommended)</p>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Your name"
                  className="pl-10 h-10 text-sm"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Input
                  type="email"
                  placeholder="Your email address"
                  className="pl-10 h-10 text-sm"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Resource URL */}
          <section>
            <h2 className="text-xl font-normal text-black mb-2">Resource URL</h2>
            <p className="text-gray-500 text-sm mb-4">
              Paste the URL of the article, report, or resource you want to share. We will automatically
              extract the title, description, and image.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Input
                  type="url"
                  placeholder="https://example.com/prison-reform-article"
                  className="pl-10 h-10 text-sm"
                  value={formData.resourceUrl}
                  onChange={(e) => handleInputChange('resourceUrl', e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleFetchDetails}
                variant="outline"
                className="w-full h-10 text-sm"
                disabled={isExtracting || !formData.resourceUrl}
              >
                {isExtracting ? 'Extracting...' : 'Fetch Details'}
              </Button>
            </div>
          </section>

          {/* Content Details */}
          <section>
            <h2 className="text-xl font-normal text-black mb-2">Content Details</h2>
            <p className="text-gray-500 text-sm mb-4">Review and edit the automatically extracted information, or add your own if needed.</p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-normal text-gray-600 mb-2 block">Resource Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter Resource Title"
                  className="h-10 text-sm"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="summary" className="text-sm font-normal text-gray-600 mb-2 block">Blog Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Write a clear, informative summary of this resource. Focus on key findings, recommendations, or insights that would be valuable to the prison reform community."
                  className="min-h-[100px] text-sm resize-none"
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  0/500 Characters
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="resourceType" className="text-sm font-normal text-gray-600 mb-2 block">Resource Type</Label>
                  <select
                    title="selectResource"
                    id="resourceType"
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm focus:border-gray-400 focus:ring-gray-400 bg-white"
                    value={formData.resourceType}
                    onChange={(e) => handleInputChange('resourceType', e.target.value)}
                  >
                    <option value="">Select</option>
                    {sourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="location" className="text-sm font-normal text-gray-600 mb-2 block">Location</Label>
                  <select
                    title="selectLocation"
                    id="location"
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm focus:border-gray-400 focus:ring-gray-400 bg-white"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                  >
                    <option value="">Select</option>
                    <option value="national">National</option>
                    <option value="state">State Level</option>
                    <option value="local">Local</option>
                    <option value="international">International</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="theme" className="text-sm font-normal text-gray-600 mb-2 block">Select Topic</Label>
                  <select
                    title="selectTheme"
                    id="theme"
                    className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm focus:border-gray-400 focus:ring-gray-400 bg-white"
                    value={formData.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                  >
                    <option value="">Select Topic</option>
                    {themes.map((theme, index) => (
                      <option key={`theme-${index}-${theme}`} value={theme}>
                        {theme}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Thumbnail Image */}
          <section>
            <h2 className="text-xl font-normal text-black mb-2">Thumbnail Image</h2>
            <p className="text-gray-500 text-sm mb-4">Upload a thumbnail image for this resource, or choose from the suggested options.</p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto w-8 h-8 text-gray-400 mb-3" />
                <div className="space-y-2">
                  <Button type="button" variant="outline" className="text-sm h-9 px-4">
                    Upload
                  </Button>
                  <div className="text-gray-400 text-sm">or</div>
                  <Button type="button" variant="link" className="text-gray-600 text-sm p-0 h-auto">
                    choose thumbnail
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Tags */}
          <section>
            <h2 className="text-xl font-normal text-black mb-2">Tags</h2>
            <p className="text-gray-500 text-sm mb-4">Add relevant tags to help others discover this resource. Choose from suggested tags or add your own.</p>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-normal text-gray-600 mb-3 block">Suggested tags</Label>
                <div className="grid grid-cols-3 gap-2">
                  {suggestedTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag)
                    const isFromArticle = articleSuggestedTags.includes(tag.toLowerCase())

                    return (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        className={`h-8 text-xs ${
                          isSelected
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : isFromArticle
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {isFromArticle ? '✨ ' : '+ '}{tag}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-normal text-gray-600 mb-3 block">Add Custom Tag</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter Custom Tag"
                    className="h-9 text-sm"
                    value={formData.customTag}
                    onChange={(e) => handleInputChange('customTag', e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={addCustomTag}
                    className="h-9 px-4 text-sm bg-black hover:bg-gray-800"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Status Message */}
          {submitStatus && (
            <div className={`p-4 rounded-lg ${
              submitStatus.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {submitStatus.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 text-sm border-gray-300"
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              className="w-full h-10 text-sm bg-black hover:bg-gray-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Review'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default ContributePage