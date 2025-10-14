# Cleanup script for chat-input folder
Write-Host "Starting chat-input folder cleanup..." -ForegroundColor Cyan

$chatInputPath = "C:\Users\yadav\OneDrive\Desktop\sonicplane\buddy\chat-input"

$filesToRemove = @(
    "CAPTURE_INTEGRATION_SUMMARY.md",
    "CHANGES_SUMMARY.md",
    "CLICKTHROUGH_INTEGRATION.md",
    "CLICK_THROUGH_GEOMETRY_DOCS.md",
    "COMPLETE_IMPLEMENTATION_SUMMARY.md",
    "DISPLAY_CARD_USAGE.md",
    "FEATURES.md",
    "FLOATING_CARDS_ENHANCEMENTS.md",
    "FLOATING_CARDS_FIXES.md",
    "FLOATING_CARDS_UX_GUIDE.md",
    "MCP_IMPLEMENTATION_SUMMARY.md",
    "MCP_INTEGRATION_GUIDE.md",
    "QUICK_REFERENCE.md",
    "QUICK_START_CARDS.md",
    "RESIZE_FIX_SUMMARY.md",
    "TECHNICAL_IMPLEMENTATION.md",
    "TEST_FLOATING_CARDS.md",
    "VISUAL_GUIDE.md"
)

$removed = @()
$notFound = @()

foreach ($file in $filesToRemove) {
    $filePath = Join-Path $chatInputPath $file
    if (Test-Path $filePath) {
        Remove-Item $filePath -Force
        $removed += $file
        Write-Host "  Removed: $file" -ForegroundColor Green
    } else {
        $notFound += $file
        Write-Host "  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Cleanup Summary:" -ForegroundColor Cyan
Write-Host "  Files removed: $($removed.Count)" -ForegroundColor Green
Write-Host "  Files not found: $($notFound.Count)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Essential files kept:" -ForegroundColor Cyan
Write-Host "  - README.md" -ForegroundColor Green
Write-Host "  - chat-input-window.js" -ForegroundColor Green
Write-Host "  - chat-input-preload.js" -ForegroundColor Green
Write-Host "  - chat-input.html" -ForegroundColor Green
Write-Host "  - capture/ folder" -ForegroundColor Green
Write-Host "  - css/ folder" -ForegroundColor Green
Write-Host "  - electron-api/ folder" -ForegroundColor Green
Write-Host "  - modules/ folder" -ForegroundColor Green
Write-Host "  - window/ folder" -ForegroundColor Green
Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Cyan
