import { IFile } from "./IFile";
import { ITodoParsingResult, LineOperations } from "./LineOperations";
import { TodoItem } from "./TodoItem";

export class FileTodoParser<TFile> {
	private lineOperations: LineOperations;
	constructor() {
		this.lineOperations = new LineOperations();
	}

	private createTodoTreeStructure(
		lines: string[],
		parsingResults: ITodoParsingResult<TFile>[]
	) {
		// A stack of parents, grandparents, etc. The higher the index, the shallower the parent.
		let parentStack: ITodoParsingResult<TFile>[] = [];
		const parent = () => parentStack[parentStack.length - 1];
		const pushParent = (parent: ITodoParsingResult<TFile>) =>
			parentStack.push(parent);
		const popParent = () => parentStack.pop();
		parsingResults.forEach((current, i) => {
			// Ignore empty lines
			if (lines[current.lineNumber].match(/^\s*$/)) {
				return;
			}

			// Come back: decrease to the last parent that is shallower than the current todo.
			while (parent() && current.indentLevel <= parent().indentLevel) {
				popParent();
			}

			// Add as subtask of the last task having a lower indent level.
			if (parent() && current.isTodo) {
				if (!parent().todo!.subtasks) {
					parent().todo!.subtasks = [];
				}
				parent().todo!.subtasks.push(current.todo!);
			}

			// Add todo as a potential parent.
			if (current.isTodo) {
				pushParent(current);
			}
		});
	}

	private removeSubtasksFromTree(todos: TodoItem<TFile>[]) {
		const toRemove = [];
		for (let i = 0; i < todos.length; i++) {
			const todo = todos[i];
			if (todo.subtasks) {
				toRemove.push(...todo.subtasks);
			}
		}
		toRemove.forEach((subtask) => {
			const idx = todos.findIndex((t) => t === subtask);
			todos.splice(idx, 1);
		});
	}

	public async parseMdFileAsync(
		file: IFile<TFile>
	): Promise<TodoItem<TFile>[]> {
		const content = await file.getContentAsync();
		const lines = content.split("\n");
		const parsingResults = lines.map((line, number) =>
			this.lineOperations.toTodo<TFile>(line, number)
		);
		// this.createTodoTreeStructure(lines, parsingResults)
		const todoParsingResults = parsingResults.filter(
			(todoParsingResult) => todoParsingResult.isTodo
		);
		this.createTodoTreeStructure(lines, todoParsingResults);
		const todos = todoParsingResults.map((result) => result.todo);
		// const inspectionResults = this.fileInspector.inspect(file)
		todos.forEach((todo) => {
			todo.file = file;
			// todo.project = (todo.attributes && todo.attributes.project) ? todo.attributes.project as string : inspectionResults.project
			// todo.folderType = inspectionResults.containingFolderType
		});
		this.removeSubtasksFromTree(todos);
		return todos;
	}
}
