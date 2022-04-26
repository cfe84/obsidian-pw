import { IFile } from "./IFile";
import { TodoItem } from "./TodoItem";

export interface ITodosInFiles<TFile> {
  file: IFile<TFile>,
  todos: TodoItem<TFile>[]
}
