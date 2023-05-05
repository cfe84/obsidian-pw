import { App, TFile } from "obsidian";
import * as React from "react";
import { Consts } from "src/domain/Consts";
import { TodoItem } from "src/domain/TodoItem";
import { TodoItemComponent } from "./TodoItemComponent";
import { TodoFilter, TodoListEvents } from "src/events/TodoListEvents";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";
import { ILogger } from "src/domain/ILogger";

export interface PlanningTodoColumnDeps {
  app: App,
  events: TodoListEvents,
  settings: ProletarianWizardSettings,
  logger: ILogger,
}

export interface PlanningTodoColumnProps {
  title: string,
  todos: TodoItem<TFile>[],
  onTodoDropped: ((todoId: string) => void) | null,
  hideIfEmpty: boolean,
  filter: TodoFilter<TFile>,
  deps: PlanningTodoColumnDeps,
  isToday: boolean,
}

const BORDERCOLOR_NORMAL = "#ddd";
const BORDERCOLOR_HOVER = "blue";

export function PlanningTodoColumn({title, hideIfEmpty, onTodoDropped, todos, deps, filter, isToday}: PlanningTodoColumnProps) {

  const [borderColor, setBorderColor] = React.useState(BORDERCOLOR_NORMAL);

  function onDragOver(ev: any) {
    ev.preventDefault()
  }

  function onDragEnter(ev: any) {
    setBorderColor(BORDERCOLOR_HOVER);
  }

  function onDragLeave(ev: any) {
    setBorderColor(BORDERCOLOR_NORMAL);
  }

  function onDrop(ev: any) {
    const todoId = ev.dataTransfer.getData(Consts.TodoItemDragType)
    if (todoId) {
      ev.preventDefault()
      if (onTodoDropped) {
        onTodoDropped(todoId)
      }
    }
  }

  const todoItems = todos.map(todo => <TodoItemComponent 
    events={deps.events}
    settings={deps.settings}
    todo={todo}
    key={todo.text}
    filter={filter}
    deps={deps}
  />);

  if (hideIfEmpty && todoItems.length === 0) {
    return <></>
  }

  return <div className={`pw-planning-column ${isToday ? "pw-planning-column--today" : ""}`}>
    <div className="pw-planning-column-title">{title}</div>
    <div 
      className={`pw-planning-column-content ${isToday ? "pw-planning-column-content--today" : ""}`}
      style={ {"borderColor": borderColor } }
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      >
      {todoItems}
    </div>
  </div>
}