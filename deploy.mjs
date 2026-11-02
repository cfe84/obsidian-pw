import { copyFileSync, mkdirSync, readFileSync, statSync } from "fs";
import { homedir } from "os";
import path from "path";

const obsidianPath = process.env.OBSIDIAN_PATH;

if (!obsidianPath) {
	throw new Error("OBSIDIAN_PATH must be set to the Obsidian vault path");
}

function expandHome(input) {
	if (input === "~") {
		return homedir();
	}

	if (input.startsWith("~/")) {
		return path.join(homedir(), input.slice(2));
	}

	return input;
}

const vaultPath = path.resolve(expandHome(obsidianPath));
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const obsidianConfigPath = path.join(vaultPath, ".obsidian");
const pluginPath = path.join(vaultPath, ".obsidian", "plugins", manifest.id);

if (!statSync(vaultPath, { throwIfNoEntry: false })?.isDirectory()) {
	throw new Error(`OBSIDIAN_PATH does not exist or is not a directory: ${vaultPath}`);
}

if (!statSync(obsidianConfigPath, { throwIfNoEntry: false })?.isDirectory()) {
	throw new Error(`OBSIDIAN_PATH is not an Obsidian vault: ${obsidianConfigPath} does not exist`);
}

mkdirSync(pluginPath, { recursive: true });

for (const fileName of ["manifest.json", "main.js", "styles.css"]) {
	copyFileSync(fileName, path.join(pluginPath, fileName));
}

console.log(`Deployed to ${pluginPath}`);
