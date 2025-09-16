// Mock implementation of Obsidian API for testing

export class App {
	vault = new Vault();
	workspace = {
		getLeaf: jest.fn(() => ({
			openFile: jest.fn(),
		})),
	};
}

export class TFile {
	public basename: string;
	constructor(public name: string, public path: string) {
		this.basename = name;
	}
}

export class TFolder {
	constructor(public name: string, public path: string) {}
}

export class Vault {
	getAbstractFileByPath = jest.fn();
	createFolder = jest.fn();
	create = jest.fn();
	read = jest.fn();
	adapter = {
		stat: jest.fn().mockResolvedValue({ mtime: Date.now() }),
	};
}

export class WorkspaceLeaf {
	openFile = jest.fn();
}

export class Plugin {
	app: App;
	constructor(app: App) {
		this.app = app;
	}
}

export class Setting {
	setName = jest.fn(() => this);
	setDesc = jest.fn(() => this);
	addText = jest.fn(() => this);
	addToggle = jest.fn(() => this);
	addDropdown = jest.fn(() => this);
}

export class SettingTab {
	constructor(public app: App, public plugin: Plugin) {}
	display = jest.fn();
	hide = jest.fn();
}

export class Modal {
	constructor(public app: App) {}
	open = jest.fn();
	close = jest.fn();
	onOpen = jest.fn();
	onClose = jest.fn();
}

export class Notice {
	constructor(message: string, timeout?: number) {}
}

export class Editor {
	getCursor = jest.fn();
	getLine = jest.fn();
	setLine = jest.fn();
}

export class MarkdownView {
	file?: TFile;
	getViewType = jest.fn();
	getDisplayText = jest.fn();
}
