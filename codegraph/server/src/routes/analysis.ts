import { Router } from 'express';
import { getRepoPath, parseGitHubUrl } from '../utils/path.js';
import { getAst, getImportGraph, getFunctionCallGraph, getLanguageBreakdown, getCouplingMap } from '../services/analysisService.js';

export const analysisRouter = Router();

function parseRepoParam(repoParam?: string) {
  if (!repoParam) throw new Error('Missing repo param');
  const { owner, name } = parseGitHubUrl(repoParam);
  return { owner, name };
}

analysisRouter.get('/ast', (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const file = String(req.query.path || '');
    const maxDepth = req.query.maxDepth ? Number(req.query.maxDepth) : 3;
    const maxNodes = req.query.maxNodes ? Number(req.query.maxNodes) : 1000;
    const repoPath = getRepoPath(owner, name);
    const ast = getAst(repoPath, file, maxDepth, maxNodes);
    res.json(ast);
  } catch (err: any) {
    res.status(500).json({ error: 'AST failed', detail: err?.message || String(err) });
  }
});

analysisRouter.get('/imports', (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const repoPath = getRepoPath(owner, name);
    const g = getImportGraph(repoPath);
    res.json(g);
  } catch (err: any) {
    res.status(500).json({ error: 'Import graph failed', detail: err?.message || String(err) });
  }
});

analysisRouter.get('/calls', (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const repoPath = getRepoPath(owner, name);
    const g = getFunctionCallGraph(repoPath);
    res.json(g);
  } catch (err: any) {
    res.status(500).json({ error: 'Call graph failed', detail: err?.message || String(err) });
  }
});

analysisRouter.get('/languages', (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const repoPath = getRepoPath(owner, name);
    const breakdown = getLanguageBreakdown(repoPath);
    res.json(breakdown);
  } catch (err: any) {
    res.status(500).json({ error: 'Languages failed', detail: err?.message || String(err) });
  }
});

analysisRouter.get('/coupling', (req, res) => {
  try {
    const { owner, name } = parseRepoParam(String(req.query.repo || ''));
    const repoPath = getRepoPath(owner, name);
    const g = getCouplingMap(repoPath);
    res.json(g);
  } catch (err: any) {
    res.status(500).json({ error: 'Coupling failed', detail: err?.message || String(err) });
  }
});