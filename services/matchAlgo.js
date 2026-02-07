const prisma = require('../config/db');

const calculateScore = (male, female) => {
  let score = 0;
  // TODO: Implement Jaccard Index for Hobbies
  // TODO: Implement MBTI Logic
  // TODO: Implement Love Language Logic
  return Math.random() * 100; // Placeholder
};

exports.runBatchMatching = async (sessionId) => {
  console.log(`Starting Batch Match for ${sessionId}...`);

  // 1. Fetch Confirmed Users
  // TODO: Add 'where' clause for Registration status = 'confirmed'
  const males = await prisma.profile.findMany({ where: { gender: 'Male' } });
  const females = await prisma.profile.findMany({ where: { gender: 'Female' } });

  if (males.length !== females.length) {
    throw new Error("Gender count mismatch! Cannot perform 1-to-1 match.");
  }

  // 2. Generate Scores (Bipartite Graph Weights)
  let edges = [];
  // TODO: Nested loop: for (m of males) { for (f of females) { ... } }

  // 3. Sort & Select Best Matches (Greedy)
  // TODO: Sort edges by score DESC
  // TODO: Iterate and lock matches that aren't taken

  // 4. Save to DB
  // TODO: Loop through results and prisma.match.create(...)

  return { count: 35 }; // Placeholder return
};