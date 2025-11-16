\# AI Gateway - StatsMate



\*\*Port 8001\*\* - AI-powered statistical assistance using OpenAI GPT-4o-mini



\## Features



\- \*\*Variable Type Detection\*\* - Automatically classify variables as continuous, binary, or categorical

\- \*\*Model Suggestion\*\* - Recommend OLS vs Logistic regression based on data

\- \*\*Result Interpretation\*\* - Explain regression results in plain language

\- \*\*Cost Control\*\* - $10/month budget with automatic tracking

\- \*\*LRU Cache\*\* - Reduce API calls by caching responses (1 hour TTL)



\## Architecture

```

ai-gateway/

├── server.js              # Express app with 6 endpoints

├── services/

│   ├── typeDetector.js    # Detect variable types

│   ├── modelSuggester.js  # Suggest OLS vs Logistic

│   └── resultInterpreter.js # Plain-language explanations

├── utils/

│   ├── cache.js           # LRU cache (100 entries)

│   ├── costTracker.js     # Budget enforcement

│   └── openaiClient.js    # OpenAI API wrapper

└── config/

```



\## Environment Variables



Required in `.env`:

```env

OPENAI\_API\_KEY=sk-...        # Your OpenAI API key

MONTHLY\_BUDGET=10            # Monthly spending cap ($)

PORT=8001                    # Service port

NODE\_ENV=development         # Environment

```



\## API Endpoints



\### 1. Health Check

```bash

GET /ping

```



Response:

```json

{

&nbsp; "status": "healthy",

&nbsp; "port": 8001,

&nbsp; "service": "AI Gateway",

&nbsp; "timestamp": "2025-11-16T22:30:00.000Z",

&nbsp; "budget": {

&nbsp;   "monthly\_limit": 10,

&nbsp;   "spent\_this\_month": 0.42

&nbsp; }

}

```



\### 2. Detect Variable Types

```bash

POST /detect-types

Content-Type: application/json



{

&nbsp; "columns": \["age", "income", "employed"],

&nbsp; "sample": \[

&nbsp;   {"age": 25, "income": 50000, "employed": 1},

&nbsp;   {"age": 30, "income": 60000, "employed": 1},

&nbsp;   {"age": 35, "income": 55000, "employed": 0}

&nbsp; ]

}

```



Response:

```json

{

&nbsp; "ok": true,

&nbsp; "variables": \[

&nbsp;   {

&nbsp;     "name": "age",

&nbsp;     "type": "continuous",

&nbsp;     "unique\_values": "many",

&nbsp;     "suggested\_role": "independent",

&nbsp;     "explanation": "Numeric variable with many unique values"

&nbsp;   },

&nbsp;   {

&nbsp;     "name": "employed",

&nbsp;     "type": "binary",

&nbsp;     "unique\_values": 2,

&nbsp;     "suggested\_role": "dependent",

&nbsp;     "explanation": "Binary outcome (0/1)"

&nbsp;   }

&nbsp; ],

&nbsp; "recommendations": "Use logistic regression with 'employed' as dependent variable",

&nbsp; "usage": {...},

&nbsp; "cost": 0.0023

}

```



\### 3. Suggest Model

```bash

POST /suggest-model

Content-Type: application/json



{

&nbsp; "dependentVar": {

&nbsp;   "name": "employed",

&nbsp;   "type": "binary"

&nbsp; },

&nbsp; "independentVars": \[

&nbsp;   {"name": "age", "type": "continuous"},

&nbsp;   {"name": "income", "type": "continuous"}

&nbsp; ]

}

```



Response:

```json

{

&nbsp; "ok": true,

&nbsp; "model": "logistic",

&nbsp; "confidence": "high",

&nbsp; "explanation": "Binary dependent variable requires logistic regression",

&nbsp; "assumptions": \[

&nbsp;   "Independence of observations",

&nbsp;   "Linear relationship between log-odds and predictors"

&nbsp; ],

&nbsp; "suggestions": {

&nbsp;   "transformations": \["Consider log(income) for skewed data"],

&nbsp;   "interactions": \["Test age \* income interaction"],

&nbsp;   "concerns": \["Check for multicollinearity"]

&nbsp; },

&nbsp; "formula\_template": "employed ~ age + income",

&nbsp; "usage": {...},

&nbsp; "cost": 0.0019

}

```



\### 4. Interpret Results

