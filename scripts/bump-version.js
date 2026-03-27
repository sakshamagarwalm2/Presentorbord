const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const bumpType = args.includes('--major') ? 'major' 
               : args.includes('--minor') ? 'minor' 
               : 'patch';

const rootDir = path.resolve(__dirname, '..');
const packagePath = path.join(rootDir, 'package.json');
const readmePath = path.join(rootDir, 'README.md');

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
const currentVersion = packageJson.version;

const [major, minor, patch] = currentVersion.split('.').map(Number);

let newVersion;
switch (bumpType) {
    case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
    case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
    default:
        newVersion = `${major}.${minor}.${patch + 1}`;
}

packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

let readme = fs.readFileSync(readmePath, 'utf-8');
readme = readme.replace(/v\d+\.\d+\.\d+/g, `v${newVersion}`);
fs.writeFileSync(readmePath, readme);

console.log(`Version bumped: ${currentVersion} → ${newVersion} (${bumpType})`);
console.log(`Updated: package.json, README.md`);