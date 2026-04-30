const fs = require('fs');
const path = require('path');

const targetStr = /AskC Digital Web/g;
const replacementStr = "ASKC Digital Web";

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
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
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
    console.log(`Replaced in ${file}`);
  }
});

console.log(`Done. Replaced in ${replacedCount} files.`);
