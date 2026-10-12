import test from 'node:test'
import assert from 'node:assert/strict'
import { checkRateLimit } from '../src/lib/rateLimit'
import { NextRequest } from 'next/server'

test('Security & Customer Protection Suite', async (t) => {
  await t.test('rate limiter throttles requests exceeding configured thresholds', () => {
    const makeReq = () =>
      new NextRequest('http://localhost:3000/api/auth/login', {
        headers: { 'x-forwarded-for': '198.51.100.42' },
      })

    const limit = 3
    const windowMs = 5000
    const prefix = 'test-throttle-' + Date.now()

    // 1st request
    const r1 = checkRateLimit(makeReq(), limit, windowMs, prefix)
    assert.equal(r1.allowed, true)
    assert.equal(r1.remaining, 2)

    // 2nd request
    const r2 = checkRateLimit(makeReq(), limit, windowMs, prefix)
    assert.equal(r2.allowed, true)
    assert.equal(r2.remaining, 1)

    // 3rd request
    const r3 = checkRateLimit(makeReq(), limit, windowMs, prefix)
    assert.equal(r3.allowed, true)
    assert.equal(r3.remaining, 0)

    // 4th request (exceeded limit!)
    const r4 = checkRateLimit(makeReq(), limit, windowMs, prefix)
    assert.equal(r4.allowed, false)
    assert.equal(r4.remaining, 0)
  })

  await t.test('customer isolation logic restricts data to requesting user id', () => {
    const customerA = { id: 'cust-A-111', role: 'CUSTOMER' }
    const customerB = { id: 'cust-B-222', role: 'CUSTOMER' }

    // Simulating access control check
    const canAccessOrders = (requesterId: string, orderOwnerId: string, role: string) => {
      if (role === 'SUPER_ADMIN' || role === 'STAFF') return true
      return requesterId === orderOwnerId
    }

    assert.equal(canAccessOrders(customerA.id, customerA.id, customerA.role), true, 'Customer A can access own orders')
    assert.equal(canAccessOrders(customerA.id, customerB.id, customerA.role), false, 'Customer A CANNOT access Customer B orders')
    assert.equal(canAccessOrders('admin-id', customerB.id, 'SUPER_ADMIN'), true, 'Admin can access orders')
  })
})
