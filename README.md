# 📊 StatsMate - AI-Powered Statistical Analysis Platform

> **CSC 230 Final Project** | Making regression analysis accessible for everyone

StatsMate is a full-stack web application that enables political science students and social science researchers to perform regression analysis without coding expertise. Upload your data, select variables, and get AI-powered interpretations with professional visualizations.

![StatsMate](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Required-blue)
![License](https://img.shields.io/badge/License-Educational-orange)

---

## 🎯 Features

| Feature | Description |
|---------|-------------|
| **OLS Regression** | Linear regression with R², coefficients, and diagnostics |
| **Logistic Regression** | Binary outcome analysis with odds ratios |
| **AI Interpretation** | Plain-language explanations of statistical results |
| **Interactive Visualizations** | Coefficient plots, residual diagnostics |
| **Downloadable R Code** | Reproducible analysis scripts |
| **Educational Tooltips** | Hover explanations for statistical terms |

---

## 📋 Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| **Docker Desktop** | 4.0+ | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop) |
| **Git** | Any | [git-scm.com/downloads](https://git-scm.com/downloads) |

### System Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 5GB free space
- **Internet**: Required for first build (downloads Docker images)

### Ports Used

| Port | Service |
|------|---------|
| 5173 | Frontend (React) |
| 3000 | Core API (Node.js) |
| 5001 | Integration API |
| 8000 | R OLS Service |
| 8001 | AI Gateway |
| 8002 | R Logistic Service |
| 8004 | R Reserved Service |
| 27017 | MongoDB |

---

## 🚀 Quick Start Guide

### Step 1: Install Docker Desktop

1. Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Run the installer
3. **Restart your computer**
4. Open Docker Desktop and wait for it to fully start
   - Windows: Look for the whale icon in system tray (should be steady, not animating)
   - Mac: Look for the whale icon in menu bar

### Step 2: Clone the Repository

```bash
git clone https://github.com/Dpatel0805693/Jakadd.git
cd Jakadd
```

### Step 3: Create Environment File

Create a `.env` file in the project root:

```env
# MongoDB
MONGO_URI=mongodb://mongodb:27017/csc230

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# OpenAI API Key (optional - enables AI interpretations)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional
NODE_ENV=production
```

**Note**: Get your OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Step 4: Start the Application

```bash
docker-compose up --build
```

First run takes **5-15 minutes** as Docker downloads and builds everything.

Watch for this message indicating success:
```
csc230-frontend  | VITE v5.x.x ready in xxx ms
csc230-frontend  | ➜ Local: http://localhost:5173/
```

### Step 5: Open StatsMate

🌐 **Open your browser to: [http://localhost:5173](http://localhost:5173)**

---

## 📖 How to Use StatsMate

### 1️⃣ Create an Account

1. Click **"Sign Up"** on the homepage
2. Enter your email and password
3. Click **"Create Account"**
4. Log in with your credentials

### 2️⃣ Upload Your Data

1. Click **"Upload"** in the navigation bar
2. Click **"Choose File"** and select a CSV file
3. Wait for the upload confirmation
4. Your file appears in the dashboard

### 3️⃣ Configure Your Analysis

1. Click on your uploaded file
2. **Select Dependent Variable** (what you want to predict)
   - For OLS: Choose a continuous variable (e.g., grades, income)
   - For Logistic: Choose a binary variable (e.g., pass/fail, yes/no)
3. **Select Independent Variables** (predictors)
4. **Choose Model Type**:
   - **Linear Regression (OLS)** - for continuous outcomes
   - **Logistic Regression** - for binary (0/1) outcomes

### 4️⃣ Run Analysis

1. Click **"Run Analysis"**
2. Wait for processing (typically 1-5 seconds)
3. View results across four tabs:

| Tab | Contents |
|-----|----------|
| **AI Interpretation** | Plain-language summary of findings |
| **Statistical Output** | Coefficients table, p-values, model diagnostics |
| **Visualizations** | Coefficient plots, residual plots |
| **R Code** | Reproducible R script for your analysis |

### 5️⃣ Download Results

Click **"Download Results"** to save your analysis.

---

## 📁 Sample Data

Test datasets are available in the `examples/` folder.

### Example: OLS Analysis
- **Dependent**: Any continuous variable (e.g., `final_grade`)
- **Independent**: `study_hours`, `prior_gpa`, `attendance_rate`
- **Model**: Linear Regression (OLS)

### Example: Logistic Analysis
- **Dependent**: Any binary variable (e.g., `passed`, `voted`)
- **Independent**: `study_hours`, `prior_gpa`
- **Model**: Logistic Regression

---

## 🛠️ Common Commands

| Command | Description |
|---------|-------------|
| `docker-compose up --build` | Start application |
| `docker-compose up -d --build` | Start in background |
| `docker-compose down` | Stop application |
| `docker-compose logs` | View all logs |
| `docker-compose logs <service>` | View specific service logs |
| `docker ps` | Check running containers |

---

## ❗ Troubleshooting

### Docker Desktop Not Starting

**Windows:**
```powershell
wsl --install
wsl --update
```
Then restart your computer.

### "Port Already in Use"

**Windows:**
```powershell
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F
```

**Mac/Linux:**
```bash
lsof -i :5173
kill -9 <PID_NUMBER>
```

### "Cannot Connect to Docker Daemon"

Start Docker Desktop and wait for the whale icon to be steady.

### Build Fails - "No Space Left"

```bash
docker system prune -a
```

### Analysis Fails

```bash
docker-compose down
docker-compose up --build
```

### Logistic Regression "Failed to Converge"

This is a statistical issue (complete separation). Try:
- Adding more predictor variables
- Using a larger dataset

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    StatsMate Platform                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Frontend   │    │  Core API   │    │  MongoDB    │     │
│  │   (React)   │───▶│  (Node.js)  │───▶│  Database   │     │
│  │  Port 5173  │    │  Port 3000  │    │ Port 27017  │     │
│  └─────────────┘    └──────┬──────┘    └─────────────┘     │
│                            │                                 │
│                            ▼                                 │
│                   ┌─────────────────┐                       │
│                   │ Integration API │                       │
│                   │   Port 5001     │                       │
│                   └────────┬────────┘                       │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐             │
│         ▼                  ▼                  ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   R - OLS   │    │ R - Logistic│    │ AI Gateway  │     │
│  │  Port 8000  │    │  Port 8002  │    │  Port 8001  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Services

| Service | Technology | Purpose |
|---------|------------|---------|
| **Frontend** | React, Vite, Tailwind | User interface |
| **Core API** | Node.js, Express | Authentication, file management |
| **Integration API** | Node.js, Express | Analysis orchestration |
| **R-OLS** | R, Plumber | OLS regression analysis |
| **R-Logistic** | R, Plumber | Logistic regression analysis |
| **AI Gateway** | Node.js, OpenAI | AI-powered interpretations |
| **MongoDB** | MongoDB 7 | Data persistence |

---

## 📂 Project Structure

```
├── backend/                    # Core API
│   ├── routes/                 # API endpoints
│   ├── models/                 # MongoDB schemas
│   ├── middleware/             # Auth, upload handling
│   └── Dockerfile
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── pages/              # Page components
│   │   └── services/           # API client
│   └── Dockerfile
├── integration-api/            # Analysis orchestration
│   └── Dockerfile
├── ai-gateway/                 # AI service
│   └── Dockerfile
├── r-services/                 # R statistical services
│   ├── plumber_ols.R
│   ├── plumber_logistic.R
│   └── Dockerfile.*
├── examples/                   # Sample datasets
├── docker-compose.yml          # Container orchestration
└── README.md
```

---

## 👥 Development Team

| Name | Role |
|------|------|
| **Jordano** | R Stats & AI Gateway Lead, Frontend Tech Lead |
| **Dhwani** | Frontend UI Lead |
| **Khalil** | Core API & Database Lead |
| **Amanda** | Integration & Orchestration Lead |
| **Anthony** | Data Visualizations Lead |
| **Darwin** | Documentation Lead |

---

## 🎓 For Instructors/Graders

### Verification Steps

1. Clone and start:
   ```bash
   git clone https://github.com/Dpatel0805693/Jakadd.git
   cd Jakadd
   docker-compose up --build
   ```

2. Verify 8 containers running:
   ```bash
   docker ps
   ```

3. Open [http://localhost:5173](http://localhost:5173)

4. Create account → Upload CSV → Run analysis

5. Verify all 4 result tabs display correctly

### Key Technical Achievements

- ✅ Microservices architecture (8 Docker containers)
- ✅ Real-time statistical analysis via R/Plumber
- ✅ JWT authentication
- ✅ File upload with validation
- ✅ Interactive visualizations (Recharts)
- ✅ AI-powered result interpretation
- ✅ Reproducible R code generation
- ✅ Educational tooltip system

---

## 📄 License

CSC 230 - Software Engineering | Educational purposes only.

---

<div align="center">

**Happy Analyzing! 📈**

Made with ❤️ by the StatsMate Team

</div>
