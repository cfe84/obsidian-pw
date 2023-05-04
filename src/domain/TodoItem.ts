import { IDictionary } from "./IDictionary";
import { IFile } from "./IFile";

export enum TodoStatus {
  AttentionRequired = 0,
  Todo = 1,
  InProgress = 2,
  Delegated = 3,
  Complete = 4,
  Canceled = 5,
}

export interface TodoItem<TFile> {
  status: TodoStatus
  text: string
  file: IFile<TFile>
  folderType?: string
  project?: string
  attributes?: IDictionary<string | boolean>
  line?: number
  subtasks?: TodoItem<TFile>[]
}

export function getTodoId<T>(todo: TodoItem<T>) {
  return todo.file.id + "-" + todo.text
}