import * as React from "react";
import { createRoot } from "react-dom/client";

import { TodoListEvents } from "../events/TodoListEvents";
import { App, TFile } from "obsidian";
import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { DateTime } from "luxon";

export interface TodoListViewComponentProps {
  events: TodoListEvents, 
  todos: TodoItem<TFile>[], 
  app: App, 
  settings: ProletarianWizardSettings
}


function getSelectedTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
  return todos.filter(todo => !!todo.attributes[this.settings.selectedAttribute])
}

function getDueTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
  const todoIsDue = (todo: TodoItem<TFile>) => {
    if (
      todo.status === TodoStatus.Complete ||
      todo.status === TodoStatus.Canceled ||
      !todo.attributes ||
      !todo.attributes[this.settings.dueDateAttribute]
    )
      return false;
    try {
      const date = DateTime.fromISO(`${todo.attributes[this.settings.dueDateAttribute]}`);
      return date < now;
    } catch (err) {
      // this.deps.logger.error(`Error while parsing date: ${err}`);
      return false;
    }
  }
  const now = DateTime.now();
  const todosWithOverdueDate = todos.filter(
    (todo) => todo.attributes && todoIsDue(todo)
  );
  return todosWithOverdueDate
}

export function TodoListViewComponent({events, todos: initialTodos, app, settings}: TodoListViewComponentProps) {
  const [todos, setTodos] = React.useState<TodoItem<TFile>[]>(initialTodos);

  return <div className="pw-todo-panel">
    <b>Selected:</b>
    <TodoListViewComponent todos={getSelectedTodos(todos)} app={app} events={events} settings={settings}/>
    <b>Due:</b>
    <TodoListViewComponent todos={getDueTodos(todos)} app={app} events={events} settings={settings}/>
    <b>All:</b>
    <TodoListViewComponent todos={todos} app={app} events={events} settings={settings}/>
  </div>
}

export function MountListComponent(onElement: HTMLElement, props: TodoListViewComponentProps) {
  const root = createRoot(onElement);
  root.render(<TodoListViewComponent {...props}></TodoListViewComponent>);
}