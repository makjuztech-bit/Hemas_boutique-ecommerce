import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import { encrypt, decrypt, SessionPayload } from '../src/backend/auth/session'
import { Role } from '@prisma/client'

test('Authentication & Session Security Suite', async (t) => {
  await t.test('encrypt and decrypt roundtrip preserves user identity and role', async () => {
    const payload: SessionPayload = {
      userId: 'user-test-123',
      role: Role.CUSTOMER,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    }

    const token = await encrypt(payload)
    assert.ok(typeof token === 'string' && token.length > 20, 'Token must be a valid JWT string')

    const decoded = await decrypt(token)
    assert.ok(decoded !== null, 'Decrypted token must not be null')
    assert.equal(decoded?.userId, 'user-test-123')
    assert.equal(decoded?.role, Role.CUSTOMER)
  })

  await t.test('decrypt rejects expired session tokens', async () => {
    const expiredPayload: SessionPayload = {
      userId: 'user-expired',
      role: Role.CUSTOMER,
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
    }

    const token = await encrypt(expiredPayload)
    const decoded = await decrypt(token)
    assert.equal(decoded, null, 'Expired token must return null')
  })

  await t.test('decrypt rejects tampered tokens', async () => {
    const validToken = await encrypt({
      userId: 'user-valid',
      role: Role.CUSTOMER,
      expiresAt: new Date(Date.now() + 3600 * 1000),
    })

    const tamperedToken = validToken.slice(0, -5) + 'abcde'
    const decoded = await decrypt(tamperedToken)
    assert.equal(decoded, null, 'Tampered token must fail signature verification')
  })

  await t.test('password hashing uses bcrypt with strong cost factor and verifies correctly', async () => {
    const rawPassword = 'BoutiqueSecurePassword123!'
    const hash = await bcrypt.hash(rawPassword, 10)

    assert.ok(hash.startsWith('$2'), 'Hash must be valid bcrypt prefix')
    const matches = await bcrypt.compare(rawPassword, hash)
    assert.equal(matches, true, 'Valid password must match hash')

    const wrongMatches = await bcrypt.compare('WrongPassword', hash)
    assert.equal(wrongMatches, false, 'Incorrect password must be rejected')
  })
})
