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
    score += WEIGHTS.personality / 2; // 50% of personality weight
  }

  // Male matches female's personality preference
  if (male.preferences?.personality === female.preferences?.personalityPreference) {
    score += WEIGHTS.personality / 2;
  }

  // Female matches male's personality preference
  if (female.preferences?.personality === male.preferences?.personalityPreference) {
    score += WEIGHTS.personality / 2;
  }

  return Math.min(score, WEIGHTS.personality); // Cap at weight
};

/**
 * Calculate age score based on preferences
 * Preferences: 'same' (±6 months), 'younger' (≥6 months younger), 'older' (≥6 months older), 'no_preference'
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

  const malePreference = male.preferences?.agePreference || 'no_preference';
  const femalePreference = female.preferences?.agePreference || 'no_preference';

  // Check if age difference satisfies a preference
  const satisfiesPreference = (preference, userAge, otherAge, diffMonths) => {
    switch (preference) {
      case 'no_preference':
        return true;
      case 'same':
        return diffMonths <= 6;
      case 'younger':
        return otherAge < userAge && diffMonths >= 6;
      case 'older':
        return otherAge > userAge && diffMonths >= 6;
      default:
        return false;
    }
  };

  // Hard filter: both must satisfy preferences
  if (!relax) {
    if (!satisfiesPreference(malePreference, maleAge, femaleAge, ageDiffMonths)) return 0;
    if (!satisfiesPreference(femalePreference, femaleAge, maleAge, ageDiffMonths)) return 0;
  }

  // Score based on how many preferences are met
  const malePreferenceMet = satisfiesPreference(malePreference, maleAge, femaleAge, ageDiffMonths);
  const femalePreferenceMet = satisfiesPreference(femalePreference, femaleAge, maleAge, ageDiffMonths);

  if (malePreferenceMet && femalePreferenceMet) {
    return WEIGHTS.age; // Both preferences met
  } else if (malePreferenceMet || femalePreferenceMet) {
    return Math.round(WEIGHTS.age * 0.6); // One preference met
  } else {
    return Math.round(WEIGHTS.age * 0.2); // Neither preference met (only if relaxing)
  }
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

  // Normalize to 0-10 scale
  return (matches / 4) * WEIGHTS.loveLanguage;
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
    fashionStyle: (
      (jaccardScore(male.preferences?.fashionStyle, female.preferences?.fashionPreference) +
       jaccardScore(female.preferences?.fashionStyle, male.preferences?.fashionPreference)) / 2
    ) * WEIGHTS.fashionStyle,
    characteristics: (
      (jaccardScore(male.preferences?.characteristics, female.preferences?.characteristicPreference) +
       jaccardScore(female.preferences?.characteristics, male.preferences?.characteristicPreference)) / 2
    ) * WEIGHTS.characteristics,
    faceType: (
      (jaccardScore(male.preferences?.faceType, female.preferences?.faceTypePreference) +
       jaccardScore(female.preferences?.faceType, male.preferences?.faceTypePreference)) / 2
    ) * WEIGHTS.faceType,
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
