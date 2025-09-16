import { LineOperations } from "../domain/LineOperations";
import { TodoStatus } from "../domain/TodoItem";
import { FileOperations } from "../domain/FileOperations";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { ObsidianFile } from "../infrastructure/ObsidianFile";
import { Command, Editor, Hotkey, MarkdownView, TFile, App } from "obsidian";
import { DateTime } from "luxon";

export class ToggleTodoCommand implements Command {
	constructor(
		private lineOperations: LineOperations,
		private settings?: ProletarianWizardSettings,
		private app?: App
	) {}

	id: string = "pw.toggle-todo-command";
	name: string = "Mark todo as checked / unchecked";
	icon?: string = "check-small";
	mobileOnly?: boolean = false;
	callback?: () => any;
	checkCallback?: (checking: boolean) => boolean | void;
	editorCallback(editor: Editor, view: MarkdownView) {
		const lineNumber = editor.getCursor("from").line;
		let line = editor.getLine(lineNumber);
		const todo = this.lineOperations.toTodo(line, lineNumber);
		if (todo.isTodo) {
			const newStatus =
				todo.todo.status === TodoStatus.Complete
					? TodoStatus.Todo
					: TodoStatus.Complete;
			line = this.lineOperations.setCheckmark(
				line,
				newStatus === TodoStatus.Complete ? "x" : " "
			);
			editor.setLine(lineNumber, line);

			// Set completed attribute when marking as complete
			if (view.file && this.app && this.settings) {
				const fileOperations = new FileOperations(this.settings);
				const obsidianFile = new ObsidianFile(this.app, view.file);
				const todoWithFile = {
					...todo.todo,
					file: obsidianFile,
					line: lineNumber,
				};

				// Set completed attribute based on new status
				const completedAttributeValue =
					newStatus === TodoStatus.Complete
						? DateTime.now().toISODate()
						: undefined;
				fileOperations
					.updateAttributeAsync(
						todoWithFile,
						this.settings.completedDateAttribute,
						completedAttributeValue
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
