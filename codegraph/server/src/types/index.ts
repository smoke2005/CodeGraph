export type RepoIdentifier = {
  owner: string;
  name: string;
  branch?: string;
};

export type RepoConnectionRequest = {
  url: string; // github repo url or "owner/name"
  branch?: string;
  token?: string;
  shallow?: boolean;
};

export type RepoInfo = {
  id: string; // owner__name
  path: string; // absolute
  defaultBranch?: string;
  currentBranch?: string;
  latestCommit?: string;
};

export type FileTreeEntry = {
  name: string;
  path: string; // relative to repo root
  type: 'file' | 'dir';
  size?: number;
  language?: string;
};

export type GraphEdge = { source: string; target: string; weight?: number };
export type GraphNode = { id: string; label?: string; filePath?: string };
export type Graph = { nodes: GraphNode[]; edges: GraphEdge[] };

export type AstNodeLite = {
  kind: string;
  text?: string;
  start: number;
  end: number;
  children?: AstNodeLite[];
};

export type LanguageBreakdown = {
  byBytes: Record<string, number>;
  byFiles: Record<string, number>;
  topLibraries: { language: string; libraries: string[] }[];
};