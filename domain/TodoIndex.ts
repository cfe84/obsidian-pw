import { ILogger } from "ILogger";
import { FileTodoParser } from "./FileTodoParser";
import { FolderTodoParser } from "./FolderTodoParser";
import { IFile } from "./IFile";
import { ITodosInFiles } from "./ITodosInFiles";
import { TodoItem } from "./TodoItem";

export interface TodoIndexDeps<T> {
  fileTodoParser: FileTodoParser<T>;
  folderTodoParser: FolderTodoParser<T>;
  logger: ILogger;
}

export type TodosUpdatedHandler<T> = (items: TodoItem<T>[]) => Promise<void>;

export class TodoIndex<T> {
  files: ITodosInFiles<T>[] = [];
  get todos(): TodoItem<T>[] {
    return this.files.reduce((res, ts) => res.concat(ts.todos), [])
  }

  constructor(private deps: TodoIndexDeps<T>) { }

  filesLoaded(files: IFile<T>[]) {
    this.deps.folderTodoParser.ParseFilesAsync(files).then(todos => {
      this.files = todos;
      this.triggerUpdate();
    })
  }

  fileUpdated(file: IFile<T>) {
    this.deps.logger.debug(`TodoIndex: File updated: ${file.id}`)
    const index = this.findTodo(file);
    this.deps.fileTodoParser.parseMdFileAsync(file).then(todos => {
      this.files[index].todos = todos
      this.triggerUpdate();
    });
  }

  fileRenamed(id: string, file: IFile<T>) {
    this.deps.logger.debug(`TodoIndex: File renamed: ${id} to ${file.id}`)

    // Nothing needs to happen because files are updating themselves.
    // this.triggerUpdate();
  }

  fileDeleted(file: IFile<T>) {
    this.deps.logger.debug(`TodoIndex: File deleted: ${file.id}`)
    const index = this.findTodo(file);
    this.files.splice(index, 1);
    this.triggerUpdate();
  }

  fileCreated(file: IFile<T>) {
    this.deps.logger.debug(`TodoIndex: File created: ${file.id}`)
    this.deps.fileTodoParser.parseMdFileAsync(file).then(todos => {
      this.files.push({
        todos,
        file
      });
      this.triggerUpdate();
    })
  }

  private findTodo(file: IFile<T>) {
    const index = this.files.findIndex((todosInFile) => todosInFile.file.id === file.id)
    if (index < 0) {
      this.deps.logger.error(`Todos not found for file '${file.name}'`)
      throw Error(`TodoIndex: File not found in index: ${file}`)
    }
    return index
  }

  private triggerUpdate() {
    if (this.onUpdateAsync) {
      const todos = this.todos
      this.onUpdateAsync(todos).then(() => { })
    }
  }

  onUpdateAsync: TodosUpdatedHandler<T>;
}