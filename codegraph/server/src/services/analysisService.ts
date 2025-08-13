import path from 'node:path';
import fs from 'node:fs';
import { Project, SyntaxKind, Node, SourceFile, ScriptTarget, ModuleKind, ModuleResolutionKind } from 'ts-morph';
import {
  AstNodeLite,
  Graph,
  GraphEdge,
  GraphNode,
  LanguageBreakdown,
} from '../types/index.js';

function createProject(repoPath: string): Project {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      target: ScriptTarget.ES2022,
      module: ModuleKind.NodeNext,
      moduleResolution: ModuleResolutionKind.NodeNext,
      esModuleInterop: true,
      skipLibCheck: true,
      resolveJsonModule: true,
    },
  });
  const patterns = [
    path.join(repoPath, '**/*.ts'),
    path.join(repoPath, '**/*.tsx'),
    path.join(repoPath, '**/*.js'),
    path.join(repoPath, '**/*.jsx'),
  ];
  const files = project.addSourceFilesAtPaths(patterns);
  // Filter out node_modules and dist files
  for (const f of files) {
    if (f.getFilePath().includes('node_modules') || f.getFilePath().includes('/dist/')) {
      project.removeSourceFile(f);
    }
  }
  return project;
}

function toAstLite(node: Node, depth: number, maxNodes: { n: number }): AstNodeLite {
  if (maxNodes.n <= 0) return { kind: node.getKindName(), start: node.getPos(), end: node.getEnd() };
  const text = node.getText();
  const lite: AstNodeLite = {
    kind: node.getKindName(),
    text: text.length > 160 ? text.slice(0, 160) + '…' : text,
    start: node.getPos(),
    end: node.getEnd(),
  };
  maxNodes.n--;
  if (depth > 0) {
    lite.children = [];
    for (const child of node.getChildren()) {
      if (maxNodes.n <= 0) break;
      lite.children.push(toAstLite(child, depth - 1, maxNodes));
    }
  }
  return lite;
}

export function getAst(repoPath: string, relativeFilePath: string, maxDepth = 3, maxNodes = 1000): AstNodeLite {
  const project = createProject(repoPath);
  const abs = path.resolve(repoPath, relativeFilePath);
  const sf = project.getSourceFile(abs);
  if (!sf) throw new Error('File not found in project');
  return toAstLite(sf, maxDepth, { n: maxNodes });
}

export function getImportGraph(repoPath: string): Graph {
  const project = createProject(repoPath);
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const sf of project.getSourceFiles()) {
    const from = path.relative(repoPath, sf.getFilePath());
    const fromId = from;
    if (!nodesMap.has(fromId)) nodesMap.set(fromId, { id: fromId, label: path.basename(from) });

    for (const imp of sf.getImportDeclarations()) {
      const spec = imp.getModuleSpecifierValue();
      let targetPath = spec;
      if (spec.startsWith('.') || spec.startsWith('/')) {
        const resolved = imp.getModuleSpecifierSourceFile();
        if (resolved) targetPath = path.relative(repoPath, resolved.getFilePath());
      }
      const toId = targetPath;
      if (!nodesMap.has(toId)) nodesMap.set(toId, { id: toId, label: path.basename(targetPath) });
      edges.push({ source: fromId, target: toId, weight: 1 });
    }
  }
  return { nodes: Array.from(nodesMap.values()), edges };
}

