import { PwEvent } from "./PwEvent"
import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { TFile } from "obsidian";
import { TodoItemComponent } from "src/Views/TodoItemComponent";

export type TodoFilter<T> = (TodoItem: TodoItem<T>) => boolean
export type OpenFileEvent<T> = ({ file: T, line: number, inOtherLeaf: boolean })
export type CheckboxClickedEvent<T> = TodoItem<T>
export type DragEventParameters = { id: string, todo: TodoItemComponent }

export interface TodoListEvents {
  openFile: PwEvent<OpenFileEvent<TFile>>
  onCheckboxClicked: PwEvent<CheckboxClickedEvent<TFile>>,
  onDrag: PwEvent<DragEventParameters>
  onFilter: PwEvent<TodoFilter<TFile>>
}