#!/usr/bin/env node
// Seed script that works in both dev and production
// In production: uses compiled prisma/seed.js
// In development: uses ts-node to run prisma/seed.ts

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const compiledSeedPath = path.join(__dirname, '../prisma/seed.js');
const tsSeedPath = path.join(__dirname, '../prisma/seed.ts');

if (fs.existsSync(compiledSeedPath)) {
  // Use compiled version (production)
  require(compiledSeedPath);
} else if (fs.existsSync(tsSeedPath)) {
  // Use ts-node (development)
  try {
    execSync('ts-node --require tsconfig-paths/register prisma/seed.ts', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });
  } catch (error) {
    console.error('Failed to run seed script:', error.message);
    process.exit(1);
  }
} else {
  console.error('Seed file not found!');
  process.exit(1);
}
