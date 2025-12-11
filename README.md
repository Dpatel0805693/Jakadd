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

### System Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 5GB free space
- **Internet**: Required for first build (downloads Docker images)

### Ports Used

The application uses these ports (must be available):

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

### Step 2: Get the Project Files

**Option A: From Flash Drive**
```
Copy the entire "CSC 230 Final Code" folder to your computer
Example: C:\Projects\CSC 230 Final Code
```

**Option B: From GitHub**
```bash
git clone https://github.com/Dpatel0805693/Jakadd.git
cd Jakadd
```

### Step 3: Start the Application

**Windows (PowerShell):**
```powershell
cd "C:\path\to\CSC 230 Final Code"
docker-compose up --build
```

**Mac/Linux (Terminal):**
```bash
cd /path/to/CSC\ 230\ Final\ Code
docker-compose up --build
```

**Or double-click `START_STATSMATE.bat`** (Windows only)

### Step 4: Wait for Build

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

**Sample data files are included in the `examples/` folder!**

### 3️⃣ Configure Your Analysis

1. Click on your uploaded file
2. **Select Dependent Variable** (what you want to predict)
   - For OLS: Choose a continuous variable (e.g., grades, income)
   - For Logistic: Choose a binary variable (e.g., pass/fail, yes/no)
3. **Select Independent Variables** (predictors)
   - Check one or more variables
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

Click **"Download Results"** to save your analysis as a file.

---

## 📁 Sample Data Files

Test the application with these included datasets in the `examples/` folder:

| File | Use For | Variables |
|------|---------|-----------|
| `student_data.csv` | OLS regression | student_id, study_hours, prior_gpa, attendance_rate, final_grade |
| `voting_data.csv` | Logistic regression | Binary outcome analysis |

### Example: OLS Analysis
- **File**: Any CSV with continuous outcome
- **Dependent**: `final_grade` (or any numeric column)
- **Independent**: `study_hours`, `prior_gpa`, `attendance_rate`
- **Model**: Linear Regression (OLS)

### Example: Logistic Analysis
- **File**: Any CSV with binary (0/1) outcome
- **Dependent**: `passed` or `voted` (binary column)
- **Independent**: `study_hours`, `prior_gpa`
- **Model**: Logistic Regression

---

## 🛠️ Common Commands

### Start Application
```bash
docker-compose up --build
```

### Start in Background
```bash
docker-compose up -d --build
```

### Stop Application
```bash
docker-compose down
```

### View All Logs
```bash
docker-compose logs
```

### View Specific Service Logs
```bash
docker-compose logs frontend
docker-compose logs core-api
docker-compose logs integration-api
docker-compose logs r-ols
docker-compose logs r-logistic
docker-compose logs mongodb
```

### Check Running Containers
```bash
docker ps
```

### Restart Everything
```bash
docker-compose down
docker-compose up --build
```

---

## ❗ Troubleshooting

### Docker Desktop Not Starting

**Windows:**
1. Ensure virtualization is enabled in BIOS
2. Install/update WSL2:
   ```powershell
   wsl --install
   wsl --update
   ```
3. Restart computer

**Mac:**
- Ensure you have macOS 10.15 or later
- Try reinstalling Docker Desktop

### "Port Already in Use" Error

Find and stop the conflicting process:

**Windows:**
```powershell
netstat -ano | findstr :5173
taskkill /PID  /F
```

**Mac/Linux:**
```bash
lsof -i :5173
kill -9 
```

### "Cannot Connect to Docker Daemon"

Docker Desktop isn't running. Start it and wait for the whale icon to be steady.

### Build Fails - "No Space Left"

Clean up Docker:
```bash
docker system prune -a
```

### Analysis Fails - "File Not Found"

1. Re-upload your CSV file
2. Restart the application:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### MongoDB Connection Errors

Wait 30 seconds after starting - MongoDB takes time to initialize.

Check if it's healthy:
```bash
docker-compose logs mongodb
```

### R Service Returns 404

Rebuild the R containers:
```bash
docker-compose down
docker-compose up --build r-ols r-logistic
```

### Logistic Regression "Failed to Converge"

This is a statistical issue, not a bug. It happens when:
- Your predictors perfectly separate the outcome
- You need more data

**Solution**: Add more predictor variables or use a larger dataset.

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

