import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const tabs = await readFile(new URL('../public/js/02-tabs.js', import.meta.url), 'utf8');
const navigation = await readFile(new URL('../public/js/13-command-strip-navigation.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('../src/styles/app.css', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

test('VS day checklist renders native buttons, not checkbox inputs', () => {
  const start = tabs.indexOf('function highlightVsDay()');
  const end = tabs.indexOf('/** Push roster', start);
  assert.notEqual(start, -1, 'highlightVsDay() exists');
  assert.notEqual(end, -1, 'function boundary exists');
  const renderer = tabs.slice(start, end);
  assert.match(renderer, /<button type="button" class="cmd-chip/);
  assert.doesNotMatch(renderer, /<input[^>]*type=["']checkbox/i);
});

test('daily command strip renders native buttons, not checkbox inputs', () => {
  const start = navigation.indexOf('function updateCommandStrip()');
  const end = navigation.indexOf('function toggleCmdButton(', start);
  assert.notEqual(start, -1, 'updateCommandStrip() exists');
  assert.notEqual(end, -1, 'toggle handler boundary exists');
  const renderer = navigation.slice(start, end);
  assert.match(renderer, /<button type="button" class="cmd-chip/);
  assert.doesNotMatch(renderer, /<input[^>]*type=["']checkbox/i);
});

test('command buttons persist state and expose accessible pressed state', () => {
  assert.match(navigation, /localStorage\.setItem\('zr_cmd_done'/);
  assert.match(navigation, /setAttribute\('aria-pressed'/);
  assert.match(navigation, /function toggleCmdButton\(button\)/);
});

test('command buttons retain a mobile-friendly 44px minimum touch target', () => {
  assert.match(styles, /\.cmd-chip\s*\{[^}]*min-height:\s*44px/s);
});


test('checklist renderer scripts use versioned URLs to bypass stale browser caches', () => {
  assert.match(index, /<script defer src="\\/js\\/02-tabs\\.js\\?v=\\d{8}-\\d+"><\\/script>/);
  assert.match(index, /<script defer src="\\/js\\/13-command-strip-navigation\\.js\\?v=\\d{8}-\\d+"><\\/script>/);
});
