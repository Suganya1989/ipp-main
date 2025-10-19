# Cloudflare R2 Image Upload Implementation Summary

## Overview

This implementation enables automatic upload of og:images to Cloudflare R2 storage whenever a resource is opened. The system downloads the image from the original source, uploads it to your R2 bucket, and saves the R2 URL to the database.

## What Was Implemented

### 1. **R2 Upload Utility** (`lib/r2-util.ts`)

Created a comprehensive utility library for Cloudflare R2 operations:

- **`uploadImageToR2(imageUrl, resourceId)`**: Downloads an image from a URL and uploads it to R2
- **`uploadBufferToR2(buffer, filename, contentType)`**: Uploads a file buffer directly to R2
- Automatic file extension detection based on content type
- Unique filename generation with timestamps
- Error handling and logging

**Key Features:**
- Uses AWS S3 SDK (R2 is S3-compatible)
- Lazy initialization of R2 client
- Generates organized filenames: `resources/{resourceId}-{timestamp}.{ext}`

### 2. **Upload API Endpoint** (`app/api/upload-to-r2/route.ts`)

New POST endpoint that:
1. Accepts an image URL and resource ID
2. Calls `uploadImageToR2()` to upload to R2
3. Updates the database with the R2 URL using `updateResourceImage()`
4. Returns the public R2 URL

**Request:**
```json
{
  "imageUrl": "https://example.com/og-image.jpg",
  "resourceId": "abc-123-def-456"
}
```

**Response:**
```json
{
  "success": true,
  "r2Url": "https://pub-xxx.r2.dev/resources/abc-123-def-456-1234567890.jpg",
  "message": "Image uploaded to R2 and database updated successfully"
}
```

### 3. **Updated Resource Page** (`app/resource/[id]/page.tsx`)

Modified the `fetchAndSaveOgImage()` function to:
1. Extract og:image from the original source (existing functionality)
2. **NEW**: Upload the image to Cloudflare R2 via `/api/upload-to-r2`
3. **NEW**: Save the R2 URL (not the original URL) to the database
4. Update the UI to display the R2-hosted image

**Trigger:** Runs automatically whenever a resource page is loaded if the resource has a `linkToOriginalSource`

### 4. **Database Update Function** (`lib/weaviate-util.ts`)

Added `updateResourceImage(id, imageUrl)` function:
- Updates the `imageUrl` field in Weaviate's `DocsWithImages` collection
- Uses the Weaviate client's data updater API
- Returns success/failure status

### 5. **Dependencies** (`package.json`)

Installed:
- `@aws-sdk/client-s3` - AWS SDK for S3-compatible operations with Cloudflare R2

## File Structure

```
├── lib/
│   ├── r2-util.ts                    # NEW: R2 upload utilities
│   └── weaviate-util.ts              # UPDATED: Added updateResourceImage()
├── app/
│   ├── api/
│   │   ├── upload-to-r2/
│   │   │   └── route.ts              # NEW: Upload endpoint
│   │   └── resource/[id]/
│   │       └── route.ts              # UPDATED: Added PATCH handler
│   └── resource/[id]/
│       └── page.tsx                  # UPDATED: R2 upload integration
├── .env.local                        # UPDATED: R2 config variables
├── CLOUDFLARE_R2_SETUP.md           # NEW: Setup documentation
├── IMPLEMENTATION_SUMMARY.md         # NEW: This file
└── package.json                      # UPDATED: Added @aws-sdk/client-s3
```

## How It Works

### Complete Flow

```
1. User opens resource page
   ↓
2. Frontend checks if resource has linkToOriginalSource
   ↓
3. Calls /api/extract-url to get og:image URL
   ↓
4. Calls /api/upload-to-r2 with:
   - imageUrl (from og:image)
   - resourceId
   ↓
5. Backend downloads image from URL
   ↓
6. Backend uploads to Cloudflare R2
   ↓
7. Backend updates Weaviate database with R2 URL
   ↓
8. Frontend receives R2 URL
   ↓
9. UI displays image from R2
```

### Technical Details

**Image Download:**
```typescript
const response = await fetch(imageUrl)
const buffer = Buffer.from(await response.arrayBuffer())
```

