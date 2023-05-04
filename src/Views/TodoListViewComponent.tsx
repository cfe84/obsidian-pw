import * as React from "react";
import { createRoot } from "react-dom/client";
import { TodoListEvents } from "../events/TodoListEvents";
import { App, TFile } from "obsidian";
import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { DateTime } from "luxon";
import { TodoIndex } from "src/domain/TodoIndex";
import { ILogger } from "src/domain/ILogger";
import { TodoListComponent } from "./TodoListComponent";

export interface TodoListViewComponentDeps {
  todoIndex: TodoIndex<TFile>,
  logger: ILogger,
}

export interface TodoListViewComponentProps {
  events: TodoListEvents,
  app: App, 
  settings: ProletarianWizardSettings
  deps: TodoListViewComponentDeps,
}


export function TodoListViewComponent({events, app, settings, deps}: TodoListViewComponentProps) {
  const [todos, setTodos] = React.useState<TodoItem<TFile>[]>(deps.todoIndex.todos);

  React.useEffect(() => {
    deps.todoIndex.onUpdateEvent.listen(async (todos: TodoItem<TFile>[]) => {
      setTodos(todos.filter(todo =>
        todo.status !== TodoStatus.Complete
        && todo.status !== TodoStatus.Canceled));
    })
  }, [deps.todoIndex])

  function getSelectedTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
    return todos.filter(todo => todo.status !== TodoStatus.Complete && todo.status !== TodoStatus.Canceled && !!todo.attributes[settings.selectedAttribute])
  }
  
  function getDueTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
    const todoIsDue = (todo: TodoItem<TFile>) => {
      if (
        todo.status === TodoStatus.Complete ||
        todo.status === TodoStatus.Canceled ||
        !todo.attributes ||
        !todo.attributes[settings.dueDateAttribute]
      )
        return false;
      try {
        const date = DateTime.fromISO(`${todo.attributes[settings.dueDateAttribute]}`);
        return date < now;
      } catch (err) {
        deps.logger.error(`Error while parsing date: ${err}`);
        return false;
      }
    }
    const now = DateTime.now();
    const todosWithOverdueDate = todos.filter(
      (todo) => todo.attributes && todoIsDue(todo)
    );
    return todosWithOverdueDate
  }

  return <div className="pw-todo-panel">
    <b>Selected:</b>
    <TodoListComponent todos={getSelectedTodos(todos)} app={app} events={events} settings={settings}/>
    <b>Due:</b>
    <TodoListComponent todos={getDueTodos(todos)} app={app} events={events} settings={settings}/>
    <b>All:</b>
    <TodoListComponent todos={todos} app={app} events={events} settings={settings}/>
  </div>
}

export function MountListComponent(onElement: HTMLElement, props: TodoListViewComponentProps) {
  const root = createRoot(onElement);
  root.render(<TodoListViewComponent {...props}></TodoListViewComponent>);
}