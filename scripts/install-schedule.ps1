# 매일 09:20에 모닝 브리프를 생성·발행하는 Windows 작업을 등록한다.
#   등록/갱신: powershell -ExecutionPolicy Bypass -File scripts\install-schedule.ps1
#   시각 변경: ... -File scripts\install-schedule.ps1 -At 08:50
#   삭제:      ... -File scripts\install-schedule.ps1 -Remove
param(
  [string]$At = '09:20',
  [switch]$Remove
)
$ErrorActionPreference = 'Stop'
$TaskName = 'MorningBrief'

if ($Remove) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
  Write-Host "작업 '$TaskName'을 삭제했습니다."
  return
}

$runner = Join-Path $PSScriptRoot 'run-daily.ps1'
# --force: 새벽에 수동으로 만든 호가 있어도 아침 실행은 항상 최신 뉴스로 새로 만든다.
# 생성이 실패하면 기존 호 파일은 그대로 남는다.
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$runner`" --force" `
  -WorkingDirectory (Split-Path $PSScriptRoot -Parent)
$trigger = New-ScheduledTaskTrigger -Daily -At $At
# StartWhenAvailable: 09:20에 PC가 꺼져 있었으면 켜지는 즉시 실행한다.
# WakeToRun: 절전 중이면 깨워서 실행한다(전원 옵션에서 깨우기 타이머가 허용된 경우).
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew `
  -RestartCount 2 -RestartInterval (New-TimeSpan -Minutes 10)
# claude 로그인 정보가 사용자 세션에 있으므로 로그온한 사용자로 실행한다.
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal `
  -Description '모닝 브리프: 뉴스 수집 → Claude 편집 → GitHub Pages 발행' -Force | Out-Null
$info = Get-ScheduledTaskInfo -TaskName $TaskName
Write-Host "작업 '$TaskName' 등록 완료. 다음 실행: $($info.NextRunTime)"
