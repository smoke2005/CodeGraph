import { useParams, Link } from "react-router-dom";

function ASTViewer() {
  const { id } = useParams();

  return (
    <div className="bg-zinc-950 text-white min-h-screen p-10">
      <Link to={`/repo/${id}`} className="text-indigo-400 underline">← Back to Repo</Link>
      <h1 className="text-3xl font-bold mt-4">🧬 AST Viewer</h1>
      <p className="text-gray-400 mt-2">Visualize the abstract syntax tree for files in this repo.</p>
      {/* We’ll render tree-sitter view here next */}
    </div>
  );
}

export default ASTViewer;
