import Razorpay from 'razorpay'
import crypto from 'crypto'
import { validatePaymentConfig } from './env'

let razorpayInstance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (razorpayInstance) return razorpayInstance

  const { keyId, keySecret } = validatePaymentConfig()
  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
  return razorpayInstance
}

/**
 * Verify Razorpay payment signature from client checkout modal
 * signature = hmac_sha256(order_id + "|" + payment_id, key_secret)
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const { keySecret } = validatePaymentConfig()
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    )
  } catch {
    return false
  }
}

/**
 * Verify Razorpay webhook signature
 * signature = hmac_sha256(raw_body, webhook_secret)
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8')
    )
  } catch {
    return false
  }
}
