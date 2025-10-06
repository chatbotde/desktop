# Cleanup script for removing old/unused files
# Run this script from the buddy directory

Write-Host "Starting cleanup of old and unused files..." -ForegroundColor Cyan

# Files and folders to remove
$itemsToRemove = @(
    "index.html",
    "renderer.js",
    "preload.js",
    "test-clipboard-monitoring.js",
    "MODELS_SINGLE_SOURCE_SUMMARY.md",
    "MODEL_SELECTION_TEST.md",
    "CHAT_INPUT_GUIDE.md",
    "FLOATING_CHAT_SETUP.md",
    "QUICK_MCP_SETUP.md",
    "app-frontend"
)

foreach ($item in $itemsToRemove) {
    $fullPath = Join-Path $PSScriptRoot $item
    if (Test-Path $fullPath) {
        try {
            if (Test-Path $fullPath -PathType Container) {
                Write-Host "Removing directory: $item" -ForegroundColor Yellow
                Remove-Item -Path $fullPath -Recurse -Force
            } else {
                Write-Host "Removing file: $item" -ForegroundColor Yellow
                Remove-Item -Path $fullPath -Force
            }
            Write-Host "  Removed: $item" -ForegroundColor Green
        } catch {
            Write-Host "  Failed to remove: $item" -ForegroundColor Red
        }
    } else {
        Write-Host "  Already removed or not found: $item" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Cleanup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review the changes"
Write-Host "2. Run npm run build to rebuild the app"
Write-Host "3. Test the application to ensure everything works"
