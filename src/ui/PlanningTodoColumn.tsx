import { App, TFile } from "obsidian";
import * as React from "react";
import { Consts } from "src/domain/Consts";
import { TodoItem, TodoStatus } from "src/domain/TodoItem";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";
import { ILogger } from "src/domain/ILogger";
import { TodoListComponent } from "./TodoListComponent";
import { PwEvent } from "src/events/PwEvent";
import { Sound } from "./SoundPlayer";
import { PlanningSettings } from "./PlanningSettings";

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
  planningSettings: PlanningSettings,
  hideIfEmpty: boolean,
  deps: PlanningTodoColumnDeps,
  substyle?: string,
  playSound?: PwEvent<Sound>,
}

const CLASSNAME_NORMAL = "";
const CLASSNAME_HOVER = "pw-planning-column-content--hover";

export function PlanningTodoColumn({icon, title, planningSettings, onTodoDropped, todos, deps, substyle, playSound, hideIfEmpty}: PlanningTodoColumnProps) {
  const { settings } = deps;
  
  // Filter todos into three categories
  const selectedTodos = todos.filter(todo => todo.attributes && !!todo.attributes[settings.selectedAttribute]);
  const delegatedTodos = todos.filter(todo => todo.status === TodoStatus.Delegated && 
                                           (!todo.attributes || !todo.attributes[settings.selectedAttribute]));
  const regularTodos = todos.filter(todo => 
                                  (!todo.attributes || !todo.attributes[settings.selectedAttribute]) && 
                                  todo.status !== TodoStatus.Delegated);

  const hasSelectedTodos = selectedTodos.length > 0;
  const hasRegularTodos = regularTodos.length > 0;
  const hasDelegatedTodos = delegatedTodos.length > 0;

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
        {/* Selected todos section - displayed at the top */}
        {hasSelectedTodos && (
          <>
            <div className="pw-planning-subsection-title">📌 Selected</div>
            <TodoListComponent 
              deps={deps}
              todos={selectedTodos}
              playSound={playSound}
              displayPreferences={{showStartTime: planningSettings.showStartTime, showTags: planningSettings.showTags}}
            />
            {(hasRegularTodos || hasDelegatedTodos) && <div className="pw-planning-subsection-divider"></div>}
          </>
        )}
        
        {/* Regular todos - displayed in the middle */}
        {hasRegularTodos && (
          <TodoListComponent 
            deps={deps}
            todos={regularTodos}
            playSound={playSound}
            displayPreferences={{showStartTime: planningSettings.showStartTime, showTags: planningSettings.showTags}}
          />
        )}
        
        {/* Delegated todos section - displayed at the bottom */}
        {hasDelegatedTodos && (
          <>
            {hasRegularTodos && <div className="pw-planning-subsection-divider"></div>}
            <div className="pw-planning-subsection-title">👬 Delegated</div>
            <TodoListComponent 
              deps={deps}
              todos={delegatedTodos}
              playSound={playSound}
              displayPreferences={{showStartTime: planningSettings.showStartTime, showTags: planningSettings.showTags}}
            />
          </>
        )}
    </div>
  </div>
}