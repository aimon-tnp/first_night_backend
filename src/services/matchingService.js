const prisma = require('../config/db');

// ─── Scoring Weights ──────────────────────────────────────────────────────────
const WEIGHTS = {
  personality: 20,
  age: 25,
  loveLanguage: 10,
  hobbies: 10,
  fashionStyle: 10,
  characteristics: 12,
  faceType: 13,
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Calculate age in years from birthdate
 */
const getAgeInYears = (birthday) => {
  const today = new Date();
  let age = today.getFullYear() - birthday.getFullYear();
  const monthDiff = today.getMonth() - birthday.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
    age--;
  }
  return age;
};

/**
 * Calculate Jaccard index: intersection / union of two arrays
 * Both arrays contain strings
 */
const jaccardScore = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
    return 0;
  }

  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size; // 0 to 1
};

/**
 * Calculate personality score
 * Check: exact personality match + personalityPreference match
 */
const computePersonalityScore = (male, female) => {
  let score = 0;

  // Exact personality match
  if (male.preferences?.personality === female.preferences?.personality) {
    score += 10; // 50% of personality weight
  }

  // Male matches female's personality preference
  if (male.preferences?.personality === female.preferences?.personalityPreference) {
    score += 10;
  }

  // Female matches male's personality preference
  if (female.preferences?.personality === male.preferences?.personalityPreference) {
    score += 5; // Bonus but weighted less
  }

  return Math.min(score, 20); // Cap at weight
};

/**
 * Calculate age score based on preferences
 * Hard filtering: check age preferences first
 * If preferences prevent matching, return 0 (will be filtered later)
 */
const computeAgeScore = (male, female, relax = false) => {
  const maleAge = getAgeInYears(male.birthday);
  const femaleAge = getAgeInYears(female.birthday);
  const ageDiffMonths = Math.abs(
    (male.birthday.getFullYear() - female.birthday.getFullYear()) * 12 +
      (male.birthday.getMonth() - female.birthday.getMonth())
  );

  // If not relaxing, apply hard filters
  if (!relax) {
    // Check male's age preference against female
    const malePreference = male.preferences?.agePreference;
    if (malePreference === 'same' && ageDiffMonths > 6) return 0;
    if (malePreference === 'younger' && femaleAge >= maleAge) return 0;
    if (malePreference === 'older' && femaleAge <= maleAge) return 0;

    // Check female's age preference against male
    const femalePreference = female.preferences?.agePreference;
    if (femalePreference === 'same' && ageDiffMonths > 6) return 0;
    if (femalePreference === 'younger' && maleAge >= femaleAge) return 0;
    if (femalePreference === 'older' && maleAge <= femaleAge) return 0;
  }

  // Score based on how well age matches both preferences
  let score = 0;

  // Within ±6 months = full points
  if (ageDiffMonths <= 6) {
    score = 25;
  } else {
    // Partial score based on preference alignment
    const malePreference = male.preferences?.agePreference;
    const femalePreference = female.preferences?.agePreference;

    if (malePreference === 'same' || femalePreference === 'same') {
      score = 15;
    } else if (
      (malePreference === 'younger' && femaleAge < maleAge) ||
      (malePreference === 'older' && femaleAge > maleAge) ||
      (femalePreference === 'younger' && maleAge < femaleAge) ||
      (femalePreference === 'older' && maleAge > femaleAge)
    ) {
      score = 10;
    } else {
      score = 5;
    }
  }

  return score;
};

/**
 * Calculate love language score
 * Check express and receive fields
 */
const computeLoveLanguageScore = (male, female) => {
  let matches = 0;

  // Both express the same language
  if (male.preferences?.loveLangExpress === female.preferences?.loveLangExpress) {
    matches += 1;
  }

  // Both receive the same language
  if (male.preferences?.loveLangReceive === female.preferences?.loveLangReceive) {
    matches += 1;
  }

  // Express matches receive (complementary)
  if (male.preferences?.loveLangExpress === female.preferences?.loveLangReceive) {
    matches += 1;
  }

  if (female.preferences?.loveLangExpress === male.preferences?.loveLangReceive) {
    matches += 1;
  }

  // Normalize to 0-12 scale
  return (matches / 4) * 12;
};

/**
 * Calculate full match score between male and female
 */
const computeMatchScore = (male, female, relax = false) => {
  const scores = {
    personality: computePersonalityScore(male, female),
    age: computeAgeScore(male, female, relax),
    loveLanguage: computeLoveLanguageScore(male, female),
    hobbies: jaccardScore(male.preferences?.hobbies, female.preferences?.hobbies) * WEIGHTS.hobbies,
    fashionStyle: jaccardScore(male.preferences?.fashionStyle, female.preferences?.fashionPreference) * WEIGHTS.fashionStyle,
    characteristics: jaccardScore(male.preferences?.characteristics, female.preferences?.characteristicPreference) * WEIGHTS.characteristics,
    faceType: jaccardScore(male.preferences?.faceType, female.preferences?.faceTypePreference) * WEIGHTS.faceType,
  };

  // Hard filter: if age is 0 (preference mismatch), pair scores 0
  if (scores.age === 0) {
    return 0;
  }

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  return totalScore;
};

/**
 * Assignment algorithm for optimal bipartite matching
 * Greedy approach: sort males by best possible match, then assign to best available female
 */
const assignMatches = (costMatrix) => {
  const n = costMatrix.length;
  const m = costMatrix[0].length;

  if (n === 0 || m === 0) return [];

  const assignment = [];
  const usedFemales = new Set();

  // Sort males by best possible match (greedy)
  const maleIndices = Array.from({ length: n }, (_, i) => i);
  maleIndices.sort((i1, i2) => {
    const best1 = Math.max(...costMatrix[i1]);
    const best2 = Math.max(...costMatrix[i2]);
    return best2 - best1;
  });

  // Assign each male to best available female
  for (const maleIdx of maleIndices) {
    let bestFemaleIdx = -1;
    let bestScore = -1;

    for (let femaleIdx = 0; femaleIdx < m; femaleIdx++) {
      if (!usedFemales.has(femaleIdx) && costMatrix[maleIdx][femaleIdx] > bestScore) {
        bestScore = costMatrix[maleIdx][femaleIdx];
        bestFemaleIdx = femaleIdx;
      }
    }

    if (bestFemaleIdx !== -1 && bestScore > 0) {
      assignment.push([maleIdx, bestFemaleIdx]);
      usedFemales.add(bestFemaleIdx);
    }
  }

  return assignment;
};

// ─── Main Matching Function ───────────────────────────────────────────────────

/**
 * Batch match males and females for a session
 * Returns array of match pairs: [{ male, female, score }]
 */
const batchMatch = async (males, females) => {
  if (males.length === 0 || females.length === 0) {
    throw new Error('No males or females to match');
  }

  // First attempt: with age preference hard filters
  let costMatrix = males.map(male =>
    females.map(female => computeMatchScore(male, female, false))
  );

  let assignment = assignMatches(costMatrix);

  // If insufficient matches, relax age filter and retry
  if (assignment.length < Math.min(males.length, females.length)) {
    costMatrix = males.map(male =>
      females.map(female => computeMatchScore(male, female, true))
    );
    assignment = assignMatches(costMatrix);
  }

  // Convert assignment to match objects with scores
  const matches = assignment.map(([maleIdx, femaleIdx]) => {
    const score = computeMatchScore(males[maleIdx], females[femaleIdx], true);
    return {
      male: males[maleIdx],
      female: females[femaleIdx],
      score,
    };
  });

  return matches;
};

module.exports = { batchMatch, computeMatchScore };
