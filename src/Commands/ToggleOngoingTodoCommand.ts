import { LineOperations } from "../domain/LineOperations";
import { TodoStatus } from "../domain/TodoItem";
import { FileOperations } from "../domain/FileOperations";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { ObsidianFile } from "../infrastructure/ObsidianFile";
import { Command, Editor, Hotkey, MarkdownView, TFile, App } from "obsidian";
import { DateTime } from "luxon";

export class ToggleOngoingTodoCommand implements Command {
	constructor(
		private lineOperations: LineOperations,
		private settings?: ProletarianWizardSettings,
		private app?: App
	) {}

	id: string = "pw.toggle-ongoing-todo-command";
	name: string = "Mark todo as ongoing / unchecked";
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
				todo.todo.status === TodoStatus.InProgress
					? TodoStatus.Todo
					: TodoStatus.InProgress;
			line = this.lineOperations.setCheckmark(
				line,
				newStatus === TodoStatus.InProgress ? ">" : " "
			);
			editor.setLine(lineNumber, line);

			// Set started attribute when moving to InProgress status
			if (
				this.settings?.trackStartTime &&
				newStatus === TodoStatus.InProgress &&
				view.file &&
				this.app
			) {
				const fileOperations = new FileOperations(this.settings);
				const obsidianFile = new ObsidianFile(this.app, view.file);
				const todoWithFile = {
					...todo.todo,
					file: obsidianFile,
					line: lineNumber,
				};

				// Only set started attribute if it doesn't already exist
				if (
					!todoWithFile.attributes ||
					!todoWithFile.attributes[this.settings.startedAttribute]
				) {
					fileOperations
						.updateAttributeAsync(
							todoWithFile,
							this.settings.startedAttribute,
							DateTime.now().toISODate()
						)
						.then(() => {
							// File operations will handle the update
						})
						.catch(console.error);
				}
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
