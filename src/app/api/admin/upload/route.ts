import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/backend/db/prisma'
import { requireAdmin } from '@/backend/auth/session'
import { validateCsrf, csrfErrorResponse } from '@/lib/csrf'
import { v2 as cloudinary } from 'cloudinary'
import { getEnv } from '@/lib/env'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return csrfErrorResponse()
    }

    await requireAdmin()

    const env = getEnv()
    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const altText = (formData.get('altText') as string) || 'Boutique asset'

    if (!file) {
      return NextResponse.json({ error: 'No image file uploaded' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Allowed types: JPEG, PNG, WebP, SVG.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File size exceeds maximum permitted limit (10MB)' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary if configured, otherwise fallback to base64 data URI for dev
    let secureUrl: string
    let publicId = `hb_${Date.now()}_${Math.random().toString(36).substring(7)}`

    if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'hemas_boutique',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        stream.end(buffer)
      })

      secureUrl = uploadResult.secure_url
      publicId = uploadResult.public_id
    } else {
      // In development fallback if Cloudinary credentials not configured yet
      secureUrl = `data:${file.type};base64,${buffer.toString('base64')}`
    }

    // Persist MediaAsset in database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        publicId,
        secureUrl,
        altText,
      },
    })

    return NextResponse.json({
      success: true,
      mediaAsset: {
        id: mediaAsset.id,
        secureUrl: mediaAsset.secureUrl,
        publicId: mediaAsset.publicId,
        altText: mediaAsset.altText,
      },
    })
  } catch (error: any) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to upload media asset' },
      { status: 500 }
    )
  }
}
