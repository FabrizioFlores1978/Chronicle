#!/usr/bin/env node

/**
 * Chronicle Version Synchronizer
 * 
 * Ensures src-tauri/Cargo.toml is always kept in lockstep with package.json.
 * This enables package.json to serve as the single source of truth for the entire application.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export function syncVersion() {
  const pkgPath = path.join(projectRoot, 'package.json');
  const cargoPath = path.join(projectRoot, 'src-tauri', 'Cargo.toml');

  if (!fs.existsSync(pkgPath)) {
    console.error('❌ [sync-version] package.json not found at:', pkgPath);
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const version = pkg.version;

  if (!version) {
    console.error('❌ [sync-version] No version field found in package.json');
    return false;
  }

  if (fs.existsSync(cargoPath)) {
    const cargoContent = fs.readFileSync(cargoPath, 'utf8');
    // Replace the package version inside [package]
    const updatedContent = cargoContent.replace(
      /^(\s*version\s*=\s*)"[^"]+"/m,
      `$1"${version}"`
    );

    if (cargoContent !== updatedContent) {
      fs.writeFileSync(cargoPath, updatedContent, 'utf8');
      console.log(`[Version Sync] Synced src-tauri/Cargo.toml version to v${version}`);
    } else {
      console.log(`[Version Sync] src-tauri/Cargo.toml is already at v${version}`);
    }
  }

  return true;
}

// If executed directly from command line
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  syncVersion();
}
