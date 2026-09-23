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

export function syncVersion(explicitVersion) {
  const pkgPath = path.join(projectRoot, 'package.json');
  const cargoPath = path.join(projectRoot, 'src-tauri', 'Cargo.toml');
  const updateCheckerPath = path.join(projectRoot, 'src', 'services', 'update', 'updateChecker.ts');

  if (!fs.existsSync(pkgPath)) {
    console.error('❌ [sync-version] package.json not found at:', pkgPath);
    return false;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // If a new version was explicitly provided, update package.json first
  if (explicitVersion) {
    const cleanVersion = explicitVersion.trim().replace(/^v/, '');
    if (cleanVersion) {
      pkg.version = cleanVersion;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
      console.log(`[Version Sync] Updated package.json version to v${cleanVersion}`);
    }
  }

  const version = pkg.version;

  if (!version) {
    console.error('❌ [sync-version] No version field found in package.json');
    return false;
  }

  // 1. Sync src-tauri/Cargo.toml
  if (fs.existsSync(cargoPath)) {
    const cargoContent = fs.readFileSync(cargoPath, 'utf8');
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

  // 2. Sync in src/services/update/updateChecker.ts
  if (fs.existsSync(updateCheckerPath)) {
    const checkerContent = fs.readFileSync(updateCheckerPath, 'utf8');
    const updatedChecker = checkerContent.replace(
      /^export const CURRENT_VERSION = .*;$/m,
      `export const CURRENT_VERSION = '${version}';`
    );
    if (checkerContent !== updatedChecker) {
      fs.writeFileSync(updateCheckerPath, updatedChecker, 'utf8');
      console.log(`[Version Sync] Synced updateChecker.ts version to v${version}`);
    }
  }

  return true;
}

// If executed directly from command line
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const targetVersion = process.argv[2];
  syncVersion(targetVersion);
}
