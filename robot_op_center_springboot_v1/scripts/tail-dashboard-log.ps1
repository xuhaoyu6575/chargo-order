# UTF-8 跟踪 dashboard.log（必须 -Encoding utf8，否则中文乱码）
$logPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\logs\dashboard.log"))
if (-not (Test-Path -LiteralPath $logPath)) {
    Write-Error "未找到日志文件: $logPath"
    exit 1
}
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
Get-Content -LiteralPath $logPath -Encoding utf8 -Wait -Tail 40
