import * as React from "react";
import { IDictionary } from "../domain/IDictionary";
import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { App, TFile } from "obsidian";
import { TodoItemComponent } from "./TodoItemComponent";
import { TodoListEvents } from "../events/TodoListEvents";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";

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

export interface TodoListComponentProps {
  events: TodoListEvents, 
  todos: TodoItem<TFile>[], 
  app: App, 
  settings: ProletarianWizardSettings
}

export function TodoListComponent({events, todos, app, settings}: TodoListComponentProps) {
  const sortedTodos = sortTodos(todos);
  return <div>
    {sortedTodos.map(todo => <TodoItemComponent app={app} settings={settings} events={events} todo={todo} key={todo.text} />)}
  </div>;
}