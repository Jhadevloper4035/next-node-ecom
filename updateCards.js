const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/components/productCards');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const startIndex = content.indexOf('<div className="list-btn-main">');
  if (startIndex === -1) continue;
  
  // Find the matching closing div for list-btn-main
  let divCount = 0;
  let endIndex = -1;
  const substring = content.substring(startIndex);
  const divRegex = /<(\/?)div/g;
  let match;
  while ((match = divRegex.exec(substring)) !== null) {
    if (match[1] === '/') divCount--;
    else divCount++;
    if (divCount === 0) {
      endIndex = startIndex + match.index + 6;
      break;
    }
  }
  
  if (endIndex !== -1) {
    const originalChunk = content.substring(startIndex, endIndex);
    const replacementChunk = `<div className="list-btn-main">
          <Link
            href={product.slug ? \`/product/\${product.slug}\` : \`/product-detail/\${product.id}\`}
            className="btn-main-product"
          >
            View Product
          </Link>
        </div>`;
    
    // Check if Link is imported
    let newContent = content.replace(originalChunk, replacementChunk);
    if (!newContent.includes('import Link from "next/link";')) {
      newContent = newContent.replace('import React', 'import Link from "next/link";\nimport React');
    }
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
}
