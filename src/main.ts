import { ConsoleLogger } from 'src/infrastructure/ConsoleLogger';
import { FolderTodoParser } from './domain/FolderTodoParser';
import { FileTodoParser } from './domain/FileTodoParser';
import { ILogger } from './domain/ILogger';
import { ObsidianFile } from './infrastructure/ObsidianFile';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginManifest, PluginSettingTab, Setting, TAbstractFile, TFile, Vault } from 'obsidian';
import { TodoIndex, TodosUpdatedHandler } from './domain/TodoIndex';
import { ToggleTodoCommand } from './Commands/ToggleTodoCommand';
import { LineOperations } from './domain/LineOperations';
import { ToggleOngoingTodoCommand } from './Commands/ToggleOngoingTodoCommand';
import { ProletarianWizardSettingsTab } from './Views/ProletarianWizardSettingsTab';
import { DEFAULT_SETTINGS, ProletarianWizardSettings } from './ProletarianWizardSettings';
import { CompleteLineCommand } from './Commands/CompleteLineCommand';
import { PlanningView } from './Views/PlanningView';
import { OpenPlanningCommand } from './Commands/OpenPlanningCommand';
import { TodoItem, TodoStatus } from './domain/TodoItem';
import { FileOperations } from './domain/FileOperations';
import { PwEvent } from './events/PwEvent';
import { TodoListView } from './Views/TodoListView';
import { CheckboxClickedEvent, DragEventParameters, OpenFileEvent, TodoFilter, TodoListEvents } from './events/TodoListEvents';
import { Archiver } from './archive/Archiver';
import { DateTime } from 'luxon';

export default class ProletarianWizard extends Plugin {
	logger: ILogger = new ConsoleLogger();
	settings: ProletarianWizardSettings;
	fileTodoParser: FileTodoParser<TFile> = new FileTodoParser();
	folderTodoParser: FolderTodoParser<TFile>;
	todoIndex: TodoIndex<TFile>;
	todosUpdatedHandlers: TodosUpdatedHandler<TFile>[] = []

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.openFileAsync = this.openFileAsync.bind(this);
		this.toggleCheckmarkAsync = this.toggleCheckmarkAsync.bind(this);
	}

	async onload() {
		this.logger.info(`Loading PW`)
		await this.loadSettings();

		this.folderTodoParser = new FolderTodoParser({ fileTodoParser: this.fileTodoParser, logger: this.logger })
		this.todoIndex = new TodoIndex({ fileTodoParser: this.fileTodoParser, folderTodoParser: this.folderTodoParser, logger: this.logger }, this.settings)

		const openPlanningCommand = new OpenPlanningCommand(this.app.workspace)
		this.addCommand(new ToggleTodoCommand(new LineOperations()));
		this.addCommand(new CompleteLineCommand(new LineOperations()));
		this.addCommand(new ToggleOngoingTodoCommand(new LineOperations()));
		this.addCommand(openPlanningCommand)
		this.addSettingTab(new ProletarianWizardSettingsTab(this.app, this));

		if (this.settings.buttonInLeftBar) {
			this.logger.debug(`Adding button to left bar`)
			this.addRibbonIcon("calendar-glyph", "Open planning", (evt) => {
				openPlanningCommand.callback()
			})
		}

		this.todoIndex.onUpdateAsync = async (items) => {
			Promise.all(this.todosUpdatedHandlers.map(handler => handler(items)))
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
		const events: TodoListEvents = {
			openFile: new PwEvent<OpenFileEvent<TFile>>(this.openFileAsync),
			onCheckboxClicked: new PwEvent<CheckboxClickedEvent<TFile>>(this.toggleCheckmarkAsync),
			onFilter: new PwEvent<TodoFilter<TFile>>(),
			onDrag: new PwEvent<DragEventParameters>()
		}
		this.registerView(TodoListView.viewType, (leaf) => {
			let view = new TodoListView(leaf, events, { logger: this.logger })
			this.todosUpdatedHandlers.push(async (items: TodoItem<TFile>[]) => {
				view.onTodosChanged(items)
			})
			view.render()
			return view
		});

		this.registerView(PlanningView.viewType, (leaf) => {
			const view = new PlanningView({ logger: this.logger, todoIndex: this.todoIndex }, events, leaf)
			this.todosUpdatedHandlers.push((items) => view.onTodosChanged(items))
			view.render()
			return view
		})
	}

	private registerEvents() {
		this.registerEvent(this.app.workspace.on("file-menu", (menu, f, source, leaf) => {
			const file = new ObsidianFile(this.app, f as TFile)
			const archiveFrom = this.settings.archiveFrom.length === 0
				? "/"
				: Archiver.getArchiveFrom(
					this.settings.archiveFrom,
					file)
			if (archiveFrom)
				menu.addItem((item) => {
					item.setTitle("Archive")
					item.setIcon("sheets-in-box")
					item.onClick((evt => {
						Archiver.archiveAsync(archiveFrom,
							this.settings.archiveFolder,
							file).then()
					}))
				})
			this.logger.info(source)
		}))

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

	private async toggleCheckmarkAsync(todo: TodoItem<TFile>) {
		const wasCompleted = todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled
		todo.status = wasCompleted ? TodoStatus.Todo : TodoStatus.Complete
		await FileOperations.updateTodoStatus(todo)
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