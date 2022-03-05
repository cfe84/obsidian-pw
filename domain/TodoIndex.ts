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

export class TodoIndex<T> {
  items: ITodosInFiles<T>[] = [];

  constructor(private deps: TodoIndexDeps<T>) { }

  filesLoaded(files: IFile<T>[]) {
    this.deps.folderTodoParser.ParseFilesAsync(files).then(todos => {
      this.items = todos;
      this.triggerUpdate();
    })
  }

  fileUpdated(file: IFile<T>) {
    const index = this.findTodo(file);
    this.deps.fileTodoParser.parseMdFileAsync(file).then(todos => {
      this.items[index].todos = todos
    });
    this.triggerUpdate();
  }

  fileDeleted(file: IFile<T>) {
    const index = this.findTodo(file);
    this.items.splice(index, 1);
    this.triggerUpdate();
  }

  fileCreated(file: IFile<T>) {
    this.deps.fileTodoParser.parseMdFileAsync(file).then(todos => {
      this.items.push({
        todos,
        file
      });
      this.triggerUpdate();
    })
  }

  private findTodo(file: IFile<T>) {
    return this.items.findIndex((todosInFile) => todosInFile.file === file)
  }

  private triggerUpdate() {
    if (this.onUpdateAsync) {
      const todos = this.items.reduce((res, ts) => res.concat(ts.todos), [])
      this.onUpdateAsync(todos).then(() => { })
    }
  }

  onUpdateAsync: (items: TodoItem<T>[]) => Promise<void>;
}