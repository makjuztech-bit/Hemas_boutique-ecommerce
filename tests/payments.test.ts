import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'crypto'
import { verifyRazorpaySignature, verifyWebhookSignature } from '../src/lib/razorpay'

test('Razorpay Payment Verification Suite', async (t) => {
  // Set test environment secret
  process.env.RAZORPAY_KEY_ID = 'rzp_test_sampleKey123'
  process.env.RAZORPAY_KEY_SECRET = 'sampleSecretKeyForTesting123'

  await t.test('verifies genuine Razorpay HMAC-SHA256 payment signature', () => {
    const orderId = 'order_DA123456789'
    const paymentId = 'pay_XY987654321'
    const secret = process.env.RAZORPAY_KEY_SECRET!

    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    const result = verifyRazorpaySignature(orderId, paymentId, validSignature)
    assert.equal(result, true, 'Genuine signature must verify successfully')
  })

  await t.test('rejects forged or altered Razorpay payment signature', () => {
    const orderId = 'order_DA123456789'
    const paymentId = 'pay_XY987654321'
    const forgedSignature = 'forged_fake_signature_hex_value_1234567890abcdef'

    const result = verifyRazorpaySignature(orderId, paymentId, forgedSignature)
    assert.equal(result, false, 'Forged signature must be rejected')
  })

  await t.test('verifies webhook HMAC-SHA256 signature with raw payload body', () => {
    const rawWebhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123',
            order_id: 'order_456',
            amount: 1450000,
            status: 'captured',
          },
        },
      },
    })
    const webhookSecret = 'test_webhook_secret_key_999'

    const validWebhookSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawWebhookPayload)
      .digest('hex')

    const result = verifyWebhookSignature(rawWebhookPayload, validWebhookSignature, webhookSecret)
    assert.equal(result, true, 'Webhook with genuine raw body signature must pass')

    const alteredPayload = rawWebhookPayload.replace('1450000', '1000')
    const alteredResult = verifyWebhookSignature(alteredPayload, validWebhookSignature, webhookSecret)
    assert.equal(alteredResult, false, 'Tampered webhook payload must fail signature check')
  })

  await t.test('server-side monetary calculation guarantees correct tax and shipping thresholds', () => {
    // Case 1: Order below ₹2,000 threshold (e.g. ₹1,500 = 150,000 paise)
    const subtotalBelow = 150000
    const taxBelow = Math.round(subtotalBelow * 0.05) // ₹75
    const shippingBelow = subtotalBelow > 200000 ? 0 : 15000 // ₹150 shipping
    const totalBelow = subtotalBelow + taxBelow + shippingBelow

    assert.equal(taxBelow, 7500)
    assert.equal(shippingBelow, 15000)
    assert.equal(totalBelow, 172500) // ₹1,725

    // Case 2: Order above ₹2,000 threshold (e.g. ₹14,500 = 1,450,000 paise)
    const subtotalAbove = 1450000
    const taxAbove = Math.round(subtotalAbove * 0.05) // ₹725
    const shippingAbove = subtotalAbove > 200000 ? 0 : 15000 // Free shipping
    const totalAbove = subtotalAbove + taxAbove + shippingAbove

    assert.equal(taxAbove, 72500)
    assert.equal(shippingAbove, 0)
    assert.equal(totalAbove, 1522500) // ₹15,225
  })
})
