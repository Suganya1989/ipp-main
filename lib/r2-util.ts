import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client for Cloudflare R2
let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (r2Client) return r2Client

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID
  const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing Cloudflare R2 credentials. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, and CLOUDFLARE_SECRET_ACCESS_KEY in .env.local'
    )
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return r2Client
}

/**
 * Upload an image to Cloudflare R2 from a URL
 * @param imageUrl - The URL of the image to download and upload
 * @param resourceId - The resource ID to use in the filename
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToR2(imageUrl: string, resourceId: string): Promise<string> {
  try {
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL

    if (!bucketName) {
      throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not set in .env.local')
    }

    if (!publicUrl) {
      throw new Error('CLOUDFLARE_R2_PUBLIC_URL is not set in .env.local')
    }

    // Download the image from the URL
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate a unique filename
    const extension = getExtensionFromContentType(contentType)
    const timestamp = Date.now()
    const filename = `resources/${resourceId}-${timestamp}.${extension}`

    // Upload to R2
    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })

    await client.send(command)

    // Return the public URL
    const finalUrl = `${publicUrl}/${filename}`
    console.log(`Successfully uploaded image to R2: ${finalUrl}`)

    return finalUrl
  } catch (error) {
    console.error('Error uploading image to R2:', error)
    throw error
  }
}

/**
 * Get file extension from content type
 */
function getExtensionFromContentType(contentType: string): string {
  const typeMap: { [key: string]: string } = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  }

  return typeMap[contentType.toLowerCase()] || 'jpg'
}

/**
 * Upload a buffer directly to R2 (for API routes handling file uploads)
 * @param buffer - The file buffer
 * @param filename - The desired filename
 * @param contentType - The content type of the file
 * @returns The public URL of the uploaded file
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  try {
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL

    if (!bucketName || !publicUrl) {
      throw new Error('Cloudflare R2 configuration is incomplete')
    }

    const client = getR2Client()
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    })

    await client.send(command)

    return `${publicUrl}/${filename}`
  } catch (error) {
    console.error('Error uploading buffer to R2:', error)
    throw error
  }
}
