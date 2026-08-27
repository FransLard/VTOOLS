# Deploy VelardTools ke Vercel (generate obfuscated script.js dulu, lalu deploy)
# Pakai:  .\deploy.ps1
$ErrorActionPreference = "Stop"

Write-Host "==> Obfuscate src\script.js -> script.js"
node obfuscate.js
if ($LASTEXITCODE -ne 0) { throw "Obfuscate gagal" }

Write-Host "==> Deploy ke Vercel (production)"
vercel --prod --yes
