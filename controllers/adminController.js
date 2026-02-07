const matchAlgo = require('../services/matchAlgo');

exports.triggerMatching = async (req, res) => {
  try {
    // 1. Run the Algorithm
    const result = await matchAlgo.runBatchMatching('feb_2026'); // Pass current session
    
    // 2. Response
    res.json({ 
      success: true, 
      matchesGenerated: result.count 
    });
  } catch (error) {
    console.error("Matching Failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};