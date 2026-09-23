# 작업 스케줄러가 매일 실행하는 진입점. 결과는 logs\YYYY-MM-DD.log에 남는다.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
# 스케줄러 세션은 PATH가 짧을 수 있어 claude·npm 전역 경로를 앞에 붙인다.
$env:PATH = "$env:USERPROFILE\.local\bin;$env:APPDATA\npm;$env:PATH"
& node scripts/daily.mjs @args
exit $LASTEXITCODE
