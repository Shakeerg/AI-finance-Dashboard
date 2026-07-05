// backend/config/aiService.js
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const parseSMSWithAi = async (rawText) => {
  try {
    const systemInstruction = `
      You are an expert fintech backend agent. Your job is to parse unstructured transactional bank SMS alerts and return a minified JSON object matching the exact schema provided.
      
      Rules:
      1. Extract the numeric transaction 'amount'.
      2. Identify the 'merchant' name (clean it up, e.g., 'Swiggy', 'Zomato', 'Amazon'). If unclear, default to 'Unknown Merchant'.
      3. CRITICAL: Assign a 'category' strictly limited to one of these allowed database choices: 
         ['Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Travel', 'Other', 'Rent', 'Uncategorized']
         Ensure exact string matching including capital letters and spaces.
      4. Provide a 'confidenceScore' between 0.0 and 1.0 reflecting how confident you are in the parsing accuracy.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Parse the raw text: "${rawText}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            amount: { type: 'NUMBER' },
            merchant: { type: 'STRING' },
            category: { 
              type: 'STRING', 
              // These now mirror your Mongoose Schema enums 100% exactly
              enum: ['Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Travel', 'Other', 'Rent', 'Uncategorized'] 
            },
            confidenceScore: { type: 'NUMBER' }
          },
          required: ['amount', 'merchant', 'category', 'confidenceScore']
        }
      }
    });

    const cleanResult = JSON.parse(response.text.trim());
    return cleanResult;
  } catch (error) {
    console.error('🚨 AI processing failed:', error.message);
    return {
      amount: 0,
      merchant: 'Parsing Failure Fallback',
      category: 'Uncategorized',
      confidenceScore: 0.0
    };
  }
};

module.exports = { parseSMSWithAi };