import { IFile } from "./IFile";
import { FileTodoParser } from "./FileTodoParser";
import { ILogger } from "ILogger";
import { ITodosInFiles } from "./ITodosInFiles";

export interface IFolderTodoParserDeps<TFile> {
  fileTodoParser: FileTodoParser<TFile>
  logger: ILogger
}

export class FolderTodoParser<TFile> {

  constructor(private deps: IFolderTodoParserDeps<TFile>) {
  }

  private async ParseFileAsync(file: IFile<TFile>): Promise<ITodosInFiles<TFile>> {
    const todos = await this.deps.fileTodoParser.parseMdFileAsync(file);
    return {
      todos,
      file,
    }
  }

  public async ParseFilesAsync(files: IFile<TFile>[]): Promise<ITodosInFiles<TFile>[]> {
    const startTime = Date.now()
    this.deps.logger.debug(`Loading ${files.length} files`);
    const todosByFile = await Promise.all(files.map((file) => this.ParseFileAsync(file)))
    this.deps.logger.debug(`Loaded ${todosByFile.length} todos in ${Date.now() - startTime}ms`)
    return todosByFile
  }

  // private findFolderTodos(folder: string): TodoItem[] {
  //   if (folder === this.context.templatesFolder) {
  //     return []
  //   }
  //   const files = this.deps.fs.readdirSync(folder)
  //   const todos = files
  //     .map(file => this.deps.path.join(folder, file))
  //     .map((file) =>
  //       this.deps.fs.lstatSync(file).isDirectory() ?
  //         this.findFolderTodos(file) :
  //         this.parseFile(file)
  //     )
  //     .reduce((prev, curr) => {
  //       prev = prev.concat(curr)
  //       return prev
  //     }, [])
  //   return todos
  // }

  // public parseFolder(folder: string): ParsedFolder {
  //   const todos = this.findFolderTodos(folder)
  //   const attributes: IDictionary<string[]> = {}
  //   todos.forEach(todo => {
  //     if (!todo.attributes) {
  //       return
  //     }
  //     const todoAttributes = todo.attributes
  //     Object.keys(todoAttributes).forEach(attribute => {
  //       if (!attributes[attribute]) {
  //         attributes[attribute] = []
  //       }
  //       if (todoAttributes[attribute] !== true && attributes[attribute].indexOf(todoAttributes[attribute] as string) < 0) {
  //         attributes[attribute].push(todoAttributes[attribute] as string)
  //       }
  //     })
  //   })

  //   const parsedFolder: ParsedFolder = {
  //     todos,
  //     attributes: Object.keys(attributes).sort((a, b) => a.localeCompare(b)),
  //     attributeValues: attributes
  //   }
  //   if (!attributes["project"]) {
  //     attributes["project"] = []
  //   }
  //   if (!attributes["selected"]) {
  //     attributes["selected"] = []
  //   }
  //   todos.forEach(todo => {
  //     if (todo.project !== undefined && !attributes["project"].find(value => value === todo.project)) {
  //       attributes["project"].push(todo.project)
  //     }
  //   })
  //   return parsedFolder
  // }
}