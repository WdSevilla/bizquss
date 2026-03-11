import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashIp, generateApiKey, getDailySalt } from './crypto.js'

test('hashIp - returns 64-char hex string', () => {
  const hash = hashIp('127.0.0.1', 'test-salt')
  assert.match(hash, /^[0-9a-f]{64}$/)
})

test('hashIp - same inputs produce same hash', () => {
  assert.equal(hashIp('127.0.0.1', 'salt'), hashIp('127.0.0.1', 'salt'))
})

test('hashIp - different IPs produce different hashes', () => {
  assert.notEqual(hashIp('1.2.3.4', 'salt'), hashIp('5.6.7.8', 'salt'))
})

test('hashIp - different salts produce different hashes', () => {
  assert.notEqual(hashIp('1.2.3.4', 'salt1'), hashIp('1.2.3.4', 'salt2'))
})

test('generateApiKey - returns 64-char hex string', () => {
  const key = generateApiKey()
  assert.match(key, /^[0-9a-f]{64}$/)
})

test('generateApiKey - returns unique keys', () => {
  assert.notEqual(generateApiKey(), generateApiKey())
})

test('getDailySalt - includes the base salt', () => {
  const salt = getDailySalt('mysecret')
  assert.ok(salt.startsWith('mysecret:'))
})

test('getDailySalt - includes today date', () => {
  const today = new Date().toISOString().slice(0, 10)
  const salt = getDailySalt('base')
  assert.ok(salt.includes(today))
})
