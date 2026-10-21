import test from 'node:test'
import assert from 'node:assert/strict'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

test('Full Application Integration & End-to-End Test Suite', async (t) => {
  let sampleProductId: string | null = null

  await t.test('1. Health Check Endpoint (/api/health)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`)
    assert.equal(res.status, 200, 'Health endpoint must respond with 200 OK')

    const data = await res.json()
    assert.equal(data.status, 'healthy', 'Status must be healthy')
    assert.equal(data.services?.database, 'connected', 'Database service must be connected')
    assert.equal(data.services?.api, 'operational', 'API service must be operational')
    assert.equal(typeof data.responseTimeMs, 'number', 'Response time must be reported')
  })

  await t.test('2. Categories Catalog API (/api/categories)', async () => {
    const res = await fetch(`${BASE_URL}/api/categories`)
    assert.equal(res.status, 200, 'Categories endpoint must respond with 200 OK')

    const data = await res.json()
    assert.ok(Array.isArray(data.categories), 'Should return categories array')
    assert.ok(data.categories.length > 0, 'Database should contain categories')

    const firstCat = data.categories[0]
    assert.ok(firstCat.id, 'Category must have id')
    assert.ok(firstCat.name, 'Category must have name')
    assert.ok(firstCat.slug, 'Category must have slug')
  })

  await t.test('3. Products Catalog API (/api/products)', async () => {
    const res = await fetch(`${BASE_URL}/api/products`)
    assert.equal(res.status, 200, 'Products endpoint must respond with 200 OK')

    const data = await res.json()
    assert.ok(Array.isArray(data.products), 'Products response must contain products array')
    assert.ok(data.products.length > 0, 'Catalog should contain products')

    const product = data.products[0]
    sampleProductId = product.id
    assert.ok(product.id, 'Product must have an id')
    assert.ok(product.name, 'Product must have a name')
    assert.ok(product.slug, 'Product must have a slug')
    assert.ok(Array.isArray(product.variants), 'Product must have variants array')
    assert.ok(product.variants.length > 0, 'Product should have at least 1 variant')
    assert.ok(typeof product.variants[0].price === 'number', 'Variant price must be a number')
  })

  await t.test('4. Single Product Details API (/api/products/[id])', async () => {
    assert.ok(sampleProductId, 'Sample product ID must be available')
    const res = await fetch(`${BASE_URL}/api/products/${sampleProductId}`)
    assert.equal(res.status, 200, 'Single product details must return 200 OK')

    const data = await res.json()
    const product = data.product
    assert.equal(product?.id, sampleProductId, 'Fetched product ID must match requested ID')
    assert.ok(product?.name, 'Fetched product must have a name')
  })

  await t.test('5. Non-existent Product Details (/api/products/invalid-id)', async () => {
    const res = await fetch(`${BASE_URL}/api/products/non-existent-id-00000000`)
    assert.equal(res.status, 404, 'Non-existent product ID must return 404 Not Found')
  })

  await t.test('6. Unauthenticated Admin Route Protection (Middleware Guard)', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      redirect: 'manual',
    })
    // Middleware redirects unauthenticated requests with 307
    assert.ok([307, 401, 403].includes(res.status), `Expected 307, 401, or 403, got ${res.status}`)
    const location = res.headers.get('location')
    if (res.status === 307) {
      assert.ok(location?.includes('login'), 'Redirect must point to login')
    }
  })

  await t.test('7. Unauthenticated User Orders Protection (Middleware Guard)', async () => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      redirect: 'manual',
    })
    assert.ok([307, 401, 403].includes(res.status), `Expected 307, 401, or 403, got ${res.status}`)
  })

  await t.test('8. CSRF Protection Rejection on Mutating Requests', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://malicious-attacker-website.com',
      },
      body: JSON.stringify({ email: 'attacker@evil.com', password: 'password123' }),
    })
    assert.equal(res.status, 403, 'Cross-origin request must be blocked by CSRF guard with 403 Forbidden')
  })

  await t.test('9. Auth Registration Validation with Valid Origin', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    })
    assert.equal(res.status, 400, 'Invalid registration payload must return 400 Bad Request')
    const body = await res.json()
    assert.ok(body.error, 'Response must describe the validation error')
  })

  await t.test('10. Auth Login Validation with Valid Origin', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': BASE_URL,
      },
      body: JSON.stringify({ email: '', password: '' }),
    })
    assert.equal(res.status, 400, 'Empty login payload must return 400 Bad Request')
  })

  await t.test('11. Razorpay Webhook Tampered Signature Rejection (/api/webhooks/razorpay)', async () => {
    const res = await fetch(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'invalid_forged_signature_123',
      },
      body: JSON.stringify({ event: 'payment.captured' }),
    })
    assert.equal(res.status, 400, 'Webhook with forged signature must return 400 Bad Request')
  })

  await t.test('12. Frontend Pages and SEO Endpoints Availability', async () => {
    const pages = [
      { path: '/', expectedKeyword: 'Hema' },
      { path: '/login', expectedKeyword: 'Hema' },
      { path: '/cart', expectedKeyword: 'Hema' },
      { path: '/admin/login', expectedKeyword: 'Hema' },
      { path: '/robots.txt', expectedKeyword: 'User-agent' },
      { path: '/sitemap.xml', expectedKeyword: 'urlset' },
    ]

    for (const page of pages) {
      const res = await fetch(`${BASE_URL}${page.path}`)
      assert.equal(res.status, 200, `Page ${page.path} must return 200 OK`)
      const text = await res.text()
      assert.ok(
        text.toLowerCase().includes(page.expectedKeyword.toLowerCase()),
        `Page ${page.path} response must contain "${page.expectedKeyword}"`
      )
    }
  })
})
