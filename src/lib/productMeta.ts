export type ProductMetadata = {
  hasFeedingZip: boolean
  feedingZipPrice: number // in INR, e.g. 200
  sizes: string[] // e.g. ['S', 'M', 'L', 'XL', 'XXL']
}

export const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Free Size']

const META_REGEX = /<!--BOUTIQUE_META:([\s\S]*?)-->/

export function parseProductDescription(rawDescription?: string | null): {
  cleanDescription: string
  meta: ProductMetadata
} {
  if (!rawDescription) {
    return {
      cleanDescription: '',
      meta: {
        hasFeedingZip: false,
        feedingZipPrice: 200,
        sizes: ['Free Size'],
      },
    }
  }

  const match = rawDescription.match(META_REGEX)
  let meta: ProductMetadata = {
    hasFeedingZip: false,
    feedingZipPrice: 200,
    sizes: ['Free Size'],
  }

  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1])
      meta = {
        hasFeedingZip: Boolean(parsed.hasFeedingZip),
        feedingZipPrice: Number(parsed.feedingZipPrice) >= 0 ? Number(parsed.feedingZipPrice) : 200,
        sizes: Array.isArray(parsed.sizes) && parsed.sizes.length > 0 ? parsed.sizes : ['Free Size'],
      }
    } catch {
      // Ignore JSON parse error and use defaults
    }
  }

  const cleanDescription = rawDescription.replace(META_REGEX, '').trim()

  return { cleanDescription, meta }
}

export function serializeProductDescription(
  cleanDescription: string,
  meta: {
    hasFeedingZip?: boolean
    feedingZipPrice?: number
    sizes?: string[]
  }
): string {
  const metaObj = {
    hasFeedingZip: Boolean(meta.hasFeedingZip),
    feedingZipPrice: Number(meta.feedingZipPrice) || 200,
    sizes: meta.sizes && meta.sizes.length > 0 ? meta.sizes : ['Free Size'],
  }

  const trimmedText = (cleanDescription || '').replace(META_REGEX, '').trim()
  return `${trimmedText}\n\n<!--BOUTIQUE_META:${JSON.stringify(metaObj)}-->`
}
