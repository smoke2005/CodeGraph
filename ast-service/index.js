const express = require('express');
const Parser = require('tree-sitter');
const JavaScript = require('tree-sitter-javascript');
const Python = require('tree-sitter-python');
const Java = require('tree-sitter-java');

const app = express();
app.use(express.json());

const LANGUAGES = {
  javascript: JavaScript,
  python: Python,
  java: Java
};

app.post('/parse', (req, res) => {
  const { code, language } = req.body;

  if (!LANGUAGES[language]) {
    return res.status(400).json({ error: 'Unsupported language' });
  }

  const parser = new Parser();
  parser.setLanguage(LANGUAGES[language]);

  const tree = parser.parse(code);
  const rootNode = tree.rootNode;

  function nodeToJson(node) {
    return {
      type: node.type,
      startPosition: node.startPosition,
      endPosition: node.endPosition,
      children: node.namedChildren.map(nodeToJson)
    };
  }

  res.json(nodeToJson(rootNode));
});

app.listen(3000, () => {
  console.log('Tree-sitter AST API running at http://localhost:3000');
});
