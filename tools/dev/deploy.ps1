

$ErrorActionPreference = "Stop"

Write-Host "==> Obfuscate src\script.js -> assets\js\app.js"
node "$PSScriptRoot\..\build\obfuscate.js"
if ($LASTEXITCODE -ne 0) { throw "Obfuscate gagal" }

Write-Host "==> Deploy ke Vercel (production)"
vercel --prod --yes
