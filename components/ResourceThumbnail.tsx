import { FileText } from 'lucide-react'
import Image from 'next/image'
import { useOGImage } from '@/hooks/useOGImage'

interface Resource {
  id?: string
  title: string
  type: string
  image?: string
  linkToOriginalSource?: string
}

interface ResourceThumbnailProps {
  resource: Resource
  className?: string
  priority?: boolean
}

export const ResourceThumbnail = ({
  resource,
  className = "relative h-28 w-36 shrink-0 overflow-hidden rounded-md bg-muted md:h-full md:w-44",
  priority = false
}: ResourceThumbnailProps) => {
  const { imageUrl, isLoading, hasError } = useOGImage({
    resourceId: resource.id,
    url: resource.linkToOriginalSource,
    enabled: !resource.image, // Only fetch OG image if no image exists
    fallbackImage: resource.image
  })

  return (
    <div className={className}>
      {imageUrl && !hasError ? (
        <Image
          src={imageUrl}
          alt={`Thumbnail for ${resource.title}`}
          fill
          sizes="(max-width: 768px) 144px, 176px"
          className="object-cover group-hover:opacity-95 transition-opacity"
          priority={priority}
          onError={() => {
            // This will be handled by the hook's error state
          }}
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