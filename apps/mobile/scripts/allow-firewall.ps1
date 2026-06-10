# Run PowerShell as Administrator:
#   cd apps\mobile\scripts
#   .\allow-firewall.ps1

$rules = @(
  @{ Name = "DateSpot Expo Metro 8081"; Port = 8081 },
  @{ Name = "DateSpot API 3000"; Port = 3000 }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Host "Rule already exists: $($rule.Name)"
    continue
  }

  New-NetFirewallRule `
    -DisplayName $rule.Name `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $rule.Port `
    -Profile Private,Public | Out-Null

  Write-Host "Added firewall rule: $($rule.Name) (TCP $($rule.Port))"
}

Write-Host "Done. Retry Expo Go on your iPhone."
