# Rule: Windows Deployment Methodology

This rule outlines the verified methodology for building and deploying the application on Windows environments where PowerShell script execution is restricted.

## Context
When running on Windows with `cmd` or `PowerShell`, standard commands like `npm` or `npx` may fail if the system's execution policy prevents running `.ps1` files. This is common in developer environments.

## Deployment Procedure

### 1. Build Command
Use `cmd /c` to bypass PowerShell's script execution restrictions for the build process.

```powershell
cmd /c npm run build
```

### 2. Deployment Command
Use `cmd /c npx -y firebase-tools deploy` to ensure the latest deployment tools are used and that the executable is found and run correctly through the CMD shell.

```powershell
cmd /c npx -y firebase-tools deploy
```

> [!IMPORTANT]
> Always verify that the `dist` directory (or the project's output directory defined in `firebase.json`) exists and is populated before running the deploy command.

## Summary of Commands
- **Build**: `cmd /c npm run build`
- **Deploy**: `cmd /c npx -y firebase-tools deploy`
