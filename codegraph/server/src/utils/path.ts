import path from 'node:path';
import fs from 'node:fs';
import { FileTreeEntry } from '../types/index.js';

export const REPOS_ROOT = '/workspace/codegraph/repos';

export function parseGitHubUrl(input: string): { owner: string; name: string } {
  const trimmed = input.trim();
  const ssh = /^git@github\.com:(?<owner>[^/]+)\/(?<name>[^\s]+?)(?:\.git)?$/;
  const https = /^https?:\/\/github\.com\/(?<owner>[^/]+)\/(?<name>[^\s]+?)(?:\.git)?(?:\/)?$/;
  const ownerRepo = /^(?<owner>[^/]+)\/(?<name>[^/]+)$/;

  const matchers = [ssh, https, ownerRepo];
  for (const rx of matchers) {
    const m = trimmed.match(rx);
    if (m?.groups) {
      const name = m.groups.name.replace(/\.git$/, '');
      return { owner: m.groups.owner, name };
    }
  }
  throw new Error('Unsupported repo URL or format');
}

export function getRepoId(owner: string, name: string): string {
  return `${owner}__${name}`;
}

export function getRepoPath(owner: string, name: string): string {
  const id = getRepoId(owner, name);
  return path.join(REPOS_ROOT, id);
}

export function ensureInsideRepo(repoPath: string, relative?: string): string {
  const repoRoot = path.resolve(repoPath);
  const target = relative ? path.resolve(repoPath, relative) : repoRoot;
  if (target !== repoRoot && !target.startsWith(repoRoot + path.sep)) {
    throw new Error('Path traversal detected');
  }
  return target;
}

export function listDirTree(
  repoPath: string,
  relativePath: string = ''
): FileTreeEntry[] {
  const root = ensureInsideRepo(repoPath, relativePath);
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const result: FileTreeEntry[] = [];
  for (const e of entries) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const abs = path.join(root, e.name);
    const rel = path.relative(repoPath, abs);
    if (e.isDirectory()) {
      result.push({ name: e.name, path: rel, type: 'dir' });
    } else if (e.isFile()) {
      const stat = fs.statSync(abs);
      result.push({ name: e.name, path: rel, type: 'file', size: stat.size });
    }
  }
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  return result;
}

export function readTextFile(repoPath: string, relativePath: string): string {
  const abs = ensureInsideRepo(repoPath, relativePath);
  return fs.readFileSync(abs, 'utf8');
}

export function normalizeHttpsUrl(input: string): string {
  if (input.startsWith('http')) return input;
  if (input.startsWith('git@github.com:')) {
    const rhs = input.replace('git@github.com:', '');
    return `https://github.com/${rhs}`;
  }
  if (/^[^/]+\/[^/]+$/.test(input)) {
    return `https://github.com/${input}.git`;
  }
  return input;
}