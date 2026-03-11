import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateComment, validateSite } from './validators.js'

test('validateComment - valid comment', () => {
  const result = validateComment({ content: 'Hello world', author_name: 'Alice' })
  assert.equal(result.valid, true)
  assert.deepEqual(result.errors, [])
})

test('validateComment - missing content', () => {
  const result = validateComment({ author_name: 'Alice' })
  assert.equal(result.valid, false)
  assert.ok(result.errors.length > 0)
})

test('validateComment - empty content', () => {
  const result = validateComment({ content: '   ', author_name: 'Alice' })
  assert.equal(result.valid, false)
})

test('validateComment - missing author_name', () => {
  const result = validateComment({ content: 'Hello' })
  assert.equal(result.valid, false)
})

test('validateComment - invalid email', () => {
  const result = validateComment({ content: 'Hello', author_name: 'Alice', author_email: 'notanemail' })
  assert.equal(result.valid, false)
})

test('validateComment - valid email is optional', () => {
  const result = validateComment({ content: 'Hello', author_name: 'Alice', author_email: 'alice@example.com' })
  assert.equal(result.valid, true)
})

test('validateSite - valid domain', () => {
  const result = validateSite({ domain: 'example.com' })
  assert.equal(result.valid, true)
})

test('validateSite - missing domain', () => {
  const result = validateSite({})
  assert.equal(result.valid, false)
})

test('validateSite - invalid domain', () => {
  const result = validateSite({ domain: 'not a domain!!!' })
  assert.equal(result.valid, false)
})
