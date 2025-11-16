// services/modelSuggester.js - Suggest OLS vs Logistic regression
// Based on dependent variable type and independent variables

const openaiClient = require('../utils/openaiClient');

async function suggestModel(dependentVar, independentVars) {
  // Build prompt
  const prompt = `You are a statistical consultant. Help determine the best regression model.

Dependent Variable:
- Name: ${dependentVar.name}
- Type: ${dependentVar.type}
- Description: ${dependentVar.description || 'N/A'}

Independent Variables:
${independentVars.map(v => `- ${v.name} (${v.type})`).join('\n')}

Based on this information:
1. Recommend either OLS (Ordinary Least Squares) or Logistic regression
2. Explain why this model is appropriate
3. List any assumptions to check
4. Suggest any transformations or interactions
5. Warn about potential issues

Respond with JSON in this exact format:
{
  "recommended_model": "ols|logistic",
  "confidence": "high|medium|low",
  "explanation": "why this model is appropriate",
  "assumptions": ["assumption 1", "assumption 2"],
  "suggestions": {
    "transformations": ["suggested transformation 1"],
    "interactions": ["suggested interaction 1"],
    "concerns": ["potential issue 1"]
  },
  "formula_template": "example formula like: outcome ~ predictor1 + predictor2"
}`;

  const messages = [
    {
      role: 'system',
      content: 'You are an expert statistician specializing in regression model selection and experimental design.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  // Get AI response
  const response = await openaiClient.jsonCompletion(messages, {
    temperature: 0.3,
    max_tokens: 1500
  });

  return {
    model: response.data.recommended_model,
    confidence: response.data.confidence,
    explanation: response.data.explanation,
    assumptions: response.data.assumptions,
    suggestions: response.data.suggestions,
    formula_template: response.data.formula_template,
    usage: response.usage,
    cost: response.cost
  };
}

module.exports = {
  suggestModel
};