**R2 Upload:**
```typescript
const command = new PutObjectCommand({
  Bucket: bucketName,
  Key: `resources/${resourceId}-${timestamp}.${extension}`,
  Body: buffer,
  ContentType: contentType,
})
await client.send(command)
```

**Database Update:**
```typescript
await client.data
  .updater()
  .withClassName('DocsWithImages')
  .withId(resourceId)
  .withProperties({ imageUrl: r2Url })
  .do()
```

## Required Configuration

### Environment Variables

Add these to `.env.local`:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket-url.r2.dev
```

See `CLOUDFLARE_R2_SETUP.md` for detailed instructions on obtaining these values.

## Testing

1. **Set up Cloudflare R2:**
   - Create an R2 bucket
   - Generate API tokens
   - Configure public access
   - Add credentials to `.env.local`

2. **Restart the development server:**
   ```bash
   npm run dev
   ```

3. **Test the flow:**
   - Navigate to any resource page (e.g., `/resource/{id}`)
   - Open browser console
   - Look for upload logs
   - Verify the image displays
   - Check that the image URL is from your R2 bucket

4. **Verify in database:**
   - Query Weaviate to confirm `imageUrl` field is updated
   - Should contain your R2 public URL

## Benefits

### ✅ Advantages

1. **Reliability**: Images are hosted on your infrastructure, not dependent on external sources
2. **Performance**: Cloudflare's global CDN ensures fast image delivery
3. **Control**: You own and control all images
4. **Cost-effective**: R2 has no egress fees (unlike AWS S3)
5. **Automatic**: Runs transparently when users view resources
6. **Consistency**: All images stored in a standardized format and location

### 📊 Storage Optimization

- Images organized in `resources/` folder
- Unique filenames prevent collisions
- Timestamp-based naming for versioning
- Automatic content-type detection

## Next Steps

### Immediate Actions

1. [ ] Configure Cloudflare R2 bucket and credentials
2. [ ] Update `.env.local` with your R2 credentials
3. [ ] Test with a few resources
4. [ ] Monitor R2 storage usage

### Future Enhancements

1. **Image Optimization**:
   - Resize/compress images before upload
   - Generate multiple sizes (thumbnails, preview, full)
   - Convert to WebP format for better compression

2. **Caching**:
   - Skip upload if image already exists in R2
   - Check by filename or hash

3. **Retry Logic**:
   - Implement exponential backoff for failed uploads
   - Queue failed uploads for retry

4. **Batch Processing**:
   - Create a script to upload images for existing resources
   - Background job to process resources without images

5. **Image Validation**:
   - Verify image dimensions and file size
   - Check for valid image formats
   - Scan for malicious content

6. **Analytics**:
   - Track upload success/failure rates
   - Monitor R2 storage usage
   - Alert on quota limits

## Troubleshooting

### Common Issues

**Issue**: "Missing Cloudflare R2 credentials"
- **Solution**: Ensure all 5 environment variables are set in `.env.local`

**Issue**: Images not uploading
- **Solution**: Check API token permissions, verify bucket name

**Issue**: Images upload but don't display
- **Solution**: Enable public access on your R2 bucket

**Issue**: "Failed to download image"
- **Solution**: Some websites block automated downloads; may need custom headers

**Issue**: TypeScript errors
- **Solution**: Run `npm install` to ensure @aws-sdk/client-s3 is installed

## Code Locations for Reference

- R2 utility: `lib/r2-util.ts:33-86`
- Upload endpoint: `app/api/upload-to-r2/route.ts:5-43`
- Resource page logic: `app/resource/[id]/page.tsx:89-135`
- Database update: `lib/weaviate-util.ts:1128-1148`
- PATCH handler: `app/api/resource/[id]/route.ts:29-57`

## Security Considerations

- Environment variables are server-side only (not exposed to client)
- R2 credentials never sent to frontend
- API routes validate input parameters
- Consider rate limiting the upload endpoint
- Monitor for abuse or excessive uploads

## Maintenance

- Regularly rotate Cloudflare API tokens
- Monitor R2 storage costs
- Set up alerts for quota limits
- Periodically review uploaded images
- Consider implementing image lifecycle policies (auto-delete old versions)

## Support

For issues or questions:
1. Check `CLOUDFLARE_R2_SETUP.md` for configuration help
2. Review browser console logs
3. Check server logs for detailed error messages
4. Verify all environment variables are correctly set
