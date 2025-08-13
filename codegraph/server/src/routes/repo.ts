import { Router } from 'express';
import path from 'node:path';
import { cloneRepo, pullRepo, listBranches, listCommits } from '../services/gitService.js';
import { parseGitHubUrl, getRepoPath, ensureInsideRepo, listDirTree, readTextFile } from '../utils/path.js';

export const repoRouter = Router();

function parseRepoParam(repoParam?: string) {
  if (!repoParam) throw new Error('Missing repo param');
  // Accept forms: owner/name or URL
  const { owner, name } = parseGitHubUrl(repoParam);
  return { owner, name };
}

repoRouter.post('/connect', async (req, res) => {
  try {
    const info = await cloneRepo(req.body);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: 'Clone failed', detail: err?.message || String(err) });
  }
});

repoRouter.post('/pull', async (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.body.repo || req.body.url || ''));
    const info = await pullRepo(owner, name);
    res.json(info);
  } catch (err: any) {
    res.status(500).json({ error: 'Pull failed', detail: err?.message || String(err) });
  }
});

repoRouter.get('/tree', async (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const repoPath = getRepoPath(owner, name);
    const rel = String(req.query.path || '');
    const list = listDirTree(repoPath, rel);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'List tree failed', detail: err?.message || String(err) });
  }
});

repoRouter.get('/file', async (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const repoPath = getRepoPath(owner, name);
    const rel = String(req.query.path || '');
    const content = readTextFile(repoPath, rel);
    res.type('text/plain').send(content);
  } catch (err: any) {
    res.status(500).json({ error: 'Read file failed', detail: err?.message || String(err) });
  }
});

repoRouter.get('/branches', async (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const branches = await listBranches(owner, name);
    res.json({ branches });
  } catch (err: any) {
    res.status(500).json({ error: 'List branches failed', detail: err?.message || String(err) });
  }
});

repoRouter.get('/commits', async (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const branch = req.query.branch ? String(req.query.branch) : undefined;
    const commits = await listCommits(owner, name, branch);
    res.json({ commits });
  } catch (err: any) {
    res.status(500).json({ error: 'List commits failed', detail: err?.message || String(err) });
  }
});