### Services Overview

| Service | Technology | Purpose |
|---------|------------|---------|
| **Frontend** | React, Vite, Tailwind | User interface |
| **Core API** | Node.js, Express | Authentication, file management |
| **Integration API** | Node.js, Express | Analysis orchestration |
| **R-OLS** | R, Plumber | OLS regression analysis |
| **R-Logistic** | R, Plumber | Logistic regression analysis |
| **AI Gateway** | Node.js | AI-powered interpretations |
| **MongoDB** | MongoDB 7 | Data persistence |

---

## 📂 Project Structure

```
CSC 230 Final Code/
├── backend/                    # Core API
│   ├── routes/                 # API endpoints
│   ├── models/                 # MongoDB schemas
│   ├── middleware/             # Auth, upload handling
│   ├── uploads/                # Uploaded CSV files
│   └── Dockerfile
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   └── charts/         # Visualization components
│   │   ├── pages/              # Page components
│   │   ├── context/            # Auth context
│   │   └── services/           # API client
│   └── Dockerfile
├── integration-api/            # Analysis orchestration
│   ├── routes/
│   │   └── analyzeRoute.js     # Main analysis endpoint
│   └── Dockerfile
├── ai-gateway/                 # AI interpretation service
│   └── Dockerfile
├── r-services/                 # R statistical services
│   ├── plumber_ols.R           # OLS regression
│   ├── plumber_logistic.R      # Logistic regression
│   ├── Dockerfile.ols
│   └── Dockerfile.logistic
├── examples/                   # Sample datasets
├── docker-compose.yml          # Container orchestration
└── README.md                   # This file
```

---

## 🔐 Environment Variables

Create a `.env` file in the project root (optional):

```env
# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# OpenAI API Key (optional - enables AI interpretations)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Note**: The application works without these - defaults are used.

---

## 📊 R Services API Reference

### OLS Service (Port 8000)

**Health Check:**
```
GET http://localhost:8000/ping
```

**Run Analysis:**
```
POST http://localhost:8000/ols
Content-Type: application/json

{
  "data": [...],           // Inline data array
  "dependent_var": "y",
  "independent_vars": ["x1", "x2"]
}
```

### Logistic Service (Port 8002)

**Health Check:**
```
GET http://localhost:8002/ping
```

**Run Analysis:**
```
POST http://localhost:8002/logistic
Content-Type: application/json

{
  "data": [...],           // Inline data array
  "dependent_var": "outcome",
  "independent_vars": ["predictor1", "predictor2"]
}
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

1. Start the application:
   ```bash
   docker-compose up --build
   ```

2. Verify all 8 containers are running:
   ```bash
   docker ps
   ```
   Expected: 8 containers (mongodb, core-api, integration-api, ai-gateway, r-ols, r-logistic, r-reserved, frontend)

3. Open [http://localhost:5173](http://localhost:5173)

4. Create a test account

5. Upload a CSV file from `examples/` folder

6. Configure analysis:
   - Dependent: Choose a numeric column
   - Independent: Select 1-3 predictor columns
   - Model: OLS or Logistic

7. Verify all 4 result tabs display correctly:
   - ✅ AI Interpretation shows plain-language summary
   - ✅ Statistical Output shows coefficients table
   - ✅ Visualizations shows charts
   - ✅ R Code shows reproducible script

### Key Technical Achievements

- ✅ Microservices architecture with 8 Docker containers
- ✅ Real-time statistical analysis via R/Plumber
- ✅ JWT authentication
- ✅ File upload with validation
- ✅ Interactive data visualizations (Recharts)
- ✅ AI-powered result interpretation
- ✅ Reproducible R code generation
- ✅ Educational tooltip system

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Dec 2025 | Initial release - OLS & Logistic regression |

---

## 🆘 Support

If you encounter issues:

1. ✅ Check the Troubleshooting section above
2. ✅ Review Docker logs: `docker-compose logs`
3. ✅ Ensure Docker Desktop is running
4. ✅ Try restarting: `docker-compose down && docker-compose up --build`

---

## 📄 License

This project was created for CSC 230 - Software Engineering.
For educational purposes only.

---

<div align="center">

**Happy Analyzing! 📈**

Made with ❤️ by the StatsMate Team

</div>
