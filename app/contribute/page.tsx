"use client"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { User, Mail, Link as LinkIcon, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

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
    customTag: '',
    showPublicly: 'yes'
  })

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sourceTypes, setSourceTypes] = useState<string[]>([])
  const [themes, setThemes] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [extractedImage, setExtractedImage] = useState<string>('')
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
          customTag: '',
          showPublicly: 'yes'
        })
        setSelectedTags([])
        setExtractedImage('')
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
        // Store the OG image
        if (result.image) {
          setExtractedImage(result.image)
        } else {
          alert('No image found for this URL')
        }
      } else {
        alert('Failed to extract image: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error fetching details:', error)
      alert('Failed to extract image from URL')
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
    <main className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 ${inter.className}`}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-semibold text-gray-900 mb-4 tracking-tight">Share a source</h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Help build our knowledge base by sharing valuable content related to prison reform in India. Simply paste a link and we&apos;ll automatically extract the details for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source URL */}
          <section className="bg-white rounded-xl p-8 shadow-lg shadow-blue-100/50 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Source URL</h2>
            <p className="text-gray-500 text-sm mb-6">
              Paste the URL of the article, report, or resource you want to share. We&apos;ll automatically extract the title, description, and image.
            </p>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="url"
                  placeholder="https://portal.com/prison-reform-article"
                  className="pl-11 h-12 text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.resourceUrl}
                  onChange={(e) => handleInputChange('resourceUrl', e.target.value)}
                />
              </div>
              <Button
                type="button"
                onClick={handleFetchDetails}
                className="h-12 px-8 text-sm font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                disabled={isExtracting || !formData.resourceUrl}
              >
                {isExtracting ? 'Loading...' : 'Fetch Details'}
              </Button>
            </div>
          </section>

          {/* Content Details */}
          <section className="bg-white rounded-xl p-8 shadow-lg shadow-blue-100/50 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Content Details</h2>
            <p className="text-gray-500 text-sm mb-6">Review and edit the automatically extracted information, or add your own if needed.</p>

            <div className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 mb-2.5 block">Resource Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Enter Resource Title"
                  className="h-12 text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="summary" className="text-sm font-semibold text-gray-700 mb-2.5 block">Blog Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Write a clear, informative summary..."
                  className="min-h-[140px] text-sm resize-none border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.summary}
                  onChange={(e) => handleInputChange('summary', e.target.value)}
                  maxLength={2000}
                />
                <div className="text-right text-xs font-medium text-gray-400 mt-2">
                  {formData.summary.length}/2000 Characters
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="resourceType" className="text-sm font-semibold text-gray-700 mb-2.5 block">Resource Type</Label>
                  <select
                    title="selectResource"
                    id="resourceType"
                    className="w-full h-12 border border-gray-200 rounded-lg px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white transition-all"
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
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-700 mb-2.5 block">Location</Label>
                  <select
                    title="selectLocation"
                    id="location"
                    className="w-full h-12 border border-gray-200 rounded-lg px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white transition-all"
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
              </div>

              <div>
                <Label htmlFor="theme" className="text-sm font-semibold text-gray-700 mb-2.5 block">Select Topic</Label>
                <select
                  title="selectTheme"
                  id="theme"
                  className="w-full h-12 border border-gray-200 rounded-lg px-4 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white transition-all"
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
          </section>

          {/* Thumbnail Image */}
          <section className="bg-white rounded-xl p-8 shadow-lg shadow-blue-100/50 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Thumbnail Image</h2>
            <p className="text-gray-500 text-sm mb-6">
              {extractedImage ? 'Preview of the extracted image from the URL' : 'Upload a thumbnail image for this resource, or choose from the suggested options.'}
            </p>

            {extractedImage ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                  <img
                    src={extractedImage}
                    alt="Extracted thumbnail"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setExtractedImage('')}
                  className="text-sm h-10 px-6 border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                >
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-blue-300 transition-colors">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="space-y-3">
                    <Button type="button" variant="outline" className="text-sm h-10 px-6 border-gray-300 hover:border-blue-400 hover:bg-blue-50 rounded-lg transition-all">
                      Upload Image
                    </Button>
                    <div className="text-gray-400 text-xs font-medium">or</div>
                    <Button type="button" variant="link" className="text-blue-600 text-sm p-0 h-auto hover:text-blue-700 font-medium">
                      choose thumbnail
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Tags */}
          <section className="bg-white rounded-xl p-8 shadow-lg shadow-blue-100/50 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Tags</h2>
            <p className="text-gray-500 text-sm mb-6">Add relevant tags to help others discover this resource. Choose from suggested tags or add your own.</p>

            <div className="space-y-6">
              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">Suggested tags</Label>
                <div className="grid grid-cols-3 gap-2.5">
                  {suggestedTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag)

                    return (
                      <Button
                        key={tag}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTag(tag)}
                        className={`h-9 text-xs font-medium rounded-lg transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md'
                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{tag}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-3 block">Add Custom Tag</Label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Enter Custom Tag"
                    className="h-12 text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.customTag}
                    onChange={(e) => handleInputChange('customTag', e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={addCustomTag}
                    className="h-12 px-6 text-sm font-medium bg-gray-900 hover:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Your Information */}
          <section className="bg-white rounded-xl p-8 shadow-lg shadow-blue-100/50 border border-gray-100">
            {/* Public Contributor Toggle */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-gray-900">
                  Do you want your name shown publicly as contributor?
                </h3>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name="showPublicly"
                        value="yes"
                        checked={formData.showPublicly === 'yes'}
                        onChange={(e) => handleInputChange('showPublicly', e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 rounded-full border-gray-300 peer-checked:border-yellow-500 peer-checked:bg-yellow-500 flex items-center justify-center transition-all">
                        <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="radio"
                        name="showPublicly"
                        value="no"
                        checked={formData.showPublicly === 'no'}
                        onChange={(e) => handleInputChange('showPublicly', e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border-2 rounded-full border-gray-300 peer-checked:border-gray-600 peer-checked:bg-gray-600 flex items-center justify-center transition-all">
                        <div className="w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100"></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">No</span>
                  </label>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Information</h2>
            <p className="text-gray-500 text-sm mb-6">Help us attribute your contribution properly (optional but recommended)</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Your name"
                  className="pl-11 h-12 text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="email"
                  placeholder="Your email address"
                  className="pl-11 h-12 text-sm border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Status Message */}
          {submitStatus && (
            <div className={`p-5 rounded-xl text-sm font-medium shadow-md ${
              submitStatus.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {submitStatus.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="px-10 h-12 text-sm border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-all"
              disabled={isSubmitting}
            >
              Save as draft
            </Button>
            <Button
              type="submit"
              className="px-10 h-12 text-sm bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default ContributePage