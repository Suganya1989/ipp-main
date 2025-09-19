import { useState, useEffect, useRef } from 'react'

// Global cache to prevent duplicate requests for the same URL
const ogImageCache = new Map<string, Promise<string | null>>()
const ogImageResults = new Map<string, string | null>()

// Request queue to batch API calls
const requestQueue = new Set<string>()
let batchTimeout: NodeJS.Timeout | null = null

interface UseOGImageOptions {
  resourceId?: string
  url?: string
  enabled?: boolean
  fallbackImage?: string
}

export const useOGImage = ({
  resourceId,
  url,
  enabled = true,
  fallbackImage
}: UseOGImageOptions) => {
  const [ogImage, setOgImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled || !url || !resourceId) {
      return
    }

    // Check if we already have this result cached
    if (ogImageResults.has(url)) {
      const cachedResult = ogImageResults.get(url)
      setOgImage(cachedResult)
      setIsLoading(false)
      setHasError(cachedResult === null)
      return
    }

    // Check if request is already in progress
    if (ogImageCache.has(url)) {
      setIsLoading(true)
      ogImageCache.get(url)?.then(result => {
        if (isMountedRef.current) {
          setOgImage(result)
          setIsLoading(false)
          setHasError(result === null)
        }
      }).catch(() => {
        if (isMountedRef.current) {
          setHasError(true)
          setIsLoading(false)
        }
      })
      return
    }

    setIsLoading(true)
    setHasError(false)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    // Create promise for this request
    const requestPromise = fetch('/api/og-image-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resourceId,
        url
      }),
      signal: abortControllerRef.current.signal
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON')
        }
        return res.json()
      })
      .then(data => {
        const result = data.ogImage || null
        ogImageResults.set(url, result)
        return result
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.warn('Failed to fetch OG image:', error.message)
          ogImageResults.set(url, null)
        }
        return null
      })

    // Cache the promise to prevent duplicate requests
    ogImageCache.set(url, requestPromise)

    // Handle the result
    requestPromise.then(result => {
      if (isMountedRef.current) {
        setOgImage(result)
        setIsLoading(false)
        setHasError(result === null)
      }
    }).catch(() => {
      if (isMountedRef.current) {
        setHasError(true)
        setIsLoading(false)
      }
    })

  }, [enabled, url, resourceId])

  const imageUrl = ogImage || fallbackImage

  return {
    imageUrl,
    ogImage,
    isLoading,
    hasError,
    hasImage: Boolean(imageUrl)
  }
}

// Utility to preload OG images for better UX
export const preloadOGImages = (resources: Array<{ id?: string, linkToOriginalSource?: string }>) => {
  resources.forEach(resource => {
    if (resource.linkToOriginalSource && resource.id && !ogImageResults.has(resource.linkToOriginalSource)) {
      // Add to request queue for batched processing
      requestQueue.add(JSON.stringify({ resourceId: resource.id, url: resource.linkToOriginalSource }))

      // Process queue after a short delay to batch requests
      if (batchTimeout) clearTimeout(batchTimeout)
      batchTimeout = setTimeout(processBatchedRequests, 100)
    }
  })
}

const processBatchedRequests = () => {
  const requests = Array.from(requestQueue)
  requestQueue.clear()

  // Process requests with a small delay between each to avoid overwhelming the server
  requests.forEach((requestStr, index) => {
    setTimeout(() => {
      const { resourceId, url } = JSON.parse(requestStr)
      if (!ogImageCache.has(url)) {
        const requestPromise = fetch('/api/og-image-async', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ resourceId, url })
        })
          .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
          .then(data => {
            const result = data.ogImage || null
            ogImageResults.set(url, result)
            return result
          })
          .catch(() => {
            ogImageResults.set(url, null)
            return null
          })

        ogImageCache.set(url, requestPromise)
      }
    }, index * 50) // 50ms delay between requests
  })
}