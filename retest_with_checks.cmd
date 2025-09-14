@echo off
setlocal ENABLEDELAYEDEXPANSION
title CSC230 R API - Retest with Checks

REM --- Move to the folder where the script lives (should be repo root) ---
cd /d %~dp0

echo ===============================================
echo  CSC230 R API - Retest (Preflight + Run)
echo ===============================================
echo.

REM --- Check Git installed ---
where git >NUL 2>&1
if errorlevel 1 (
  echo [ERROR] Git not found on PATH. Install Git for Windows and reopen CMD.
  exit /b 1
) else (
  for /f "tokens=3-5 delims= " %%a in ('git --version') do set GIT_VER=%%a %%b %%c
  echo [OK] Git present  (git --version = %GIT_VER%)
)

REM --- Check Docker CLI installed ---
where docker >NUL 2>&1
if errorlevel 1 (
  echo [ERROR] Docker CLI not found on PATH. Install Docker Desktop and reopen CMD.
  exit /b 1
) else (
  echo [OK] Docker CLI present
)

REM --- Check Docker engine running ---
echo [CHECK] Verifying Docker engine is running...
docker info >NUL 2>&1
if errorlevel 1 (
  echo [ERROR] Docker engine not reachable.
  echo   - Start Docker Desktop and wait until it shows "Docker Desktop is running"
  echo   - Then re-run this script.
  exit /b 1
) else (
  echo [OK] Docker engine is running
)

REM --- Git: fetch and switch to branch r ---
echo.
echo [GIT] Fetching branches from origin...
git fetch origin

echo [GIT] Switching to branch r (tracking origin/r)...
git rev-parse --verify r >NUL 2>&1
IF %ERRORLEVEL%==0 (
  git checkout r
) ELSE (
  git checkout -b r origin/r
)

REM --- Verify key files ---
if not exist r\Dockerfile (
  echo [ERROR] r\Dockerfile not found. Are you in the repo root? (%cd%)
  exit /b 1
)
if not exist plumber.R (
  echo [ERROR] plumber.R not found in repo root.
  exit /b 1
)

REM --- Ensure data folder exists ---
if not exist data (
  mkdir data
  echo [INFO] Created data\ folder
) else (
  echo [OK] data\ folder exists
)

echo.
echo [DOCKER] Building image: csc230-r-api:latest
docker build --no-cache -t csc230-r-api:latest -f r\Dockerfile .
if errorlevel 1 (
  echo [ERROR] Docker build failed.
  exit /b 1
)

echo.
echo [DOCKER] Starting container (Ctrl+C to stop)...
echo         Mount: %cd%\data  -->  /data
docker run --rm -p 8080:8080 -v %cd%/data:/data csc230-r-api:latest
if errorlevel 1 (
  echo [ERROR] Docker run failed.
  exit /b 1
)

echo [DONE]
exit /b 0
