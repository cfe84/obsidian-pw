import * as React from "react";

import { TodoItem, TodoStatus } from "../domain/TodoItem"
import { App, MarkdownView, Menu, TFile } from "obsidian"
import { IDictionary } from "../domain/IDictionary"
import { TodoSubtasksContainer } from "./TodoSubtasksContainer";
import { TodoStatusComponent } from "./TodoStatusComponent"
import { Consts } from "../domain/Consts"
import { TodoFilter, TodoListEvents } from "src/events/TodoListEvents"
import { FileOperations } from "src/domain/FileOperations"
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings"


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

function getTodoId<T>(todo: TodoItem<T>) {
  return todo.file.id + "-" + todo.text
}

export interface TodoItemComponentProps {
  todo: TodoItem<TFile>,
  app: App,
  settings: ProletarianWizardSettings,
  events: TodoListEvents,
}

export function TodoItemComponent({todo, app, settings, events}: TodoItemComponentProps) {
  const [displayed, setDisplayed] = React.useState(true);

  async function onFilter(filter: TodoFilter<TFile>) {
    setDisplayed(filter(this.todo))
  }

  React.useEffect(() => {
    events.onFilter.listen(onFilter)
  }, [events]);


    async function openFileAsync(file: TFile, line: number, inOtherLeaf: boolean) {
      let leaf = this.app.workspace.activeLeaf
      if (inOtherLeaf) {
        leaf = this.app.workspace.splitActiveLeaf("vertical")
      } else if (leaf.getViewState().pinned) {
        leaf = this.app.workspace.getUnpinnedLeaf()
      }
      await leaf.openFile(file)
      let view = this.app.workspace.getActiveViewOfType(MarkdownView)
      const lineContent = await view.editor.getLine(line)
      view.editor.setSelection({ ch: 0, line }, { ch: lineContent.length, line })
    }

    function onClickContainer(ev: any) {
        if (ev.defaultPrevented) {
          return
        }
        openFileAsync(
          todo.file.file,
          todo.line || 0,
          ev.ctrlKey
        );
    }


    const addChangePriorityMenuItem = (menu: Menu, name: string, icon: string, otherIcon: string) => {
      if (name === this.todo.attributes["priority"]) {
        return
      }
      menu.addItem((item) => {
        item.setTitle(`${otherIcon} Change priority to ${name}`)
        item.setIcon(icon)
        item.onClick((evt) => {
          FileOperations.updateAttributeAsync(this.todo, "priority", name).then()
        })
      })
    }

    function onAuxClickContainer(evt: any){
      if (evt.defaultPrevented) {
        return
      }
      const menu = new Menu(this.app)
      menu.setNoIcon()
      addChangePriorityMenuItem(menu, "critical", "double-up-arrow-glyph", "⚡")
      addChangePriorityMenuItem(menu, "high", "up-chevron-glyph", "❗")
      addChangePriorityMenuItem(menu, "medium", "right-arrow", "🔸")
      addChangePriorityMenuItem(menu, "low", "down-chevron-glyph", "🔽")
      addChangePriorityMenuItem(menu, "lowest", "double-down-arrow-glyph", "⏬")
      menu.addItem((item) => {
        item.setTitle("🔁 Reset priority")
        item.setIcon("reset")
        item.onClick((evt) => FileOperations.removeAttributeAsync(this.todo, "priority").then())
      })
      menu.addSeparator()
      menu.addItem((item) => {
        item.setTitle("📌 Toggle selected")
        item.setIcon("pin")
        item.onClick((evt) => {
          FileOperations.updateAttributeAsync(this.todo, this.settings.selectedAttribute, !this.todo.attributes[this.settings.selectedAttribute])
        })
      })
      menu.showAtMouseEvent(evt)
    }

  function onDragStart(ev: any) {
    const id = this.getTodoId(this.todo)
    ev.dataTransfer.setData(Consts.TodoItemDragType, id)
    this.events.onDrag.fireAsync({ id, todo: this }).then()
  }

  const isSelectedText = !!this.todo.attributes[this.settings.selectedAttribute] ? " 📌" : "";
  const priorityIcon = priorityToIcon(todo.attributes);
  const completionClassName = this.todo.status === TodoStatus.Complete || this.todo.status === TodoStatus.Canceled  ? "pw-todo-text-complete" : "";
  return <>
    <div className="pw-todo-container" draggable="true" onDragStart={onDragStart} onClick={onClickContainer} onAuxClick={onAuxClickContainer}>
      <TodoStatusComponent todo={todo} />
      <div className={`pw-todo-text ${completionClassName}`}>
        {`${priorityIcon} ${this.todo.text}${isSelectedText}`}
      </div>
      <TodoSubtasksContainer subtasks={todo.subtasks} app={app} events={events} settings={settings} key={"Subtasks-" + todo.text}></TodoSubtasksContainer>
    </div>
  </>;
    
}