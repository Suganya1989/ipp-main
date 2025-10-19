# Cloudflare R2 Setup Guide

This document explains how to configure Cloudflare R2 for automatic image uploads in the Indian Prison Portal.

## Overview

When a resource is opened, the application will:
1. Extract the og:image from the original source URL
2. Download the image
3. Upload it to Cloudflare R2 storage
4. Save the R2 URL to the Weaviate database
5. Display the image from R2

## Required Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name_here
CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket-url.r2.cloudflarestorage.com
```

## How to Get Cloudflare R2 Credentials

### 1. Create an R2 Bucket

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Enter a bucket name (e.g., `prison-portal-images`)
5. Click **Create bucket**

### 2. Get Your Account ID

1. In the Cloudflare Dashboard, click on **R2**
2. Your Account ID is displayed at the top of the R2 page
3. Copy this value for `CLOUDFLARE_ACCOUNT_ID`

### 3. Create API Tokens (Access Keys)

1. In the R2 section, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Give it a name (e.g., `Prison Portal R2 Access`)
4. Set permissions to **Admin Read & Write** (or customize as needed)
5. Click **Create API token**
6. Copy the **Access Key ID** → `CLOUDFLARE_ACCESS_KEY_ID`
7. Copy the **Secret Access Key** → `CLOUDFLARE_SECRET_ACCESS_KEY`

   ⚠️ **Important**: The secret access key is only shown once. Save it securely!

### 4. Configure Public Access (Optional but Recommended)

To make images publicly accessible:

1. Go to your bucket settings
2. Navigate to **Settings** → **Public access**
3. Enable **Allow public access**
4. Configure a custom domain or use the default R2.dev subdomain

### 5. Get the Public URL

Your public URL will be in one of these formats:

- **Default R2.dev domain**: `https://pub-xxxxxxxxxxxxx.r2.dev`
- **Custom domain**: `https://images.yourdomain.com`

Use this for `CLOUDFLARE_R2_PUBLIC_URL` (without trailing slash)

## Example .env.local File

```bash
# Existing Weaviate Configuration
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_key
OPENAI_API_KEY=your_openai_key

# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=1a2b3c4d5e6f7g8h9i0j
CLOUDFLARE_ACCESS_KEY_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
CLOUDFLARE_SECRET_ACCESS_KEY=A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6
CLOUDFLARE_R2_BUCKET_NAME=prison-portal-images
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxx.r2.dev
```

## Testing the Setup

1. Add all environment variables to `.env.local`
2. Restart your Next.js development server
3. Open any resource page
4. Check the browser console for upload logs
5. Verify the image appears and is served from your R2 URL

## File Structure

```
lib/
  r2-util.ts              # R2 upload utility functions
app/api/
  upload-to-r2/
    route.ts              # API endpoint for R2 uploads
  resource/[id]/
    route.ts              # PATCH endpoint to update resource images
app/resource/[id]/
  page.tsx                # Resource page with automatic image upload
```

## How It Works

1. **User opens a resource page** → `app/resource/[id]/page.tsx`
2. **Extract og:image** → Calls `/api/extract-url` to get the image URL from the original source
3. **Upload to R2** → Calls `/api/upload-to-r2` with the image URL and resource ID
4. **Download & Upload** → `lib/r2-util.ts` downloads the image and uploads to R2 using AWS S3 SDK
5. **Update Database** → `lib/weaviate-util.ts` updates the resource with the R2 URL
6. **Display Image** → The page shows the image from R2

## Troubleshooting

### Error: Missing Cloudflare R2 credentials

Make sure all 5 environment variables are set in `.env.local`:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_ACCESS_KEY_ID`
- `CLOUDFLARE_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_PUBLIC_URL`

### Error: Failed to download image

- Verify the og:image URL is accessible
- Check if the source website blocks automated requests
- Some websites may require specific headers or cookies

### Error: Failed to upload to R2

- Verify your API token has write permissions
- Check that the bucket name is correct
- Ensure your account has sufficient R2 storage quota

### Images not displaying

- Verify public access is enabled on your R2 bucket
- Check CORS settings if accessing from different domains
- Verify the public URL is correct

## Security Notes

- Never commit `.env.local` to version control
- Rotate API tokens periodically
- Use the principle of least privilege for API token permissions
- Consider implementing rate limiting for the upload endpoint
- Monitor R2 usage to avoid unexpected costs

## Cost Considerations

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015 per GB per month
- **Class A operations** (writes): $4.50 per million requests
- **Class B operations** (reads): $0.36 per million requests
- **Egress**: Free (major advantage over S3)

For a typical prison portal with thousands of resources:
- ~10GB storage: ~$0.15/month
- ~10,000 uploads: ~$0.045
- Unlimited downloads: Free

## Additional Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Client Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
