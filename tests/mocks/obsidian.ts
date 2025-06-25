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
	constructor(public name: string, public path: string) {}
}

export class TFolder {
	constructor(public name: string, public path: string) {}
}

export class Vault {
	getAbstractFileByPath = jest.fn();
	createFolder = jest.fn();
	create = jest.fn();
	read = jest.fn();
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

export class MarkdownView {
	getViewType = jest.fn();
	getDisplayText = jest.fn();
}

export class Component {
	load = jest.fn();
	unload = jest.fn();
}

export class ItemView extends Component {
	getViewType = jest.fn();
	getDisplayText = jest.fn();
	getIcon = jest.fn();
}
