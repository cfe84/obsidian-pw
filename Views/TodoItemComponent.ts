import { TodoItem, TodoStatus } from "../domain/TodoItem"
import { TFile } from "obsidian"
import { IDictionary } from "../domain/IDictionary"
import { TodoListComponent } from "./TodoListComponent"
import { TodoListEvents } from "./TodoListView"
import { Consts } from "../domain/Consts"

export class TodoItemComponent {
  private static foldState: IDictionary<boolean> = {}

  foldedText = ` ▶`
  unfoldedText = " ▼"

  constructor(private events: TodoListEvents, private todo: TodoItem<TFile>) { }

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
        .map((attributeValue) =>
          attributeValue === "critical"
            ? "❗❗"
            : attributeValue === "high"
              ? "❗"
              : attributeValue === "medium"
                ? "🔸"
                : attributeValue === "low"
                  ? "🔽"
                  : attributeValue === "lowest"
                    ? "⏬"
                    : ""
        )[0] as string) || ""
      : "";
  }

  private getTodoId<T>(todo: TodoItem<T>) {
    return todo.file.id + "-" + todo.text
  }

  public render(el: HTMLElement) {
    el.createDiv("pw-todo-container", (container) => {
      container.createEl("div", {
        text: `${this.statusToIcon(this.todo.status)} `,
        cls: "pw-todo-checkbox"
      })
      if (this.events.onDrag) {
        container.draggable = true
        container.ondragstart = (ev) => {
          const id = this.getTodoId(this.todo)
          ev.dataTransfer.setData(Consts.TodoItemDragType, id)
          this.events.onDrag(id, this.todo)
        }
      }
      const textElement = container.createEl("div", {
        text: `${this.priorityToIcon(this.todo.attributes)} ${this.todo.text}`,
        cls: `pw-todo-text ${this.todo.status === TodoStatus.Complete || this.todo.status === TodoStatus.Canceled
          ? "pw-todo-text-complete"
          : ""}`
      })
      const subDisplay = container.createEl("span", {
        text: this.todo.subtasks && this.todo.subtasks.length ? this.foldedText : "  ",
        cls: "todo-sub"
      })
      const subElementsContainer = container.createDiv("pw-todo-sub-container")
      if (this.events.openFile) {
        textElement.onclick = () => this.events.openFile(this.todo.file.file, this.todo.line || 0);
      }

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
          new TodoListComponent(this.events, this.todo.subtasks).render(subElementsContainer);
        }
        subTasksUnfolded = !subTasksUnfolded
        // Save state
        TodoItemComponent.foldState[todoId] = subTasksUnfolded
      }
      subDisplay.onclick = toggleSubElement
      // Restore state
      if (TodoItemComponent.foldState[todoId]) {
        toggleSubElement()
      }
    })
  }
}