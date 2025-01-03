import * as React from "react";
import { TodoItem, TodoStatus, getTodoId } from "../domain/TodoItem"
import { App, Menu, TFile } from "obsidian";
import { FileOperations } from "src/domain/FileOperations";
import { ILogger } from "src/domain/ILogger";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";
import { Sound } from "./SoundPlayer";
import { PwEvent } from "src/events/PwEvent";

function statusToIcon(status: TodoStatus): string {
  switch (status) {
    case TodoStatus.Complete:
      return "✔";
    case TodoStatus.AttentionRequired:
      return "❗";
    case TodoStatus.Canceled:
      return "❌";
    case TodoStatus.Delegated:
      return "👬";
    case TodoStatus.InProgress:
      return "‍⏩";
    case TodoStatus.Todo:
      return "⚪️";
    default:
      return "";
  }
};

export interface TodoSatusComponentDeps {
  logger: ILogger,
  app: App,
}

export interface TodoSatusComponentProps {
  todo: TodoItem<TFile>,
  deps: TodoSatusComponentDeps,
  settings: ProletarianWizardSettings,
  playSound?: PwEvent<Sound>,
}

export function TodoStatusComponent({todo, deps, settings, playSound}: TodoSatusComponentProps) {
  
  const addChangeStatusMenuItem = (menu: Menu, status: TodoStatus, label: string) => {
    const fileOperations: FileOperations = new FileOperations(settings)
		menu.addItem((item) => {
      item.setTitle(label)
      item.onClick(() => {
        todo.status = status
				fileOperations.updateTodoStatus(todo, settings.completedDateAttribute)
      })
    })
  }

  const onauxclick = (evt: any) => {
    if (evt.defaultPrevented) {
      return
    }
    const menu = new Menu()
    addChangeStatusMenuItem(menu, TodoStatus.Todo, "◻️ Mark as todo")
    addChangeStatusMenuItem(menu, TodoStatus.Complete, "✔️ Mark as complete")
    addChangeStatusMenuItem(menu, TodoStatus.InProgress, "⏩ Mark as in progress")
    addChangeStatusMenuItem(menu, TodoStatus.AttentionRequired, "❗ Mark as attention required")
    addChangeStatusMenuItem(menu, TodoStatus.Delegated, "👬 Mark as delegated")
    addChangeStatusMenuItem(menu, TodoStatus.Canceled, "❌ Mark as cancelled")
    menu.showAtMouseEvent(evt)
    evt.preventDefault();
  }

  const onclick = (evt: any) => {
		const fileOperations: FileOperations = new FileOperations(settings)
    if (evt.defaultPrevented) {
      return
    }
    deps.logger.debug(`Changing status on ${getTodoId(todo)}`);
    evt.preventDefault();
    const wasCompleted = todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled
    if (!wasCompleted && playSound) {
      playSound.fireAsync("checked").then()
    }
		todo.status = wasCompleted ? TodoStatus.Todo : TodoStatus.Complete
		fileOperations.updateTodoStatus(todo, settings.completedDateAttribute)
  }

  return <div className="pw-todo-checkbox" onClick={onclick} onAuxClick={onauxclick}>
    {statusToIcon(todo.status)}
  </div>;
}