#!/usr/bin/env node
// Cache-bust index.html's stylesheet and module script with the current git short sha (?v=...).
// Run before deploy: node tools/stamp.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const sha = process.argv[2] || execSync('git rev-parse --short HEAD').toString().trim();
const path = new URL('../index.html', import.meta.url).pathname;
let html = readFileSync(path, 'utf8');
html = html.replace(/(href="css\/game\.css)(\?v=[^"]*)?"/, `$1?v=${sha}"`).replace(/(src="js\/game\.js)(\?v=[^"]*)?"/, `$1?v=${sha}"`);
writeFileSync(path, html);
console.log(`stamped ${sha}`);
