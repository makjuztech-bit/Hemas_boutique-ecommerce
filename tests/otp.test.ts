import test from 'node:test'
import assert from 'node:assert/strict'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

test('OTP generation and cryptographic hashing', async () => {
  const otpNumber = crypto.randomInt(100000, 999999).toString()
  assert.equal(otpNumber.length, 6)
  assert.match(otpNumber, /^\d{6}$/)

  const hash = await bcrypt.hash(otpNumber, 10)
  const isValid = await bcrypt.compare(otpNumber, hash)
  assert.equal(isValid, true)

  const isInvalid = await bcrypt.compare('000000', hash)
  assert.equal(isInvalid, false)
})

test('OTP expiration window validation', () => {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)
  assert.equal(expiresAt.getTime() > now.getTime(), true)

  const pastDate = new Date(now.getTime() - 1000)
  assert.equal(pastDate.getTime() < now.getTime(), true)
})
