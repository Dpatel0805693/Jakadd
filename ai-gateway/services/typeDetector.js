// services/typeDetector.js - Detect variable types using AI
// Determines if variables are continuous, binary, or categorical

const openaiClient = require('../utils/openaiClient');

async function detectTypes(columns, sample) {
  // Build prompt
  const prompt = `You are a statistical data analyst. Analyze these variables and determine their types.

Variables: ${columns.join(', ')}

Sample data (first few rows):
${JSON.stringify(sample, null, 2)}

For each variable, determine:
1. Type: "continuous" (numeric, many unique values), "binary" (0/1 or Yes/No), or "categorical" (limited distinct values)
2. Unique values (estimate if continuous)
3. Suggested role: "dependent" or "independent"
4. Brief explanation

Respond with JSON in this exact format:
{
  "variables": [
    {
      "name": "variable_name",
      "type": "continuous|binary|categorical",
      "unique_values": number or "many",
      "suggested_role": "dependent|independent",
      "explanation": "brief explanation"
    }
  ],
  "recommendations": "overall recommendations for modeling"
}`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert statistical analyst specializing in variable type detection and regression analysis.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  // Get AI response
  const response = await openaiClient.jsonCompletion(messages, {
    temperature: 0.3,  // Lower temperature for more consistent results
    max_tokens: 1500
  });

  return {
    variables: response.data.variables,
    recommendations: response.data.recommendations,
    usage: response.usage,
    cost: response.cost
  };
}

module.exports = {
  detectTypes
};