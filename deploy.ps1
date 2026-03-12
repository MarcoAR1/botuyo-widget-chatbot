# ==========================================
# BotUyo Widget Deploy (CDN + NPM)
# Run from widget project root:
#   .\deploy.ps1
#
# Deploys:
#   1. Build widget (ES + UMD + types)
#   2. Publish to NPM
#   3. Upload to Cloudflare R2 CDN
#      - /v{VERSION}/  (immutable, 1yr cache)
#      - /latest/      (mutable, 1hr cache)
# ==========================================

param(
    [switch]$SkipNpm,      # Skip npm publish
    [switch]$SkipCdn,      # Skip R2 upload
    [switch]$SkipBuild,    # Skip build (use existing dist/)
    [string]$BumpType = "patch"  # patch | minor | major
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ProjectRoot) { $ProjectRoot = $PWD.Path }
$R2Bucket = "chatbot-cdn"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  BotUyo Widget Deploy (CDN + NPM)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Project: $ProjectRoot"
Write-Host ""

# ─── Step 0: Version bump ─────────────────────────────────
Write-Host "[1/5] Bumping version ($BumpType)..." -ForegroundColor Yellow
$OldVersion = (Get-Content (Join-Path $ProjectRoot "package.json") | ConvertFrom-Json).version
Push-Location $ProjectRoot
npm version $BumpType --no-git-tag-version 2>&1 | Out-Null
$NewVersion = (Get-Content (Join-Path $ProjectRoot "package.json") | ConvertFrom-Json).version
Write-Host "  $OldVersion -> $NewVersion" -ForegroundColor Green

# ─── Step 1: Build ────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[2/5] Building widget..." -ForegroundColor Yellow
    $buildOutput = npm run build 2>&1
    # Check if build actually failed (not just warnings)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Build FAILED" -ForegroundColor Red
        Pop-Location
        exit 1
    }

    # Verify outputs
    $jsFile  = Join-Path $ProjectRoot "dist\botuyo-chat.umd.js"
    $cssFile = Join-Path $ProjectRoot "dist\botuyo-chat.umd.css"
    if (-not (Test-Path $jsFile)) {
        Write-Host "  ERROR: dist/botuyo-chat.umd.js not found" -ForegroundColor Red
        exit 1
    }
    $jsSize  = [math]::Round((Get-Item $jsFile).Length / 1KB)
    $cssSize = [math]::Round((Get-Item $cssFile).Length / 1KB)
    Write-Host "  Build OK - JS: ${jsSize}KB, CSS: ${cssSize}KB" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/5] Skipping build (--SkipBuild)" -ForegroundColor DarkGray
}

# ─── Step 2: NPM Publish ─────────────────────────────────
if (-not $SkipNpm) {
    Write-Host ""
    Write-Host "[3/5] Publishing to NPM..." -ForegroundColor Yellow
    npm publish --access public 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  NPM publish FAILED (non-fatal, continuing)" -ForegroundColor DarkYellow
    } else {
        Write-Host "  NPM published: @botuyo/chat-widget-standalone@$NewVersion" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "[3/5] Skipping NPM publish (--SkipNpm)" -ForegroundColor DarkGray
}

