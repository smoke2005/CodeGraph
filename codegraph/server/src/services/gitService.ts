import path from 'node:path';
import fs from 'node:fs';
import { simpleGit } from 'simple-git';
import { RepoConnectionRequest, RepoInfo } from '../types/index.js';
import {
  parseGitHubUrl,
  getRepoPath,
  getRepoId,
  normalizeHttpsUrl,
} from '../utils/path.js';

function buildAuthUrl(urlOrSlug: string, token?: string) {
  if (!token) return normalizeHttpsUrl(urlOrSlug);
  const https = normalizeHttpsUrl(urlOrSlug);
  return https.replace(/^https:\/\//, `https://${token}@`);
}

export async function cloneRepo(req: RepoConnectionRequest): Promise<RepoInfo> {
  const { owner, name } = parseGitHubUrl(req.url);
  const repoPath = getRepoPath(owner, name);
  if (!fs.existsSync(repoPath)) {
    fs.mkdirSync(repoPath, { recursive: true });
  }
  const git = simpleGit();
  if (!fs.existsSync(path.join(repoPath, '.git'))) {
    const url = buildAuthUrl(req.url, req.token || process.env.GITHUB_TOKEN);
    const options = [] as string[];
    if (req.shallow) options.push('--depth', '1');
    await git.clone(url, repoPath, options);
  }
  const info = await getRepoInfo(repoPath);
  return { id: getRepoId(owner, name), path: repoPath, ...info };
}

export async function pullRepo(owner: string, name: string): Promise<RepoInfo> {
  const repoPath = getRepoPath(owner, name);
  const git = simpleGit(repoPath);
  await git.fetch();
  await git.pull();
  const info = await getRepoInfo(repoPath);
  return { id: getRepoId(owner, name), path: repoPath, ...info };
}

export async function getRepoInfo(repoPath: string): Promise<Partial<RepoInfo>> {
  const git = simpleGit(repoPath);
  const status = await git.status();
  const log = await git.log({ maxCount: 1 });
  return {
    currentBranch: status.current || undefined,
    latestCommit: log.latest?.hash,
  };
}

export async function listBranches(owner: string, name: string) {
  const repoPath = getRepoPath(owner, name);
  const git = simpleGit(repoPath);
  const branches = await git.branchLocal();
  return Object.keys(branches.branches);
}

export async function listCommits(
  owner: string,
  name: string,
  branch?: string,
  maxCount: number = 50
) {
  const repoPath = getRepoPath(owner, name);
  const git = simpleGit(repoPath);
  const args = branch ? [branch] : undefined;
  const log = await git.log({ maxCount }, args as any);
  return log.all.map((c: any) => ({
    hash: c.hash,
    date: c.date,
    message: c.message,
    author_name: c.author_name,
    author_email: c.author_email,
  }));
}