// src/components/TreeViewer.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

function TreeViewer() {
  const { id } = useParams();
  const [ast, setAst] = useState(null);

  useEffect(() => {
    const storedAst = localStorage.getItem("latestAST");
    if (storedAst) {
      setAst(JSON.parse(storedAst));
    }
  }, []);

  if (!ast) {
    return (
      <div className="text-white p-6 min-h-screen bg-zinc-950">
        <Link to={`/repo/${id}`} className="text-indigo-400 underline">← Back</Link>
        <p className="mt-4">No AST found. Please analyze the repository first.</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950 text-white min-h-screen px-8 py-6">
      <Link to={`/repo/${id}`} className="text-indigo-400 underline mb-4 block">← Back to Repo</Link>
      <h1 className="text-2xl font-bold mb-4">AST Viewer 🌳</h1>
      <pre className="bg-zinc-800 p-4 rounded text-sm overflow-auto max-h-[80vh] whitespace-pre-wrap">
        {JSON.stringify(ast, null, 2)}
      </pre>
    </div>
  );
}

export default TreeViewer;
