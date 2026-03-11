import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderMarkdown, sanitizeContent } from './content.js'

test('renderMarkdown - renders bold text', () => {
  const html = renderMarkdown('**hello**')
  assert.ok(html.includes('<strong>hello</strong>'))
})

test('renderMarkdown - renders emphasis', () => {
  const html = renderMarkdown('_world_')
  assert.ok(html.includes('<em>world</em>'))
})

test('renderMarkdown - strips script tags', () => {
  const html = renderMarkdown('<script>alert("xss")</script>')
  assert.ok(!html.includes('<script>'))
})

test('renderMarkdown - allows safe links', () => {
  const html = renderMarkdown('[click](https://example.com)')
  assert.ok(html.includes('<a'))
  assert.ok(html.includes('href'))
})

test('sanitizeContent - strips all HTML tags', () => {
  const result = sanitizeContent('<b>hello</b>')
  assert.ok(!result.includes('<b>'))
  assert.ok(result.includes('hello'))
})

test('sanitizeContent - strips script tags', () => {
  const result = sanitizeContent('<script>evil()</script>')
  assert.ok(!result.includes('<script>'))
})
