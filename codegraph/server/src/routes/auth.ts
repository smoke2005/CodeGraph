import { Router } from 'express';
import { Octokit } from 'octokit';
import axios from 'axios';

export const authRouter = Router();

// Step 1: Redirect to GitHub OAuth
authRouter.get('/github', (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirect = process.env.GITHUB_OAUTH_REDIRECT_URL;
  const state = Math.random().toString(36).slice(2);
  const scope = ['repo', 'read:user'].join(' ');
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId || '');
  url.searchParams.set('redirect_uri', redirect || '');
  url.searchParams.set('scope', scope);
  url.searchParams.set('state', state);
  res.redirect(url.toString());
});

// Step 2: Exchange code for token (server-side)
authRouter.get('/github/callback', async (req, res) => {
  try {
    const code = String(req.query.code || '');
    const clientId = process.env.GITHUB_CLIENT_ID || '';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || '';

    if (!code || !clientId || !clientSecret) {
      return res.status(400).json({ error: 'Missing OAuth parameters' });
    }

    const tokenResp = await axios.post(
      'https://github.com/login/oauth/access_token',
      { client_id: clientId, client_secret: clientSecret, code },
      { headers: { Accept: 'application/json' } }
    );

    const token = tokenResp.data.access_token as string;
    if (!token) {
      return res.status(401).json({ error: 'No access token returned from GitHub' });
    }

    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();

    res.json({ token, user });
  } catch (err: any) {
    res.status(500).json({ error: 'OAuth failed', detail: err?.message || String(err) });
  }
});
