import { PwEvent } from "./PwEvent"
import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { TFile } from "obsidian";

export type TodoFilter<T> = (TodoItem: TodoItem<T>) => boolean
export type OpenFileEvent<T> = ({ file: T, line: number, inOtherLeaf: boolean })

export interface TodoListEvents {
}