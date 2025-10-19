import { FileText } from 'lucide-react'
import Image from 'next/image'

interface Resource {
  id?: string
  title: string
  type: string
  image?: string
  imageUrl?: string
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
  // Use imageUrl from database (Cloudflare R2) if available, otherwise fall back to image field
  const imageUrl = resource.imageUrl || resource.image
  const hasError = false
  const isLoading = false

  return (
    <div className={className}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Thumbnail for ${resource.title}`}
          fill
          sizes="(max-width: 768px) 144px, 176px"
          className="object-cover group-hover:opacity-95 transition-opacity"
          priority={priority}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="mx-auto h-8 w-8 mb-2" strokeWidth={1} />
            <p className="text-xs font-medium">{resource.type}</p>
          </div>
        </div>
      )}
    </div>
  )
}