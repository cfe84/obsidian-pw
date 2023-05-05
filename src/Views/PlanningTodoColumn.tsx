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
  icon: string,
  title: string,
  todos: TodoItem<TFile>[],
  onTodoDropped: ((todoId: string) => void) | null,
  hideIfEmpty: boolean,
  filter: TodoFilter<TFile>,
  deps: PlanningTodoColumnDeps,
  substyle?: string,
}

const CLASSNAME_NORMAL = "";
const CLASSNAME_HOVER = "pw-planning-column-content--hover";

export function PlanningTodoColumn({icon, title, hideIfEmpty, onTodoDropped, todos, deps, filter, substyle}: PlanningTodoColumnProps) {

  const [hoverClassName, setHoverClassName] = React.useState(CLASSNAME_NORMAL);

  function onDragOver(ev: any) {
    ev.preventDefault()
  }

  function onDragEnter(ev: any) {
    setHoverClassName(CLASSNAME_HOVER);
  }

  function onDragLeave(ev: any) {
    setHoverClassName(CLASSNAME_NORMAL);
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

  return <div className={`pw-planning-column ${substyle ? `pw-planning-column--${substyle}` : ""}`}>
    <div className="pw-planning-column-title"><span className="pw-planning-column-title-icon">{icon}</span><span>{title}</span></div>
    <div 
      className={`pw-planning-column-content 
        ${substyle ? `pw-planning-column-content--${substyle}` : ""}
        ${hoverClassName}
        `}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      >
      {todoItems}
    </div>
  </div>
}