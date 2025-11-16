// services/resultInterpreter.js - Interpret regression results in plain language
// Explains coefficients, p-values, and model fit for non-statisticians

const openaiClient = require('../utils/openaiClient');

async function interpret(modelType, formula, results) {
  // Extract key information from broom results
  const tidy = results.tidy || [];
  const glance = results.glance || {};
  
  // Build prompt
  const prompt = `You are a statistical consultant explaining regression results to a non-technical audience.

Model Type: ${modelType.toUpperCase()}
Formula: ${formula}

Coefficients (from broom::tidy):
${JSON.stringify(tidy, null, 2)}

Model Statistics (from broom::glance):
${JSON.stringify(glance, null, 2)}

Provide a clear, plain-language interpretation:

1. **Overall Model Quality**: Is this a good model? (based on R², p-values, etc.)
2. **Key Findings**: What are the most important results?
3. **Coefficient Interpretations**: Explain each significant predictor in simple terms
   - For OLS: "A 1-unit increase in X leads to a Y-unit change in the outcome"
   - For Logistic: "X increases/decreases the odds of the outcome by Y%"
4. **Statistical Significance**: Which predictors matter and which don't?
5. **Practical Implications**: What does this mean in real-world terms?
6. **Limitations**: What should users be cautious about?

Use simple language. Avoid jargon. Be specific with numbers.

Respond with JSON in this exact format:
{
  "summary": "2-3 sentence executive summary",
  "model_quality": {
    "rating": "excellent|good|fair|poor",
    "explanation": "why this rating"
  },
  "key_findings": [
    "finding 1 in plain language",
    "finding 2 in plain language"
  ],
  "coefficients": [
    {
      "variable": "variable_name",
      "interpretation": "plain language explanation",
      "significance": "significant|not significant",
      "practical_meaning": "what this means in practice"
    }
  ],
  "limitations": ["limitation 1", "limitation 2"],
  "recommendations": "next steps or actions to take"
}`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert statistician who excels at explaining complex statistical results to non-technical audiences. You use clear, jargon-free language and focus on practical implications.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  // Get AI response
  const response = await openaiClient.jsonCompletion(messages, {
    temperature: 0.5,  // Slightly higher for more natural explanations
    max_tokens: 2000
  });

  return {
    summary: response.data.summary,
    model_quality: response.data.model_quality,
    key_findings: response.data.key_findings,
    coefficients: response.data.coefficients,
    limitations: response.data.limitations,
    recommendations: response.data.recommendations,
    usage: response.usage,
    cost: response.cost
  };
}

module.exports = {
  interpret
};