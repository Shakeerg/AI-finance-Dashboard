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
      5. Determine transaction direction ('debit' vs 'credit') and find the matching ISO currency token.
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
              enum: ['Food & Dining', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Travel', 'Other', 'Rent', 'Uncategorized'] 
            },
            confidenceScore: { type: 'NUMBER' },
            // MOVED INSIDE THE PROPERTIES BLOCK CORRECTLY
            type: { 
              type: 'STRING', 
              enum: ['debit', 'credit'],
              description: "Set to 'debit' if it's an expense, withdrawal, or payment. Set to 'credit' if it's a deposit, salary, or refund."
            },
            currency: { 
              type: 'STRING', 
              description: "The standard ISO currency code extracted from the text, e.g., 'INR', 'USD', 'EUR'. Default to 'INR' if not clear." 
            },
            bank: { 
              type: 'STRING', 
              description: "The clear short-code or formal name of the bank associated with the transaction, e.g., SBI, HDFC, ICICI. Clean up typos." 
            }
          },
          required: ['amount', 'merchant', 'category', 'confidenceScore', 'type', 'currency', 'bank'] 
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
      confidenceScore: 0.0,
      type: 'debit',
      currency: 'INR',
      bank: 'Unknown Bank' // Fallback flag
    };
  }
};

module.exports = { parseSMSWithAi };