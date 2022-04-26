import { IFile } from "./IFile"
import { ITodoParsingResult, LineOperations } from "./LineOperations"
import { TodoItem } from "./TodoItem"

export class FileTodoParser<TFile> {
  private lineOperations: LineOperations
  constructor() {
    this.lineOperations = new LineOperations()
  }

  private createTodoTreeStructure(lines: string[], parsingResults: ITodoParsingResult<TFile>[]) {
    let parentStack: ITodoParsingResult<TFile>[] = []
    const getParent = () => parentStack[parentStack.length - 1]
    let lastVisitedTodo: ITodoParsingResult<TFile> | undefined
    parsingResults.forEach((current, i) => {
      if (!lastVisitedTodo) {
        if (current.isTodo) {
          lastVisitedTodo = current
        }
        return
      }

      if (lines[i].match(/^\s*$/)) {
        return
      }

      const isDeeperThanLastTodo = ((current.indentLevel as number) > (lastVisitedTodo.indentLevel as number))
      if (isDeeperThanLastTodo) {
        if (current.isTodo) {
          parentStack.push(lastVisitedTodo);
          (lastVisitedTodo.todo as TodoItem<TFile>).subtasks = [current.todo as TodoItem<TFile>]
        }
      } else {
        const isDeeperThanParent = () => ((current.indentLevel as number) > (getParent().indentLevel as number))
        while (getParent() && !isDeeperThanParent()) {
          parentStack.pop()
        }
        if (getParent() && current.isTodo) {
          (getParent().todo as TodoItem<TFile>).subtasks?.push(current.todo as TodoItem<TFile>)
        }
      }
      if (current.isTodo) {
        lastVisitedTodo = current
      }
    })
  }

  private removeSubtasksFromTree(todos: TodoItem<TFile>[]) {
    const toRemove = []
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i]
      if (todo.subtasks) {
        toRemove.push(...todo.subtasks)
      }
    }
    toRemove.forEach(subtask => {
      const idx = todos.findIndex(t => t === subtask)
      todos.splice(idx, 1)
    })
  }

  public async parseMdFileAsync(file: IFile<TFile>): Promise<TodoItem<TFile>[]> {
    const content = await file.getContentAsync();
    const lines = content.split("\n")
    const parsingResults = lines.map((line, number) => this.lineOperations.toTodo<TFile>(line, number))
    // this.createTodoTreeStructure(lines, parsingResults)
    const todoParsingResults = parsingResults
      .filter(todoParsingResult => todoParsingResult.isTodo);
    this.createTodoTreeStructure(lines, todoParsingResults);
    const todos = todoParsingResults.map(result => result.todo) as TodoItem<TFile>[]
    // const inspectionResults = this.fileInspector.inspect(file)
    todos.forEach((todo) => {
      todo.file = file
      // todo.project = (todo.attributes && todo.attributes.project) ? todo.attributes.project as string : inspectionResults.project
      // todo.folderType = inspectionResults.containingFolderType
    })
    this.removeSubtasksFromTree(todos)
    return todos
  }
}