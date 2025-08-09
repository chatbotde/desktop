const fs = require('fs');
const path = require('path');

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
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

if (fs.existsSync(frontendDist)) {
  console.log('Copying frontend files...');
  copyDir(frontendDist, appFrontend);
  console.log('Frontend files copied successfully!');
} else {
  console.error('Frontend dist folder not found. Please run "npm run build" in the frontend directory first.');
}
