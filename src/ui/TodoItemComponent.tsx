import * as React from "react";

import { TodoItem, TodoStatus, getTodoId } from "../domain/TodoItem"
import { MarkdownView, Menu, TFile } from "obsidian"
import { IDictionary } from "../domain/IDictionary"
import { TodoSubtasksContainer } from "./TodoSubtasksContainer";
import { TodoStatusComponent } from "./TodoStatusComponent"
import { Consts } from "../domain/Consts"
import { TodoFilter } from "../events/TodoListEvents"
import { FileOperations } from "../domain/FileOperations"
import { StandardDependencies } from "./StandardDependencies";
import { PwEvent } from "src/events/PwEvent";
import { Sound } from "./SoundPlayer";


function priorityToIcon(
  attributes: IDictionary<string | boolean> | undefined
) {
  const attributeIsPriority = (attributeName: string) =>
    attributeName === "priority" || attributeName === "importance";
  return attributes
    ? (Object.keys(attributes)
      .filter(attributeIsPriority)
      .map((priority) => attributes[priority])
      .map((attributeValue) => {
        switch (attributeValue) {
          case "critical":
          case "highest":
            return "⚡"
          case "high":
            return "❗"
          case "medium":
            return "🔸"
          case "low":
            return "🔽"
          case "lowest":
            return "⏬"
          default:
            return ""
        }
      })[0] as string) || ""
    : "";
}

export interface TodoItemComponentProps {
  todo: TodoItem<TFile>,
  // filter?: TodoFilter<TFile>,
  playSound?: PwEvent<Sound>,
  dontCrossCompleted?: boolean,
  deps: StandardDependencies,
}

export function TodoItemComponent({todo, deps, playSound, dontCrossCompleted}: TodoItemComponentProps) {
  const app = deps.app;
  const settings = deps.settings;
	const fileOperations = new FileOperations(settings);

  async function openFileAsync(file: TFile, line: number, inOtherLeaf: boolean) {
    let leaf = app.workspace.getLeaf();
    if (inOtherLeaf) {
      leaf = app.workspace.getLeaf(true);
    } else if (leaf.getViewState().pinned) {
      leaf = app.workspace.getLeaf(false);
    }
    await leaf.openFile(file)
    let view = app.workspace.getActiveViewOfType(MarkdownView)
    const lineContent = await view.editor.getLine(line)
    view.editor.setSelection({ ch: 0, line }, { ch: lineContent.length, line })
  }

  function onClickContainer(ev: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      if (ev.defaultPrevented) {
        return
      }
      openFileAsync(
        todo.file.file,
        todo.line || 0,
        ev.altKey || ev.ctrlKey || ev.metaKey,
      );
  }

  const addChangePriorityMenuItem = (menu: Menu, name: string, icon: string, otherIcon: string) => {
    if (name === todo.attributes["priority"]) {
      return
    }
    menu.addItem((item) => {
      item.setTitle(`${otherIcon} Change priority to ${name}`)
      item.setIcon(icon)
      item.onClick((evt) => {
				fileOperations.updateAttributeAsync(todo, "priority", name).then()
      })
    })
  }

  function onAuxClickContainer(evt: any){
    if (evt.defaultPrevented) {
      return
    }
    const menu = new Menu();
    menu.setNoIcon()
    addChangePriorityMenuItem(menu, "critical", "double-up-arrow-glyph", "⚡")
    addChangePriorityMenuItem(menu, "high", "up-chevron-glyph", "❗")
    addChangePriorityMenuItem(menu, "medium", "right-arrow", "🔸")
    addChangePriorityMenuItem(menu, "low", "down-chevron-glyph", "🔽")
    addChangePriorityMenuItem(menu, "lowest", "double-down-arrow-glyph", "⏬")
    menu.addItem((item) => {
      item.setTitle("🔁 Reset priority")
      item.setIcon("reset")
      item.onClick((evt) => fileOperations.removeAttributeAsync(todo, "priority").then())
    })
    menu.addSeparator()
    menu.addItem((item) => {
      item.setTitle("📌 Toggle selected")
      item.setIcon("pin")
      item.onClick((evt) => {
				fileOperations.updateAttributeAsync(todo, settings.selectedAttribute, !todo.attributes[settings.selectedAttribute])
      })
    })
    menu.showAtMouseEvent(evt)
  }

  function onDragStart(ev: any) {
    const id = getTodoId(todo)
    ev.dataTransfer.setData(Consts.TodoItemDragType, id)
  }

  const isSelectedText = !!todo.attributes[settings.selectedAttribute] ? " 📌" : "";
  const priorityIcon = priorityToIcon(todo.attributes);
  const completionClassName = (!dontCrossCompleted && (todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled))  ? "pw-todo-text-complete" : "";
  return <>
    <div className="pw-todo-container" draggable="true" onDragStart={onDragStart} onClick={onClickContainer} onAuxClick={onAuxClickContainer}>
      <TodoStatusComponent todo={todo} deps={ { logger: deps.logger, app: app }} settings={settings} playSound={playSound} />
      <div className={`pw-todo-text ${completionClassName}`}>
        {`${priorityIcon} ${todo.text}${isSelectedText}`}
      </div>
      <TodoSubtasksContainer subtasks={todo.subtasks} deps={deps} key={"Subtasks-" + todo.text} dontCrossCompleted={true}></TodoSubtasksContainer>
    </div>
  </>;
    
}