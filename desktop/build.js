const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function buildIcon() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, 'build', 'icon.svg'));
  
  await sharp(svgBuffer)
    .resize(256, 256)
    .toFile(path.join(__dirname, 'build', 'icon.png'));
    
  console.log('Successfully generated icon.png');
}

buildIcon().catch(console.error);
