import { ConsoleLogger } from 'ConsoleLogger';
import { FolderTodoParser } from './domain/FolderTodoParser';
import { FileTodoParser } from './domain/FileTodoParser';
import { ILogger } from 'ILogger';
import { ObsidianFile } from './infrastructure/ObsidianFile';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginManifest, PluginSettingTab, Setting, TFile, Vault } from 'obsidian';
import { TodoListView } from './Views/TodoListView';
import { TodoIndex, TodosUpdatedHandler } from './domain/TodoIndex';
import { ToggleTodoCommand } from './Commands/ToggleTodoCommand';
import { LineOperations } from './domain/LineOperations';
import { ToggleOngoingTodoCommand } from './Commands/ToggleOngoingTodoCommand';
import { ProletarianWizardSettingsTab } from './Views/ProletarianWizardSettingsTab';
import { DEFAULT_SETTINGS, ProletarianWizardSettings } from './ProletarianWizardSettings';
import { CompleteLineCommand } from 'Commands/CompleteLineCommand';
import { PlanningView } from 'Views/PlanningView';
import { OpenPlanningCommand } from 'Commands/OpenPlanningCommand';
import { TodoItem } from 'domain/TodoItem';

export default class ProletarianWizard extends Plugin {
	logger: ILogger = new ConsoleLogger();
	settings: ProletarianWizardSettings;
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

		let todosUpdatedHandlers: TodosUpdatedHandler<TFile>[] = []

		this.addCommand(new ToggleTodoCommand(new LineOperations()));
		this.addCommand(new CompleteLineCommand(new LineOperations()));
		this.addCommand(new ToggleOngoingTodoCommand(new LineOperations()));
		this.addCommand(new OpenPlanningCommand(this.app.workspace))
		this.addSettingTab(new ProletarianWizardSettingsTab(this.app, this));

		this.todoIndex.onUpdateAsync = async (items) => {
			Promise.all(todosUpdatedHandlers.map(handler => handler(items)))
		}

		const events = { openFile: this.openFileAsync }

		this.registerView(TodoListView.viewType, (leaf) => {
			let view = new TodoListView(leaf, events, { logger: this.logger })
			todosUpdatedHandlers.push(async (items: TodoItem<TFile>[]) => {
				view.onTodosChanged(items)
			})
			view.render()
			return view
		});

		this.registerEvent(this.app.vault.on("modify", (file) => {
			if (file.path.endsWith(".md")) {
				this.todoIndex.fileUpdated(new ObsidianFile(this.app, file as TFile))
			}
		}));

		this.registerEvent(this.app.vault.on("create", (file) => {
			if (file.path.endsWith(".md")) {
				this.todoIndex.fileCreated(new ObsidianFile(this.app, file as TFile))
			}
		}));

		this.registerEvent(this.app.vault.on("delete", (file) => {
			if (file.path.endsWith(".md")) {
				this.todoIndex.fileDeleted(new ObsidianFile(this.app, file as TFile))
			}
		}));
		this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
			if (file.path.endsWith(".md")) {
				this.todoIndex.fileRenamed(oldPath, new ObsidianFile(this.app, file as TFile))
			}
		}));

		this.registerView(PlanningView.viewType, (leaf) => {
			const view = new PlanningView({ logger: this.logger, todoIndex: this.todoIndex }, events, leaf)
			todosUpdatedHandlers.push((items) => view.onTodosChanged(items))
			view.render()
			return view
		})

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