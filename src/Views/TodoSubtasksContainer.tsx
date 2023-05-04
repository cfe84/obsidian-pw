import * as React from "react";
import { TodoItemComponent } from "./TodoItemComponent";
import { TodoItem } from "../domain/TodoItem";
import { App, TFile } from "obsidian";
import { TodoListEvents } from "../events/TodoListEvents";
import { ProletarianWizardSettings } from "../domain/ProletarianWizardSettings";

export interface TodoSubtasksContainerProps {
  subtasks?: TodoItem<TFile>[],
  events: TodoListEvents,
  app: App,
  settings: ProletarianWizardSettings,
}

const foldedText = ` ▶`
const unfoldedText = " ▼"

export function TodoSubtasksContainer({subtasks, events, app, settings}: TodoSubtasksContainerProps) {
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
          key={task.text} todo={task}  events={events} app={app} settings={settings}/>)}
      </div>
    }
  </>;
}