```bash

POST /interpret

Content-Type: application/json



{

&nbsp; "model\_type": "ols",

&nbsp; "formula": "mpg ~ hp + wt",

&nbsp; "results": {

&nbsp;   "tidy": \[

&nbsp;     {"term": "(Intercept)", "estimate": 37.23, "p.value": 0.001},

&nbsp;     {"term": "hp", "estimate": -0.032, "p.value": 0.002},

&nbsp;     {"term": "wt", "estimate": -3.88, "p.value": 0.000}

&nbsp;   ],

&nbsp;   "glance": {

&nbsp;     "r.squared": 0.827,

&nbsp;     "adj.r.squared": 0.815,

&nbsp;     "p.value": 0.000

&nbsp;   }

&nbsp; }

}

```



Response:

```json

{

&nbsp; "ok": true,

&nbsp; "summary": "This is an excellent model explaining 83% of MPG variation. Both horsepower and weight significantly reduce fuel efficiency.",

&nbsp; "model\_quality": {

&nbsp;   "rating": "excellent",

&nbsp;   "explanation": "High R² (0.83) and all predictors highly significant"

&nbsp; },

&nbsp; "key\_findings": \[

&nbsp;   "Weight is the strongest predictor of fuel efficiency",

&nbsp;   "Every 1000 lbs reduces MPG by 3.88 miles per gallon",

&nbsp;   "Higher horsepower also reduces efficiency"

&nbsp; ],

&nbsp; "coefficients": \[

&nbsp;   {

&nbsp;     "variable": "hp",

&nbsp;     "interpretation": "Each additional horsepower reduces MPG by 0.032",

&nbsp;     "significance": "significant",

&nbsp;     "practical\_meaning": "A 100 HP increase → 3.2 MPG decrease"

&nbsp;   },

&nbsp;   {

&nbsp;     "variable": "wt",

&nbsp;     "interpretation": "Each 1000 lb increase reduces MPG by 3.88",

&nbsp;     "significance": "significant",

&nbsp;     "practical\_meaning": "Heavier cars use significantly more fuel"

&nbsp;   }

&nbsp; ],

&nbsp; "limitations": \[

&nbsp;   "Model assumes linear relationships",

&nbsp;   "May not account for modern engine technology"

&nbsp; ],

&nbsp; "recommendations": "Model is reliable for predictions. Consider testing mpg ~ hp \* wt interaction.",

&nbsp; "usage": {...},

&nbsp; "cost": 0.0034

}

```



\### 5. Cache Stats

```bash

GET /cache-stats

```



\### 6. Budget Stats

```bash

GET /budget-stats

```



\## Cost Management



\- \*\*Model\*\*: GPT-4o-mini

\- \*\*Pricing\*\*: $0.150/1M input tokens, $0.600/1M output tokens

\- \*\*Budget\*\*: $10/month (configurable)

\- \*\*Tracking\*\*: Automatic cost calculation per request

\- \*\*Reset\*\*: Monthly automatic reset

\- \*\*Protection\*\*: Requests blocked when budget exceeded



Typical costs:

\- Type detection: ~$0.002 per request

\- Model suggestion: ~$0.002 per request

\- Result interpretation: ~$0.003 per request

\- \*\*~1,500 requests/month\*\* within budget



\## Caching Strategy



\- \*\*LRU Cache\*\*: 100 entries max

\- \*\*TTL\*\*: 1 hour

\- \*\*Hit Rate\*\*: ~60-70% for repeated queries

\- \*\*Savings\*\*: ~40% reduction in API calls



\## Running Locally

```bash

\# Install dependencies

npm install



\# Create .env with your OpenAI key

echo "OPENAI\_API\_KEY=sk-..." > .env



\# Start server

npm start



\# Or with auto-reload

npm run dev

```



\## Running with Docker

```bash

\# Build image

docker build -t ai-gateway .



\# Run container

docker run -p 8001:8001 --env-file .env ai-gateway

```



\## Testing

```bash

\# Health check

curl http://localhost:8001/ping



\# Detect types

curl -X POST http://localhost:8001/detect-types \\

&nbsp; -H "Content-Type: application/json" \\

&nbsp; -d '{"columns": \["age", "income"], "sample": \[{"age": 25, "income": 50000}]}'



\# Check budget

curl http://localhost:8001/budget-stats

```



\## Integration with R Services



The AI Gateway complements R services:

1\. \*\*Pre-analysis\*\*: Detect types → Suggest model

2\. \*\*Run regression\*\*: Call R service (8000 or 8002)

3\. \*\*Post-analysis\*\*: Interpret results in plain language



\## Team Lead



\*\*Jordano\*\* - AI Gateway \& R Stats Lead

\- AI-powered assistance

\- Statistical interpretation

\- Cost optimization



\## Tech Stack



\- \*\*Runtime\*\*: Node.js 18+

\- \*\*Framework\*\*: Express

\- \*\*AI\*\*: OpenAI GPT-4o-mini

\- \*\*Cache\*\*: lru-cache

\- \*\*Logging\*\*: morgan

