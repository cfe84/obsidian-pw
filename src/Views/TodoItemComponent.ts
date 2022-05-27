import { TodoItem, TodoStatus } from "../domain/TodoItem"
import { App, Menu, TFile } from "obsidian"
import { IDictionary } from "../domain/IDictionary"
import { TodoListComponent } from "./TodoListComponent"
import { Consts } from "../domain/Consts"
import { TodoFilter, TodoListEvents } from "src/events/TodoListEvents"
import { FileOperations } from "src/domain/FileOperations"
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings"

export class TodoItemComponent {
  private static foldState: IDictionary<boolean> = {}
  public element: HTMLDivElement

  foldedText = ` ▶`
  unfoldedText = " ▼"

  constructor(private events: TodoListEvents, public todo: TodoItem<TFile>, private app: App, private settings: ProletarianWizardSettings) {
    this.onFilter = this.onFilter.bind(this)
    this.handleRightClick = this.handleRightClick.bind(this)
    events.onFilter.listen(this.onFilter)
  }
  private async onFilter(filter: TodoFilter<TFile>) {
    if (filter(this.todo)) {
      this.element.style.display = "block"
    } else {
      this.element.style.display = "none"
    }
  }
  private statusToIcon = (status: TodoStatus): string => {
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

  private priorityToIcon(
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

  private getTodoId<T>(todo: TodoItem<T>) {
    return todo.file.id + "-" + todo.text
  }

  private handleRightClick(evt: MouseEvent) {

  }

  public render(el: HTMLElement) {
    this.element = el.createDiv("pw-todo-container", (container) => {
      container.draggable = true
      container.ondragstart = (ev) => {
        const id = this.getTodoId(this.todo)
        ev.dataTransfer.setData(Consts.TodoItemDragType, id)
        this.events.onDrag.fireAsync({ id, todo: this }).then()
      }
      const checkbox = container.createEl("div", {
        text: `${this.statusToIcon(this.todo.status)} `,
        cls: "pw-todo-checkbox"
      })
      const isSelectedText = !!this.todo.attributes[this.settings.selectedAttribute] ? " 📌" : ""
      const textElement = container.createEl("div", {
        text: `${this.priorityToIcon(this.todo.attributes)} ${this.todo.text}${isSelectedText}`,
        cls: `pw-todo-text ${this.todo.status === TodoStatus.Complete || this.todo.status === TodoStatus.Canceled
          ? "pw-todo-text-complete"
          : ""}`
      })
      this.hookHandlers(container, checkbox)
      this.renderSubtasks(container)
    })
  }

  private renderSubtasks(container: HTMLDivElement) {
    const subDisplay = container.createEl("span", {
      text: this.todo.subtasks && this.todo.subtasks.length ? this.foldedText : "  ",
      cls: "todo-sub"
    })
    const subElementsContainer = container.createDiv("pw-todo-sub-container")
    const todoId = this.getTodoId(this.todo)
    let subTasksUnfolded = false
    const toggleSubElement = () => {
      if (subTasksUnfolded) {
        subDisplay.innerText = this.foldedText
        if (subElementsContainer.childNodes) {
          subElementsContainer.childNodes.forEach(child => subElementsContainer.removeChild(child))
        }
      } else {
        subDisplay.innerText = this.unfoldedText
        new TodoListComponent(this.events, this.todo.subtasks, this.app, this.settings).render(subElementsContainer)
      }
      subTasksUnfolded = !subTasksUnfolded
      // Save state
      TodoItemComponent.foldState[todoId] = subTasksUnfolded
    }
    subDisplay.onclick = (evt) => {
      if (evt.defaultPrevented) {
        return
      }
      evt.preventDefault()
      toggleSubElement()
    }
    // Restore state
    if (TodoItemComponent.foldState[todoId]) {
      toggleSubElement()
    }
  }

  private hookHandlers(container: HTMLDivElement, checkbox: HTMLDivElement) {
    if (this.events.openFile) {
      container.onclick = (ev) => {
        if (ev.defaultPrevented) {
          return
        }
        this.events.openFile.fireAsync({
          file: this.todo.file.file,
          line: this.todo.line || 0,
          inOtherLeaf: ev.ctrlKey
        }).then()
      }
    }
    if (this.events.onCheckboxClicked) {
      checkbox.onclick = (evt) => {
        if (evt.defaultPrevented) {
          return
        }
        this.events.onCheckboxClicked.fireAsync(this.todo).then()
        evt.preventDefault() // prevent open file
      }
    }

    const addChangeStatusMenuItem = (menu: Menu, status: TodoStatus, label: string) => {
      menu.addItem((item) => {
        item.setTitle(label)
        item.onClick(() => {
          this.todo.status = status
          FileOperations.updateTodoStatus(this.todo, this.settings.completedDateAttribute)
        })
      })
    }

    checkbox.onauxclick = (evt) => {
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

    container.onauxclick = (evt) => {
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
  }
}