# ─── Step 3: Deploy to Cloudflare R2 ─────────────────────
if (-not $SkipCdn) {
    Write-Host ""
    Write-Host "[4/5] Deploying to Cloudflare R2..." -ForegroundColor Yellow

    # Check wrangler auth
    $wranglerCheck = npx -y wrangler whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Wrangler not authenticated. Run: npx -y wrangler login" -ForegroundColor Red
        exit 1
    }

    $distDir = Join-Path $ProjectRoot "dist"

    # --- Upload versioned path: /v{VERSION}/ (immutable, 1yr cache) ---
    Write-Host "  Uploading to /$R2Bucket/v$NewVersion/..." -ForegroundColor Cyan

    Get-ChildItem "$distDir\*.js" | ForEach-Object {
        $fname = $_.Name
        Write-Host "    $fname" -ForegroundColor DarkGray
        npx -y wrangler r2 object put "$R2Bucket/v$NewVersion/$fname" `
            --file $_.FullName `
            --content-type "application/javascript" `
            --cache-control "public, max-age=31536000, immutable" 2>&1 | Out-Null
    }

    Get-ChildItem "$distDir\*.css" | ForEach-Object {
        $fname = $_.Name
        Write-Host "    $fname" -ForegroundColor DarkGray
        npx -y wrangler r2 object put "$R2Bucket/v$NewVersion/$fname" `
            --file $_.FullName `
            --content-type "text/css" `
            --cache-control "public, max-age=31536000, immutable" 2>&1 | Out-Null
    }

    Write-Host "  v$NewVersion uploaded" -ForegroundColor Green

    # --- Upload latest path: /latest/ (mutable, 1hr cache) ---
    Write-Host "  Uploading to /$R2Bucket/latest/..." -ForegroundColor Cyan

    Get-ChildItem "$distDir\*.js" | ForEach-Object {
        $fname = $_.Name
        npx -y wrangler r2 object put "$R2Bucket/latest/$fname" `
            --file $_.FullName `
            --content-type "application/javascript" `
            --cache-control "public, max-age=3600" 2>&1 | Out-Null
    }

    Get-ChildItem "$distDir\*.css" | ForEach-Object {
        $fname = $_.Name
        npx -y wrangler r2 object put "$R2Bucket/latest/$fname" `
            --file $_.FullName `
            --content-type "text/css" `
            --cache-control "public, max-age=3600" 2>&1 | Out-Null
    }

    # --- Upload widget.js alias (for cdn.botuyo.com/widget.js compatibility) ---
    $umdJs = Join-Path $distDir "botuyo-chat.umd.js"
    if (Test-Path $umdJs) {
        Write-Host "  Uploading widget.js alias..." -ForegroundColor Cyan
        npx -y wrangler r2 object put "$R2Bucket/widget.js" `
            --file $umdJs `
            --content-type "application/javascript" `
            --cache-control "public, max-age=3600" 2>&1 | Out-Null
        
        $umdCss = Join-Path $distDir "botuyo-chat.umd.css"
        if (Test-Path $umdCss) {
            npx -y wrangler r2 object put "$R2Bucket/widget.css" `
                --file $umdCss `
                --content-type "text/css" `
                --cache-control "public, max-age=3600" 2>&1 | Out-Null
        }
    }

    Write-Host "  /latest/ + /widget.js uploaded" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[4/5] Skipping CDN deploy (--SkipCdn)" -ForegroundColor DarkGray
}

# ─── Step 4: Git commit + tag ─────────────────────────────
Write-Host ""
Write-Host "[5/5] Git commit + tag..." -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    git add package.json package-lock.json 2>&1 | Out-Null
    git commit -m "release: v$NewVersion" --no-verify 2>&1 | Out-Null
    git tag "v$NewVersion" 2>&1 | Out-Null
    git push --no-verify 2>&1 | Out-Null
    git push origin "v$NewVersion" --no-verify 2>&1 | Out-Null
    Write-Host "  Tagged and pushed v$NewVersion" -ForegroundColor Green
} catch {
    Write-Host "  Git operations failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
}
Pop-Location

# ─── Summary ──────────────────────────────────────────────
Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Deploy Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "  Version:  v$NewVersion"
Write-Host "  NPM:      https://www.npmjs.com/package/@botuyo/chat-widget-standalone"
Write-Host "  CDN (v):  https://cdn-chatbot.botuyo.com/v$NewVersion/botuyo-chat.js"
Write-Host "  CDN (l):  https://cdn-chatbot.botuyo.com/latest/botuyo-chat.js"
Write-Host "  Widget:   https://cdn.botuyo.com/widget.js"
Write-Host ""
