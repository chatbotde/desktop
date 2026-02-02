const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy frontend dist to app directory
const frontendDist = path.join(__dirname, 'frontend', 'dist');
const appFrontend = path.join(__dirname, 'app-frontend');

console.log('=== Frontend Build Copy Process ===');
console.log(`Source: ${frontendDist}`);
console.log(`Destination: ${appFrontend}`);
console.log(`Source exists: ${fs.existsSync(frontendDist)}`);

if (fs.existsSync(frontendDist)) {
  // Remove existing app-frontend directory if it exists
  if (fs.existsSync(appFrontend)) {
    console.log('Removing existing app-frontend directory...');
    fs.rmSync(appFrontend, { recursive: true, force: true });
  }
  
  console.log('Copying frontend files...');
  copyDir(frontendDist, appFrontend);
  
  // Verify the copy was successful
  if (fs.existsSync(appFrontend)) {
    const indexHtmlPath = path.join(appFrontend, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      console.log('✓ Frontend files copied successfully!');
      console.log(`✓ index.html verified at: ${indexHtmlPath}`);
      
      // List files in app-frontend for verification
      const files = fs.readdirSync(appFrontend);
      console.log(`✓ Total files copied: ${files.length}`);
      console.log('=== Copy Process Complete ===');
    } else {
      console.error('✗ ERROR: index.html not found after copy!');
      process.exit(1);
    }
  } else {
    console.error('✗ ERROR: app-frontend directory was not created!');
    process.exit(1);
  }
} else {
  console.error('✗ ERROR: Frontend dist folder not found.');
  console.error('Please run "npm run build" in the frontend directory first.');
  console.error('Run: cd frontend && npm run build');
  process.exit(1);
}
