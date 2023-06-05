import * as React from "react";
import { IDictionary } from "../domain/IDictionary";
import { TodoItem, TodoStatus, getTodoId } from "../domain/TodoItem";
import { App, TFile } from "obsidian";
import { TodoItemComponent } from "./TodoItemComponent";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { ILogger } from "../domain/ILogger";
import { PwEvent } from "src/events/PwEvent";
import { Sound } from "./SoundPlayer";

function getPriorityValue(todo: TodoItem<TFile>): number {
  if (!todo.attributes || !todo.attributes["priority"]) {
    return 0
  }
  const priority = todo.attributes["priority"] as string
  const priorities: IDictionary<number> = {
    critical: 10,
    high: 9,
    medium: 5,
    low: 3,
    lowest: -1,
  }
  return priorities[priority] || 0
};

function getStatusValue(todo: TodoItem<TFile>): number {
  switch (todo.status) {
    case TodoStatus.Canceled:
      return 0
    case TodoStatus.Complete:
      return 1
    default:
      return 10
  }
}

function sortTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
  if (!todos) {
    return []
  }
  return todos.sort((a, b) => {
    const statusDiff = getStatusValue(b) - getStatusValue(a);
    if (statusDiff) {
      return statusDiff
    }
    const priorityDiff = getPriorityValue(b) - getPriorityValue(a);
    if (!priorityDiff) {
      return a.text.toLocaleLowerCase().localeCompare(b.text.toLocaleLowerCase())
    }
    return priorityDiff
  })
}

export interface TodoListComponentDeps {
  logger: ILogger,
  app: App, 
  settings: ProletarianWizardSettings,
}

export interface TodoListComponentProps {
  todos: TodoItem<TFile>[], 
  deps: TodoListComponentDeps,
  playSound?: PwEvent<Sound>,
}

export function TodoListComponent({todos, deps, playSound}: TodoListComponentProps) {
  const sortedTodos = sortTodos(todos);
  return <div>
    {sortedTodos.map(todo => <TodoItemComponent todo={todo} key={getTodoId(todo)} deps={deps} playSound={playSound}/>)}
  </div>;
}