import * as React from "react";
import { TodoItemComponent, TodoItemDisplayPreferences } from "./TodoItemComponent";
import { TodoItem } from "../domain/TodoItem";
import { App, TFile } from "obsidian";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";
import { ILogger } from "src/domain/ILogger";
import { PwEvent } from "src/events/PwEvent";
import { Sound } from "./SoundPlayer";

export interface TodoSubtasksContainerDeps {
  logger: ILogger,
  app: App,
  settings: ProletarianWizardSettings,
}

export interface TodoSubtasksContainerProps {
  subtasks?: TodoItem<TFile>[],
  deps: TodoSubtasksContainerDeps,
  playSound?: PwEvent<Sound>,
  displayPreferences: TodoItemDisplayPreferences,
  dontCrossCompleted?: boolean,
}

const foldedText = ` ▶`
const unfoldedText = " ▼"

export function TodoSubtasksContainer({subtasks, deps, playSound, dontCrossCompleted, displayPreferences}: TodoSubtasksContainerProps) {
  const [isFolded, setIsFolded] = React.useState(false);

  function foldText() {
    return subtasks && subtasks.length 
      ? isFolded ? foldedText : unfoldedText
      : "  "
  }

  function toggleSubElement() {
    setIsFolded(!isFolded);
  }

  function onClickFoldButton(evt: any) {
    if (evt.defaultPrevented) {
      return
    }
    evt.preventDefault()
    toggleSubElement()
  }

  return <>
    <span className="todo-sub" onClick={onClickFoldButton}>{foldText()}</span>
    {
      isFolded
      ? "" 
      : <div className="pw-todo-sub-container">
        {subtasks?.map(task => <TodoItemComponent 
          key={task.text} todo={task} deps={deps} playSound={playSound} dontCrossCompleted={dontCrossCompleted} displayPreferences={displayPreferences}/>)}
      </div>
    }
  </>;
}