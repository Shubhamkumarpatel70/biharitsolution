const fs = require('fs');
const path = require('path');

const targetStr = /askc web/gi;
const replacementStr = "AskC Digital Web";

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      // Exclude node_modules and build
      if (!file.includes('node_modules') && !file.includes('build')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html')) {
        results.push(file);
      }
    }
  });
  return results;
};

const files = walk(path.join(__dirname, 'frontend'));
let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (targetStr.test(content)) {
    // Some files might already have AskC Digital Web, but "AskC Digital Web" contains "AskC Web" if case insensitive?
    // "AskC Digital Web" does not contain "askc web". 
    // Wait! "askc digital web" does not contain "askc web", they are separated by " digital ".
    // So /askc web/gi will not match "AskC Digital Web".
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
    console.log(`Replaced in ${file}`);
  }
});

console.log(`Done. Replaced in ${replacedCount} files.`);
