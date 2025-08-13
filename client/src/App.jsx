import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import TreeViewer from "./TreeViewer";
import "./styles.css"; // Starry/gradient styling

function App() {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [ast, setAst] = useState(null);
  const [analyzing, setAnalyzing] = useState(false); // new
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: session } = await supabase.auth.getSession();
      const access_token = session?.session?.provider_token;

      if (user && access_token) {
        setUser(user);
        const res = await fetch("http://localhost:8080/api/github/repos", {
          headers: { Authorization: `token ${access_token}` }
        });
        const repos = await res.json();
        setRepos(repos);
      }

      setLoading(false);
    };

    getData();
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(search.toLowerCase())
  );

  const fetchRepoDetails = async (repo) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.provider_token;

    const [contentRes, statsRes] = await Promise.all([
      fetch(`http://localhost:8080/api/github/repo-content?owner=${repo.owner.login}&repo=${repo.name}`, {
        headers: { Authorization: `token ${token}` }
      }),
      fetch(`http://localhost:8080/api/github/repo-stats?owner=${repo.owner.login}&repo=${repo.name}`, {
        headers: { Authorization: `token ${token}` }
      })
    ]);

    const contents = await contentRes.json();
    const stats = await statsRes.json();

    const targetFile = contents.find(file => file.name.endsWith(".js"));
    let parsedAst = null;

    if (targetFile) {
      const rawCode = atob(targetFile.content);
      const astRes = await fetch("http://localhost:8080/api/ast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: rawCode, language: "javascript" })
      });
      parsedAst = await astRes.json();
    }

    setAst(parsedAst);
    setSelectedRepo({ ...repo, contents, stats });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-indigo-900 to-purple-900 text-white">
        <motion.div className="text-center space-y-4">
          <div className="loader mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-indigo-300">Analyzing CodeGraph...</h1>
          <p className="text-gray-400">Loading your repositories with precision 🛠️</p>
        </motion.div>
      </div>
    );
  }

  if (analyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] via-[#1e1b4b] to-[#17082d] text-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-xl space-y-6"
        >
          <div className="loader mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-indigo-300">Preparing Repo Analysis...</h1>
          <p className="text-md text-gray-400">Parsing codebase & generating AST 🌐</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e0e2c] via-[#1e1b4b] to-[#17082d] text-white flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-xl space-y-6">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Meet <span className="bg-gradient-to-r from-pink-400 to-violet-500 text-transparent bg-clip-text">CodeGraph</span>, your{" "}
            <span className="text-indigo-400">AI coding assistant</span>
          </h1>
          <p className="text-md text-gray-400">
            Visualize, understand, and interact with your codebase like never before. GitHub-powered insights, AST visualizations and more.
          </p>
          <button onClick={login} className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-6 py-3 rounded-md">
            Sign in with GitHub
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-br from-black via-indigo-950 to-purple-900 text-white">
      <header className="flex items-center gap-4 mb-10">
        <img src={user.user_metadata.avatar_url} alt="avatar" className="w-12 h-12 rounded-full" />
        <div>
          <h2 className="text-2xl font-semibold">Hi, {user.user_metadata.user_name} 👋</h2>
          <p className="text-sm text-gray-400">Pick a repository to analyze:</p>
        </div>
      </header>

      <div className="mb-6 max-w-md">
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 bg-zinc-800 text-white rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <AnimatePresence initial={false}>
          {filteredRepos.map((repo) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => fetchRepoDetails(repo)}
              className="bg-zinc-800 border border-indigo-700 rounded-xl p-5 shadow hover:shadow-indigo-500/50 transition cursor-pointer"
            >
              <h3 className="text-lg font-bold">{repo.name}</h3>
              <p className="text-sm text-gray-400 h-12 overflow-hidden">{repo.description || "No description provided."}</p>
              <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                <span>⭐ {repo.stargazers_count}</span>
                <span>🔁 {repo.forks_count}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedRepo && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setSelectedRepo(null); setAst(null); }}
          >
            <motion.div
              className="bg-zinc-900 text-white max-w-2xl w-full mx-4 rounded-xl shadow-xl p-8 border border-zinc-800"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-2">{selectedRepo.name}</h2>
              <p className="text-sm text-zinc-400 mb-5">{selectedRepo.description || "No description provided."}</p>

              <ul className="text-sm space-y-2 mb-6 text-zinc-300">
                <li><span className="text-zinc-400 font-medium">Stars:</span> {selectedRepo.stargazers_count}</li>
                <li><span className="text-zinc-400 font-medium">Forks:</span> {selectedRepo.forks_count}</li>
                <li><span className="text-zinc-400 font-medium">Visibility:</span> {selectedRepo.private ? "Private" : "Public"}</li>
                <li><span className="text-zinc-400 font-medium">Last Updated:</span> {new Date(selectedRepo.updated_at).toLocaleString()}</li>
              </ul>

              {selectedRepo.stats?.branches?.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-zinc-200 mb-2">Branches</h4>
                  <ul className="text-sm text-zinc-400 mb-6 pl-2 list-disc list-inside">
                    {selectedRepo.stats.branches.map((b, i) => (
                      <li key={i}>{b.name}</li>
                    ))}
                  </ul>
                </>
              )}

              {selectedRepo.stats?.commits?.length > 0 && (
                <>
                  <h4 className="text-sm font-semibold text-zinc-200 mb-2">Recent Commits</h4>
                  <ul className="text-sm text-zinc-300 h-24 overflow-y-auto bg-zinc-800 p-3 rounded-md border border-zinc-700 mb-6">
                    {selectedRepo.stats.commits.slice(0, 5).map((commit, i) => (
                      <li key={i} className="mb-1 truncate">• {commit.commit.message}</li>
                    ))}
                  </ul>
                </>
              )}

              <button
                onClick={() => {
                  setAnalyzing(true);
                  localStorage.setItem("latestRepo", JSON.stringify(selectedRepo));
                  
                  if (ast) localStorage.setItem("latestAST", JSON.stringify(ast));
                  setTimeout(() => {
                    navigate(`/repo/${selectedRepo.id}`);
                  }, 1000);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 transition duration-200 text-white font-medium py-2 rounded-md mb-3 shadow"
              >
                Analyze this Repository →
              </button>

              <button
                onClick={() => { setSelectedRepo(null); setAst(null); }}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium py-2 rounded-md transition"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
