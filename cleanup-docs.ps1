# Advanced Cleanup - Optional Documentation Consolidation
# This script identifies potentially redundant documentation files
# Review carefully before running!

Write-Host "Analyzing documentation files..." -ForegroundColor Cyan
Write-Host ""

# Documentation files that might be redundant
$potentiallyRedundant = @{
    "chat-input" = @(
        "COMPLETE_IMPLEMENTATION_SUMMARY.md",
        "CLICKTHROUGH_INTEGRATION.md",
        "CLICK_THROUGH_GEOMETRY_DOCS.md",
        "CAPTURE_INTEGRATION_SUMMARY.md",
        "CHANGES_SUMMARY.md",
        "RESIZE_FIX_SUMMARY.md",
        "MCP_IMPLEMENTATION_SUMMARY.md",
        "FLOATING_CARDS_FIXES.md",
        "TEST_FLOATING_CARDS.md"
    )
    "launch-window" = @(
        "OPTIMIZATION_QUICK_REFERENCE.md",
        "PERFORMANCE_IMPROVEMENTS.md",
        "BEFORE_AFTER_COMPARISON.md"
    )
    "frontend" = @(
        "BEFORE_AFTER_COMPARISON.md",
        "ACTION_CHECKLIST.md",
        "IMPROVEMENTS_SUMMARY.md"
    )
}

Write-Host "Potentially Redundant Documentation:" -ForegroundColor Yellow
Write-Host ""

foreach ($folder in $potentiallyRedundant.Keys) {
    Write-Host "📁 $folder/" -ForegroundColor Cyan
    foreach ($file in $potentiallyRedundant[$folder]) {
        $fullPath = Join-Path $PSScriptRoot $folder $file
        if (Test-Path $fullPath) {
            $size = (Get-Item $fullPath).Length
            Write-Host "  - $file ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Gray
        }
    }
    Write-Host ""
}

Write-Host "Recommended Actions:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Review each file to see if information is still relevant"
Write-Host "2. Consider consolidating into main README files:"
Write-Host "   - chat-input/README.md"
Write-Host "   - launch-window/README.md"
Write-Host "   - frontend/README.md"
Write-Host ""
Write-Host "3. Keep these essential docs:"
Write-Host "   - README.md (main docs for each module)"
Write-Host "   - FEATURES.md (feature lists)"
Write-Host "   - TECHNICAL_IMPLEMENTATION.md (technical details)"
Write-Host "   - MCP_INTEGRATION_GUIDE.md (MCP setup)"
Write-Host ""
Write-Host "4. Archive old summaries and before/after comparisons if no longer needed"
Write-Host ""
Write-Host "To remove these files, uncomment the removal section below and run again." -ForegroundColor Yellow

# UNCOMMENT TO ACTUALLY REMOVE FILES
<#
Write-Host ""
Write-Host "Removing redundant documentation..." -ForegroundColor Yellow
foreach ($folder in $potentiallyRedundant.Keys) {
    foreach ($file in $potentiallyRedundant[$folder]) {
        $fullPath = Join-Path $PSScriptRoot $folder $file
        if (Test-Path $fullPath) {
            Remove-Item -Path $fullPath -Force
            Write-Host "  Removed: $folder/$file" -ForegroundColor Green
        }
    }
}
Write-Host "Documentation cleanup complete!" -ForegroundColor Green
#>
