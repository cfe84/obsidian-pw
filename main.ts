import { ConsoleLogger } from 'ConsoleLogger';
import { FolderTodoParser } from './domain/FolderTodoParser';
import { FileTodoParser } from './domain/FileTodoParser';
import { ILogger } from 'ILogger';
import { ObsidianFile } from './infrastructure/ObsidianFile';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginManifest, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { TodoListView } from './Views/TodoListView';
import { TodoIndex } from './domain/TodoIndex';
import { ToggleTodoCommand } from './Commands/ToggleTodoCommand';
import { LineOperations } from './domain/LineOperations';
import { CreateDailyNoteCommand } from 'Commands/CreateDailyNote';
import { PwPrefs } from 'PwPrefs';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	logger: ILogger = new ConsoleLogger();
	settings: MyPluginSettings;
	prefs: PwPrefs = { dailyNotes: { folder: "21 - Recurrence/daily-notes", template: "# Notes\n\n" } };
	fileTodoParser: FileTodoParser<TFile> = new FileTodoParser();
	folderTodoParser: FolderTodoParser<TFile> = new FolderTodoParser({ fileTodoParser: this.fileTodoParser, logger: this.logger });
	todoIndex = new TodoIndex({ fileTodoParser: this.fileTodoParser, folderTodoParser: this.folderTodoParser, logger: this.logger });

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.openFileAsync = this.openFileAsync.bind(this);
	}

	async onload() {
		this.logger.info(`Loading PW`)
		await this.loadSettings();

		this.addCommand(new ToggleTodoCommand(new LineOperations()));
		this.addCommand(new CreateDailyNoteCommand(this.prefs, this.app));

		// Add 
		// this.addSettingTab(new SampleSettingTab(this.app, this));


		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		this.registerView(TodoListView.viewType, (leaf) => {
			let view = new TodoListView(leaf, this.openFileAsync, { logger: this.logger })
			this.todoIndex.onUpdateAsync = async (items) => {
				view.onTodosChanged(items)
			}

			this.registerEvent(this.app.vault.on("modify", (file) => {
				this.todoIndex.fileUpdated(new ObsidianFile(this.app, file as TFile))
			}));

			this.registerEvent(this.app.vault.on("create", (file) => {
				this.todoIndex.fileCreated(new ObsidianFile(this.app, file as TFile))
			}));

			this.registerEvent(this.app.vault.on("delete", (file) => {
				this.todoIndex.fileDeleted(new ObsidianFile(this.app, file as TFile))
			}));
			this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
				this.todoIndex.fileRenamed(oldPath, new ObsidianFile(this.app, file as TFile))
			}));

			view.render()
			return view
		});

		this.app.workspace.onLayoutReady(() => {
			this.loadFiles()

			if (this.app.workspace.getLeavesOfType(TodoListView.viewType).length) {
				return;
			}
			this.app.workspace.getRightLeaf(false).setViewState({
				type: TodoListView.viewType,
			});
		})

	}

	private async openFileAsync(file: TFile, line: number) {
		await this.app.workspace.activeLeaf.openFile(file)
		const view = this.app.workspace.getActiveViewOfType(MarkdownView)
		const lineContent = await view.editor.getLine(line)
		view.editor.setSelection({ ch: 0, line }, { ch: lineContent.length, line })
	}

	private loadFiles() {
		const files = this.app.vault.getMarkdownFiles().map(file => new ObsidianFile(this.app, file));
		this.todoIndex.filesLoaded(files);
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

}

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: MyPlugin;

// 	constructor(app: App, plugin: MyPlugin) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}

// 	display(): void {
// 		const { containerEl } = this;

// 		containerEl.empty();

// 		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('It\'s a secret')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					console.log('Secret: ' + value);
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));
// 	}
// }
