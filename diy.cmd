@echo off
echo [1/9] Checking pnpm...
call pnpm --version >nul 2>&1
if errorlevel 1 (
 echo pnpm is not installed. Please install: npm i -g pnpm
) else (
 call pnpm --version
)

echo [2/9] Install frontend deps...
call pnpm -C sse-demo install --frozen-lockfile

echo [3/9] Build frontend (sse-demo)...
call pnpm -C sse-demo build

echo [4/9] Prepare pkg directory and copy frontend -^> pkg/public...
if not exist "pkg" mkdir "pkg"
if exist "pkg\public" rmdir /S /Q "pkg\public"
xcopy /E /I /Y "sse-demo\dist" "pkg\public" >nul

echo [5/9] Install backend deps...
call pnpm -C rear-end install --frozen-lockfile

echo [6/9] Build backend (TypeScript -^> dist)...
call pnpm -C rear-end build

echo [7/9] Package backend with pkg (node18-win-x64) -^> pkg\ ...
 if not exist "rear-end\dist\index.js" (
  echo Missing file: rear-end\dist\index.js
 )
 if not exist "pkg" mkdir "pkg"
 call pnpm dlx pkg "rear-end\dist\index.js" --targets node18-win-x64 --out-path "pkg" --compress Brotli

echo [8/9] Copy runtime essentials (.env, example.md) -^> pkg\ ...
 if exist "rear-end\.env" (
    copy /Y "rear-end\.env" "pkg\.env" >nul
 ) else if exist ".env" (
    copy /Y ".env" "pkg\.env" >nul
 )
 if exist "rear-end\example.md" (
   copy /Y "rear-end\example.md" "pkg\example.md" >nul
 ) else if exist "example.md" (
   copy /Y "example.md" "pkg\example.md" >nul
 )

echo [9/9] Create helper runner scripts in pkg\ ...
 (
  echo @echo off
  echo setlocal EnableExtensions
  echo pushd %%~dp0
  echo echo [run] starting index.exe ...
  echo .\index.exe 1^>run.log 2^>^&1
  echo echo [run] exit code: %%ERRORLEVEL%%
  echo echo [run] log saved to %%~dp0run.log
  echo pause
 )>"pkg\run-exe.cmd"

 (
  echo @echo off
  echo setlocal EnableExtensions
  echo pushd %%~dp0
  echo .\index.exe
  echo echo [run] exit code: %%ERRORLEVEL%%
  echo pause
 )>"pkg\run-exe-console.cmd"

echo.
echo Done: pkg\index.exe
echo Use: double-click pkg\run-exe.cmd to capture errors (saved to run.log)