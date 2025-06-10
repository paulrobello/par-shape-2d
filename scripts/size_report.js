#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Get all files recursively from a directory
 * @param {string} dir - Directory path
 * @param {string[]} fileList - Array to store file paths
 * @returns {string[]} Array of file paths
 */
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Get file size in bytes
 * @param {string} filePath - Path to file
 * @returns {number} File size in bytes
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Calculate estimated token count (4 bytes per token)
 * @param {number} sizeInBytes - File size in bytes
 * @returns {number} Estimated token count
 */
function calculateTokens(sizeInBytes) {
  return Math.ceil(sizeInBytes / 4);
}

/**
 * Generate markdown size report
 */
function generateSizeReport() {
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('Error: src directory not found');
    process.exit(1);
  }
  
  const files = getAllFiles(srcDir);
  const fileData = [];
  
  files.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const sizeInBytes = getFileSize(filePath);
    const tokens = calculateTokens(sizeInBytes);
    
    fileData.push({
      name: relativePath,
      sizeInBytes,
      tokens
    });
  });
  
  // Sort by size in descending order
  fileData.sort((a, b) => b.sizeInBytes - a.sizeInBytes);
  
  // Generate markdown content
  let markdown = '# File Size Report\n\n';
  markdown += 'This report shows the size of all files in the `src` directory, sorted by size in descending order.\n\n';
  markdown += '| File | Size (bytes) | Size (tokens) |\n';
  markdown += '|------|--------------|---------------|\n';
  
  fileData.forEach(file => {
    markdown += `| ${file.name} | ${file.sizeInBytes.toLocaleString()} | ${file.tokens.toLocaleString()} |\n`;
  });
  
  markdown += '\n## Summary\n\n';
  const totalBytes = fileData.reduce((sum, file) => sum + file.sizeInBytes, 0);
  const totalTokens = fileData.reduce((sum, file) => sum + file.tokens, 0);
  
  markdown += `- **Total files:** ${fileData.length}\n`;
  markdown += `- **Total size:** ${totalBytes.toLocaleString()} bytes\n`;
  markdown += `- **Total tokens:** ${totalTokens.toLocaleString()}\n`;
  
  // Write to file
  const outputPath = path.join(process.cwd(), 'size_report.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');
  
  console.log(`Size report generated: ${outputPath}`);
  console.log(`Analyzed ${fileData.length} files`);
  console.log(`Total size: ${totalBytes.toLocaleString()} bytes (${totalTokens.toLocaleString()} tokens)`);
}

// Run the script
generateSizeReport();