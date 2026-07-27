'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const javascript = fs.readFileSync(path.join(root, 'venue-icons.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'venue-icons.css'), 'utf8');

function requireText(source, text, message) {
  if (!source.includes(text)) throw new Error(message);
}

requireText(html, '<link rel="stylesheet" href="venue-icons.css">', 'Venue icon stylesheet is not loaded.');
requireText(html, '<script src="venue-icons.js"></script>', 'Venue icon script is not loaded.');

const fixtureDisplayIndex = html.indexOf('<script src="fixture-display.js"></script>');
const venueIconsIndex = html.indexOf('<script src="venue-icons.js"></script>');
if (!(fixtureDisplayIndex >= 0 && venueIconsIndex > fixtureDisplayIndex)) {
  throw new Error('Venue icons must load after fixture decoration.');
}

requireText(javascript, "querySelectorAll?.('.venue-badge')", 'Fixture venue badges are not decorated.');
requireText(javascript, "querySelectorAll?.('.overview-meta')", 'Overview venue labels are not decorated.');
requireText(javascript, "aria-label", 'Venue icons need accessible labels.');
requireText(javascript, "İç saha", 'Home accessibility label is missing.');
requireText(javascript, "Deplasman", 'Away accessibility label is missing.');
requireText(javascript, '<svg viewBox="0 0 24 24"', 'Inline SVG icons are missing.');

requireText(css, '.venue-icon', 'Venue icon styling is missing.');
requireText(css, 'color: #fff', 'Venue icons must be white.');
requireText(css, 'background: rgba(255, 255, 255, 0.055) !important', 'Legacy colored venue badge is not neutralized.');

console.log('Venue icon checks passed.');
