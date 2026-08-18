# Run as Administrator — allows SonicThinking Remote Pad LAN ports on Windows Firewall
$rules = @(
    @{ Name = "SonicThinking-RemotePad-TCP-8765"; Port = 8765 },
    @{ Name = "SonicThinking-RemotePad-TCP-8766"; Port = 8766 }
)

foreach ($rule in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "Rule already exists: $($rule.Name)"
        Set-NetFirewallRule -DisplayName $rule.Name -Profile Any -Enabled True -ErrorAction SilentlyContinue | Out-Null
        continue
    }

    New-NetFirewallRule `
        -DisplayName $rule.Name `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $rule.Port `
        -Profile Any | Out-Null

    Write-Host "Added firewall rule: $($rule.Name) (TCP $($rule.Port), all profiles)"
}

Write-Host "Done. Restart SonicThinking, refresh QR on PC, and re-scan on your phone."
