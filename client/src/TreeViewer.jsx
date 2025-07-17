// src/components/TreeViewer.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ReactJson from "react-json-view";

function TreeViewer() {
  const { id } = useParams();
  const [asts, setAsts] = useState([]);
  const [filteredLang, setFilteredLang] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const repoId = localStorage.getItem('lastRepo');
    if (!repoId || repoId !== id) {
      console.warn('Mismatch between route ID and last analyzed repo');
      return;
    }
    
    const storedAst = localStorage.getItem('ast');
    if (storedAst) {
      try {
        const parsed = JSON.parse(storedAst);
        if (Array.isArray(parsed)) {
          setAsts(parsed);
        } else {
          setAsts([{ file: "unknown", language: "javascript", ast: parsed }]);
        }
      } catch (err) {
        console.error("Error parsing AST:", err);
        setAsts([]);
      }
    }
  }, [id]);

  const languages = Array.from(new Set(asts.map(item => item.language)));

  const filteredAsts = asts.filter(({ language, ast }) => {
    const matchesLang = filteredLang === "all" || language === filteredLang;
    const matchesSearch = searchQuery.trim() === "" || JSON.stringify(ast).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesSearch;
  });

  if (asts.length === 0) {
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
      <h1 className="text-2xl font-bold mb-6">AST Viewer 🌳</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-6">
        <select
          value={filteredLang}
          onChange={(e) => setFilteredLang(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-md"
        >
          <option value="all">All Languages</option>
          {languages.map((lang, idx) => (
            <option key={idx} value={lang}>{lang}</option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search inside AST..."
          className="bg-zinc-800 border border-zinc-700 text-white px-4 py-2 rounded-md w-64"
        />
      </div>

      {/* AST Display */}
      {filteredAsts.length === 0 ? (
        <p className="text-gray-400">No matching AST files found.</p>
      ) : (
        filteredAsts.map(({ file, language, ast }, index) => (
          <div key={index} className="mb-10">
            <h2 className="text-lg font-semibold mb-2">
              {file} <span className="text-sm text-gray-400">({language})</span>
            </h2>
            <div className="bg-zinc-800 p-4 rounded border border-zinc-700 overflow-x-auto">
              <ReactJson
                src={ast}
                theme="monokai"
                collapsed={2}
                enableClipboard={false}
                displayDataTypes={false}
                name={false}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default TreeViewer;