export function getFunctionCallGraph(repoPath: string): Graph {
  const project = createProject(repoPath);
  const checker = project.getTypeChecker();
  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  function nodeIdForDecl(sf: SourceFile, name: string, pos: number) {
    const rel = path.relative(repoPath, sf.getFilePath());
    return `${rel}#${name}@${pos}`;
  }

  // Index function-like declarations
  const declMap = new Map<any, string>();
  for (const sf of project.getSourceFiles()) {
    sf.forEachDescendant((n) => {
      if (
        n.getKind() === SyntaxKind.FunctionDeclaration ||
        n.getKind() === SyntaxKind.MethodDeclaration ||
        n.getKind() === SyntaxKind.ArrowFunction ||
        n.getKind() === SyntaxKind.FunctionExpression
      ) {
        const symbol = (n as any).getSymbol?.();
        const name = (n as any).getName?.() || symbol?.getName?.() || '<anonymous>';
        if (symbol && name) {
          const id = nodeIdForDecl(sf, name, n.getPos());
          nodesMap.set(id, { id, label: name, filePath: path.relative(repoPath, sf.getFilePath()) });
          declMap.set(symbol, id);
        }
      }
    });
  }

  // Find call expressions and link to declarations if resolvable
  for (const sf of project.getSourceFiles()) {
    sf.forEachDescendant((n) => {
      if (n.getKind() === SyntaxKind.CallExpression) {
        const expr: any = (n as any).getExpression?.();
        const symbol = expr?.getSymbol?.() || checker.getAliasedSymbol(expr?.getSymbol?.()!);
        if (symbol) {
          const decls = symbol.getDeclarations();
          if (decls && decls.length > 0) {
            const targetDecl = decls[0].getFirstAncestorByKind(SyntaxKind.SourceFile) ? decls[0] : decls[0];
            const targetSf = targetDecl.getSourceFile();
            const targetName = (targetDecl as any).getName?.() || symbol.getName();
            const targetId = nodeIdForDecl(targetSf, targetName, targetDecl.getPos());
            if (!nodesMap.has(targetId)) {
              nodesMap.set(targetId, {
                id: targetId,
                label: targetName,
                filePath: path.relative(repoPath, targetSf.getFilePath()),
              });
            }
            const fromName = '<callsite>';
            const fromId = `${path.relative(repoPath, sf.getFilePath())}#${fromName}@${n.getPos()}`;
            if (!nodesMap.has(fromId)) nodesMap.set(fromId, { id: fromId, label: fromName, filePath: path.relative(repoPath, sf.getFilePath()) });
            edges.push({ source: fromId, target: targetId, weight: 1 });
          }
        }
      }
    });
  }

  return { nodes: Array.from(nodesMap.values()), edges };
}

export function getLanguageBreakdown(repoPath: string): LanguageBreakdown {
  const extToLang: Record<string, string> = {
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.py': 'Python',
    '.go': 'Go',
    '.java': 'Java',
    '.rb': 'Ruby',
    '.rs': 'Rust',
    '.cs': 'C#',
    '.php': 'PHP',
    '.cpp': 'C++',
    '.c': 'C',
    '.m': 'Objective-C',
    '.kt': 'Kotlin',
    '.swift': 'Swift',
  };

  const byBytes: Record<string, number> = {};
  const byFiles: Record<string, number> = {};

  function walk(dir: string) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules' || e.name.startsWith('.next')) continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        const lang = extToLang[ext];
        if (!lang) continue;
        const size = fs.statSync(abs).size;
        byBytes[lang] = (byBytes[lang] || 0) + size;
        byFiles[lang] = (byFiles[lang] || 0) + 1;
      }
    }
  }
  walk(repoPath);

  const topLibraries: { language: string; libraries: string[] }[] = [];
  const pkgJson = path.join(repoPath, 'package.json');
  if (fs.existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
      const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
      topLibraries.push({ language: 'JavaScript/TypeScript', libraries: deps.slice(0, 15) });
    } catch {}
  }
  const reqTxt = path.join(repoPath, 'requirements.txt');
  if (fs.existsSync(reqTxt)) {
    const libs = fs
      .readFileSync(reqTxt, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 15);
    topLibraries.push({ language: 'Python', libraries: libs });
  }

  return { byBytes, byFiles, topLibraries };
}

export function getCouplingMap(repoPath: string): Graph {
  const importGraph = getImportGraph(repoPath);
  const callGraph = getFunctionCallGraph(repoPath);

  const weights = new Map<string, number>();
  function bump(a: string, b: string, w: number) {
    const key = `${a}=>${b}`;
    weights.set(key, (weights.get(key) || 0) + w);
  }

  // Use import edges (file -> file/module)
  for (const e of importGraph.edges) {
    const [fromFile] = e.source.split('#');
    const [toFile] = e.target.split('#');
    bump(fromFile, toFile, e.weight || 1);
  }

  // Use call edges aggregated to file level
  for (const e of callGraph.edges) {
    const [fromFile] = e.source.split('#');
    const [toFile] = e.target.split('#');
    bump(fromFile, toFile, e.weight || 1);
  }

  const nodesMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  for (const key of weights.keys()) {
    const [a, b] = key.split('=>');
    if (!nodesMap.has(a)) nodesMap.set(a, { id: a, label: path.basename(a), filePath: a });
    if (!nodesMap.has(b)) nodesMap.set(b, { id: b, label: path.basename(b), filePath: b });
    edges.push({ source: a, target: b, weight: weights.get(key) });
  }

  return { nodes: Array.from(nodesMap.values()), edges };
}