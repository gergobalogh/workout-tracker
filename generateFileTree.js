import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const IGNORED_FOLDERS = new Set([".git", ".idea", "node_modules", "dist", ".svelte-kit"]);

const INDENT = "│   ";
const BRANCH = "├── ";
const LAST_BRANCH = "└── ";

function walkDir(dirPath, prefix = "", isLast = true) {
	const name = path.basename(dirPath);
	const isRoot = prefix === "";
	let output = isRoot ? name + "/\n" : prefix + (isLast ? LAST_BRANCH : BRANCH) + name + "/\n";

	let items = fs.readdirSync(dirPath).filter((item) => {
		const fullPath = path.join(dirPath, item);
		const stat = fs.lstatSync(fullPath);
		const isDir = stat.isDirectory();
		return !(isDir && IGNORED_FOLDERS.has(item));
	});

	items = items.sort((a, b) => {
		const aIsDir = fs.lstatSync(path.join(dirPath, a)).isDirectory();
		const bIsDir = fs.lstatSync(path.join(dirPath, b)).isDirectory();
		return aIsDir === bIsDir ? a.localeCompare(b) : bIsDir - aIsDir;
	});

	const newPrefix = prefix + (isLast ? "    " : INDENT);

	items.forEach((item, index) => {
		const fullPath = path.join(dirPath, item);
		const isDirectory = fs.lstatSync(fullPath).isDirectory();
		const isLastItem = index === items.length - 1;

		if (isDirectory) {
			output += walkDir(fullPath, newPrefix, isLastItem);
		} else {
			output += newPrefix + (isLastItem ? LAST_BRANCH : BRANCH) + item + "\n";
		}
	});

	return output;
}

// Change this to the directory you want to map
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "");
const tree = walkDir(rootDir);

fs.writeFileSync("structure.txt", tree);
console.log("File structure written to structure.txt");
