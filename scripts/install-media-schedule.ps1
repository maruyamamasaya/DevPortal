$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$refreshScript = Join-Path $projectRoot 'scripts\refresh-media.mjs'
$nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
$taskName = 'Local Dev Hub - Web media refresh'
$action = New-ScheduledTaskAction -Execute $nodeExecutable -Argument ('"{0}"' -f $refreshScript) -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 30)
$principal = New-ScheduledTaskPrincipal -UserId ([Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Refresh Web screenshots and connection observations, plus responsive local app screenshots, every 30 minutes.' -Force | Out-Null
Write-Output "Installed scheduled task: $taskName"
