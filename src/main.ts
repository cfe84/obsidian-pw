import { ConsoleLogger } from 'src/infrastructure/ConsoleLogger';
import { FolderTodoParser } from './domain/FolderTodoParser';
import { FileTodoParser } from './domain/FileTodoParser';
import { ILogger } from './domain/ILogger';
import { ObsidianFile } from './infrastructure/ObsidianFile';
import { App, MarkdownView, Plugin, PluginManifest, TFile } from 'obsidian';
import { TodoIndex } from './domain/TodoIndex';
import { ToggleTodoCommand } from './Commands/ToggleTodoCommand';
import { LineOperations } from './domain/LineOperations';
import { ToggleOngoingTodoCommand } from './Commands/ToggleOngoingTodoCommand';
import { ProletarianWizardSettingsTab } from './Views/ProletarianWizardSettingsTab';
import { DEFAULT_SETTINGS, ProletarianWizardSettings } from './domain/ProletarianWizardSettings';
import { CompleteLineCommand } from './Commands/CompleteLineCommand';
import { PlanningView } from './Views/PlanningView';
import { OpenPlanningCommand } from './Commands/OpenPlanningCommand';
import { PwEvent } from './events/PwEvent';
import { TodoListView } from './Views/TodoListView';
import { OpenFileEvent } from './events/TodoListEvents';
import { TodoReportView } from './Views/TodoReportView';
import { OpenReportCommand } from './Commands/OpenReportCommand';

export default class ProletarianWizard extends Plugin {
	logger: ILogger = new ConsoleLogger();
	settings: ProletarianWizardSettings;
	fileTodoParser: FileTodoParser<TFile> = new FileTodoParser();
	folderTodoParser: FolderTodoParser<TFile>;
	todoIndex: TodoIndex<TFile>;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.openFileAsync = this.openFileAsync.bind(this);
	}

	async onload() {
		this.logger.info(`Loading PW`)
		await this.loadSettings();

		this.folderTodoParser = new FolderTodoParser({ fileTodoParser: this.fileTodoParser, logger: this.logger })
		this.todoIndex = new TodoIndex({ fileTodoParser: this.fileTodoParser, folderTodoParser: this.folderTodoParser, logger: this.logger }, this.settings)

		const openPlanningCommand = new OpenPlanningCommand(this.app.workspace);
		const openReportCommand = new OpenReportCommand(this.app.workspace);
		this.addCommand(new ToggleTodoCommand(new LineOperations()));
		this.addCommand(new CompleteLineCommand(new LineOperations()));
		this.addCommand(new ToggleOngoingTodoCommand(new LineOperations()));
		this.addCommand(openPlanningCommand);
		this.addCommand(openReportCommand);
		this.addSettingTab(new ProletarianWizardSettingsTab(this.app, this));

		if (this.settings.buttonInLeftBar) {
			this.logger.debug(`Adding button to left bar`)
			this.addRibbonIcon("calendar-glyph", "Open planning", (evt) => {
				openPlanningCommand.callback()
			})
		}

		this.registerViews()
		this.registerEvents()

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

	private registerViews() {
		this.registerView(TodoListView.viewType, (leaf) => {
			let view = new TodoListView(leaf, { logger: this.logger }, this.todoIndex, this.settings)
			view.render();
			return view;
		});

		this.registerView(PlanningView.viewType, (leaf) => {
			const view = new PlanningView({ logger: this.logger, todoIndex: this.todoIndex }, this.settings, leaf)
			view.render();
			return view;
		});

		this.registerView(TodoReportView.viewType, (leaf) => {
			const view = new TodoReportView(leaf, { logger: this.logger, todoIndex: this.todoIndex }, this.settings);
			view.render();
			return view;
		})
	}

	private registerEvents() {
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
	}

	private async openFileAsync(fileAndLine: OpenFileEvent<TFile>) {
		const { file, line, inOtherLeaf } = fileAndLine
		let leaf = this.app.workspace.activeLeaf
		if (inOtherLeaf) {
			leaf = this.app.workspace.splitActiveLeaf("vertical")
		} else if (leaf.getViewState().pinned) {
			leaf = this.app.workspace.getUnpinnedLeaf()
		}
		await leaf.openFile(file)
		let view = this.app.workspace.getActiveViewOfType(MarkdownView)
		const lineContent = await view.editor.getLine(line)
		view.editor.setSelection({ ch: 0, line }, { ch: lineContent.length, line })
	}

	private loadFiles() {
		setTimeout(() => {
			const files = this.app.vault.getMarkdownFiles().map(file => new ObsidianFile(this.app, file));
			this.todoIndex.filesLoaded(files);
		}, 50)
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