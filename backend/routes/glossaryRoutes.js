// routes/glossaryRoutes.js
// Glossary endpoints for statistical term definitions (Darwin's work)

import express from "express";
import path from "path";
import fs from "fs/promises";

const router = express.Router();

// Path to glossary JSON file (provided by Darwin)
const GLOSSARY_PATH = path.join(process.cwd(), "glossary.json");

// Cache glossary in memory
let glossaryCache = null;

// Load glossary on startup
async function loadGlossary() {
  try {
    const data = await fs.readFile(GLOSSARY_PATH, "utf-8");
    glossaryCache = JSON.parse(data);
    console.log(`✅ Loaded ${Object.keys(glossaryCache).length} glossary terms`);
  } catch (error) {
    console.warn("⚠️  Glossary file not found, using empty glossary");
    glossaryCache = {};
  }
}

// Load glossary immediately
loadGlossary();

// GET /api/glossary/:term - Get definition for a specific term
router.get("/glossary/:term", (req, res) => {
  const term = req.params.term.toLowerCase();

  if (!glossaryCache) {
    return res.status(503).json({
      error: "GLOSSARY_UNAVAILABLE",
      message: "Glossary is not available",
    });
  }

  const definition = glossaryCache[term];

  if (!definition) {
    return res.status(404).json({
      error: "TERM_NOT_FOUND",
      message: `Term '${req.params.term}' not found in glossary`,
    });
  }

  res.json({
    term: req.params.term,
    definition,
  });
});

// GET /api/glossary - Get all glossary terms
router.get("/glossary", (req, res) => {
  if (!glossaryCache) {
    return res.status(503).json({
      error: "GLOSSARY_UNAVAILABLE",
      message: "Glossary is not available",
    });
  }

  res.json({
    terms: Object.keys(glossaryCache).length,
    glossary: glossaryCache,
  });
});

export default router;
