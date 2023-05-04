import * as React from "react";
import { TodoItem, TodoStatus } from "../domain/TodoItem"
import { Menu, TFile } from "obsidian";
import { FileOperations } from "src/domain/FileOperations";

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
      return "⬜";
    default:
      return "";
  }
};

export interface TodoSatusComponentProps {
  todo: TodoItem<TFile>
}

export function TodoStatusComponent({todo}: TodoSatusComponentProps) {
  
  const addChangeStatusMenuItem = (menu: Menu, status: TodoStatus, label: string) => {
    menu.addItem((item) => {
      item.setTitle(label)
      item.onClick(() => {
        this.todo.status = status
        FileOperations.updateTodoStatus(this.todo, this.settings.completedDateAttribute)
      })
    })
  }

  const onauxclick = (evt: any) => {
    if (evt.defaultPrevented) {
      return
    }
    const menu = new Menu(this.app)
    addChangeStatusMenuItem(menu, TodoStatus.Todo, "⬜ Mark as todo")
    addChangeStatusMenuItem(menu, TodoStatus.Complete, "✔️ Mark as complete")
    addChangeStatusMenuItem(menu, TodoStatus.InProgress, "⏩ Mark as in progress")
    addChangeStatusMenuItem(menu, TodoStatus.AttentionRequired, "❗ Mark as attention required")
    addChangeStatusMenuItem(menu, TodoStatus.Delegated, "👬 Mark as delegated")
    addChangeStatusMenuItem(menu, TodoStatus.Canceled, "❌ Mark as cancelled")
    menu.showAtMouseEvent(evt)
    evt.preventDefault()
  }

  const onclick = (evt: any) => {
    if (evt.defaultPrevented) {
      return
    }
    const wasCompleted = todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled
		todo.status = wasCompleted ? TodoStatus.Todo : TodoStatus.Complete
		FileOperations.updateTodoStatus(todo, this.settings.completedDateAttribute)
  }

  return <div className="pw-todo-checkbox" onClick={onclick} onAuxClick={onauxclick}>
    {statusToIcon(todo.status)}
  </div>;
}