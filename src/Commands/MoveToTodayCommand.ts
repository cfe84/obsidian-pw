import { LineOperations } from "../domain/LineOperations";
import { TodoStatus } from "../domain/TodoItem";
import { FileOperations } from "../domain/FileOperations";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { ObsidianFile } from "../infrastructure/ObsidianFile";
import { Command, Editor, Hotkey, MarkdownView, TFile, App } from "obsidian";
import { DateTime } from "luxon";

export class MoveToTodayCommand implements Command {
	constructor(
		private lineOperations: LineOperations,
		private settings?: ProletarianWizardSettings,
		private app?: App
	) {}

	id: string = "pw-move-todo-to-today-command";
	name: string = "Mark todo to today";
	icon?: string = "dot";
	mobileOnly?: boolean = false;
	callback?: () => any;
	checkCallback?: (checking: boolean) => boolean | void;
	editorCallback(editor: Editor, view: MarkdownView) {
		const lineNumber = editor.getCursor("from").line;
		let line = editor.getLine(lineNumber);
		const todo = this.lineOperations.toTodo(line, lineNumber);
		if (todo.isTodo) {
			const dueDateAttribute = this.settings?.dueDateAttribute || "due";

			if (view.file && this.app) {
				const fileOperations = new FileOperations(this.settings);
				const obsidianFile = new ObsidianFile(this.app, view.file);
				const todoWithFile = {
					...todo.todo,
					file: obsidianFile,
					line: lineNumber,
				};

				fileOperations
					.updateAttributeAsync(
						todoWithFile,
						this.settings.dueDateAttribute,
						DateTime.now().toISODate()
					)
					.then(() => {
						// File operations will handle the update
					})
					.catch(console.error);
			}
		}
	}
	editorCheckCallback?: (
		checking: boolean,
		editor: Editor,
		view: MarkdownView
	) => boolean | void;
	hotkeys?: Hotkey[] = [];
}
