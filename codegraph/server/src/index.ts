import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { authRouter } from './routes/auth.js';
import { repoRouter } from './routes/repo.js';
import { analysisRouter } from './routes/analysis.js';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'codegraph-server' });
});

app.use('/auth', authRouter);
app.use('/repo', repoRouter);
app.use('/analysis', analysisRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`CodeGraph server listening on http://localhost:${port}`);
});
