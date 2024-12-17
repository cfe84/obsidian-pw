import { App, TFile } from "obsidian";
import * as React from "react";
import { Consts } from "src/domain/Consts";
import { TodoItem } from "src/domain/TodoItem";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";
import { ILogger } from "src/domain/ILogger";
import { TodoListComponent } from "./TodoListComponent";
import { PwEvent } from "src/events/PwEvent";
import { Sound } from "./SoundPlayer";

export interface PlanningTodoColumnDeps {
  app: App,
  settings: ProletarianWizardSettings,
  logger: ILogger,
}

export interface PlanningTodoColumnProps {
  icon: string,
  title: string,
  todos: TodoItem<TFile>[],
  onTodoDropped: ((todoId: string) => void) | null,
  hideIfEmpty: boolean,
  deps: PlanningTodoColumnDeps,
  substyle?: string,
  playSound?: PwEvent<Sound>,
}

const CLASSNAME_NORMAL = "";
const CLASSNAME_HOVER = "pw-planning-column-content--hover";

export function PlanningTodoColumn({icon, title, hideIfEmpty, onTodoDropped, todos, deps, substyle, playSound}: PlanningTodoColumnProps) {

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
    setHoverClassName(CLASSNAME_NORMAL);
    const todoId = ev.dataTransfer.getData(Consts.TodoItemDragType)
    if (todoId) {
      ev.preventDefault()
      if (onTodoDropped) {
        onTodoDropped(todoId)
      }
    }
  }

  if (hideIfEmpty && todos.length === 0) {
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
        <TodoListComponent 
          deps={deps}
          todos={todos}
          playSound={playSound}
        />
    </div>
  </div>
}