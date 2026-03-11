import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPostgresAdapter } from './index.js'

test('createPostgresAdapter - is a function', () => {
  assert.equal(typeof createPostgresAdapter, 'function')
})
