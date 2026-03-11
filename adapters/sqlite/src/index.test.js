import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSqliteAdapter } from './index.js'

test('createSqliteAdapter - returns query and close functions', () => {
  const db = createSqliteAdapter(':memory:')
  assert.equal(typeof db.query, 'function')
  assert.equal(typeof db.close, 'function')
  db.close()
})

test('createSqliteAdapter - can create table and query rows', async () => {
  const db = createSqliteAdapter(':memory:')
  await db.query('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)')
  await db.query('INSERT INTO test (name) VALUES (?)', ['Alice'])
  const rows = await db.query('SELECT * FROM test')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].name, 'Alice')
  db.close()
})

test('createSqliteAdapter - normalizes $1 params to ?', async () => {
  const db = createSqliteAdapter(':memory:')
  await db.query('CREATE TABLE items (id INTEGER PRIMARY KEY, val TEXT)')
  await db.query('INSERT INTO items (val) VALUES ($1)', ['test'])
  const rows = await db.query('SELECT * FROM items WHERE val = $1', ['test'])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].val, 'test')
  db.close()
})

test('createSqliteAdapter - INSERT returns inserted row', async () => {
  const db = createSqliteAdapter(':memory:')
  await db.query('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT)')
  const result = await db.query('INSERT INTO users (email) VALUES ($1)', ['test@example.com'])
  assert.equal(result.length, 1)
  assert.equal(result[0].email, 'test@example.com')
  db.close()
})
