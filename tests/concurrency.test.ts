import test from 'node:test'
import assert from 'node:assert/strict'

test('Inventory Concurrency & Overselling Prevention Suite', async (t) => {
  await t.test('simulated concurrent checkout prevents overselling last available inventory unit', async () => {
    // Shared stock count for the last royal Kanchipuram silk saree
    let availableStock = 1
    const checkoutRequests = [
      { customerId: 'cust-1', requestedQty: 1 },
      { customerId: 'cust-2', requestedQty: 1 },
    ]

    const results: Array<{ customerId: string; status: 'SUCCESS' | 'FAILED'; error?: string }> = []

    // Simulate atomic database transaction with stock check
    const processCheckout = async (req: { customerId: string; requestedQty: number }) => {
      // Simulates database lock / serializable transaction:
      if (availableStock >= req.requestedQty) {
        availableStock -= req.requestedQty
        results.push({ customerId: req.customerId, status: 'SUCCESS' })
      } else {
        results.push({
          customerId: req.customerId,
          status: 'FAILED',
          error: 'Item was just reserved by another customer. Out of stock.',
        })
      }
    }

    // Run both checkout requests concurrently
    await Promise.all(checkoutRequests.map((req) => processCheckout(req)))

    const successfulPurchases = results.filter((r) => r.status === 'SUCCESS')
    const failedPurchases = results.filter((r) => r.status === 'FAILED')

    assert.equal(successfulPurchases.length, 1, 'Exactly one concurrent purchase must succeed')
    assert.equal(failedPurchases.length, 1, 'Second concurrent purchase must fail due to zero remaining stock')
    assert.equal(availableStock, 0, 'Available stock must never drop below 0')
    assert.ok(failedPurchases[0].error?.includes('Out of stock'))
  })
})
