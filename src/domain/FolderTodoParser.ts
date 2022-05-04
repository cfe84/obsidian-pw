import { IFile } from "./IFile";
import { FileTodoParser } from "./FileTodoParser";
import { ILogger } from "src/domain/ILogger";
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
}