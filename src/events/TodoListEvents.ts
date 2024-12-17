import { TodoItem, TodoStatus } from "../domain/TodoItem";

export type TodoFilter<T> = (TodoItem: TodoItem<T>) => boolean;
export type OpenFileEvent<T> = { file: T; line: number; inOtherLeaf: boolean };
