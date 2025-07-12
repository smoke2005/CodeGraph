import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

function RepoPage() {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [astAvailable, setAstAvailable] = useState(false);

  useEffect(() => {
    const fetchRepo = async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.provider_token;

      const res = await fetch("http://localhost:8080/api/github/repos", {
        headers: { Authorization: `token ${token}` },
      });
      const allRepos = await res.json();
      const found = allRepos.find((r) => r.id.toString() === id);
      setRepo(found);
    };

    const checkAST = () => {
      const ast = localStorage.getItem("latestAST");
      console.log("🧬 AST in localStorage:", ast);
      setAstAvailable(!!ast);
    };

    fetchRepo();
    checkAST();
    const timeout = setTimeout(checkAST, 500); // check again after 500ms in case of async storage

    return () => clearTimeout(timeout);
  }, [id]);

  if (!repo) return <div className="text-white p-6">Loading...</div>;

  return (
    <div className="bg-zinc-950 text-white px-10 py-6 min-h-screen">
      <Link to="/" className="text-indigo-400 underline">← Back</Link>

      <h1 className="text-3xl font-bold mt-4">{repo.name}</h1>
      <p className="text-gray-400">{repo.description}</p>

      <div className="mt-6 space-y-2">
        {astAvailable && (
          <Link
            to={`/repo/${repo.id}/ast`}
            className="block bg-zinc-800 p-3 rounded hover:bg-zinc-700"
          >
            🧬 View AST
          </Link>
        )}

        <Link
          to={`/repo/${repo.id}/call-graph`}
          className="block bg-zinc-800 p-3 rounded hover:bg-zinc-700"
        >
          🔗 Function Call Graph
        </Link>

        <Link
          to={`/repo/${repo.id}/deps`}
          className="block bg-zinc-800 p-3 rounded hover:bg-zinc-700"
        >
          📦 Dependency Graph
        </Link>
      </div>
    </div>
  );
}

export default RepoPage;
