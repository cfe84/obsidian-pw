import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ILogger } from "../domain/ILogger";
import { ItemView, TFile, View, WorkspaceLeaf } from "obsidian";
import { DateTime } from "luxon";
import { TodoItemComponent } from "./TodoItemComponent";
import { TodoListEvents } from "./TodoListView";
import { TodoIndex } from "../domain/TodoIndex";
import { TodoListComponent } from "./TodoListComponent";
import { Consts } from "../domain/Consts";
import { FileOperations } from "../domain/FileOperations";

const dueDateAttributes = ["due", "duedate", "when", "expire", "expires"];

export interface PlanningViewDeps {
  logger: ILogger,
  todoIndex: TodoIndex<TFile>
}

export class PlanningView extends ItemView {
  private contentView: HTMLDivElement
  private hideEmpty = true
  private todos: TodoItem<TFile>[] = []
  private events: TodoListEvents
  private draggedTodos: { [key: string]: TodoItemComponent } = {}
  getIcon(): string {
    return "calendar-glyph"
  }

  constructor(private deps: PlanningViewDeps, events: TodoListEvents, leaf: WorkspaceLeaf) {
    super(leaf)
    this.todos = deps.todoIndex.todos
    this.contentView = this.containerEl.getElementsByClassName("view-content")[0] as HTMLDivElement
    this.events = {
      openFile: events.openFile,
      onCheckboxClicked: events.onCheckboxClicked,
      onDrag: (id: string, todo: TodoItemComponent) => this.draggedTodos[id] = todo
    }
  }

  static viewType: string = "pw.planning";
  getViewType() { return PlanningView.viewType }
  getDisplayText() { return "Todo planning" }

  async onTodosChanged(todos: TodoItem<TFile>[]) {
    this.todos = todos;
    this.render()
  }

  private findTodoDueDate(todo: TodoItem<TFile>): DateTime | undefined {
    if (!todo.attributes) {
      return undefined
    }
    const attr = dueDateAttributes.find(attr => todo.attributes[attr])
    if (attr) {
      const d = DateTime.fromISO(`${todo.attributes[attr]}`);
      return d.isValid ? d : undefined
    }
  }

  private getTodosByDueDate(from: DateTime | null, to: DateTime | null, includeSelected: boolean = false): TodoItem<TFile>[] {
    const todosInRange = this.todos.filter(
      (todo) =>
        todo.attributes &&
        dueDateAttributes.find((attribute) => {
          if (todo.attributes && !!todo.attributes["selected"]) {
            // Include or exclude selected regardless of date
            return includeSelected
          }
          if (!todo.attributes ||
            !todo.attributes[attribute]
          ) {
            return false;
          }
          try {
            const date = DateTime.fromISO(`${todo.attributes[attribute]}`);
            return (from === null || date >= from) && (to === null || date < to);
          } catch (err) {
            this.deps.logger.error(`Error while parsing date: ${err}`);
            return false;
          }
        })
    );
    return todosInRange
  }

  private getTodosWithNoDate(): TodoItem<TFile>[] {
    return this.todos.filter(todo =>
      !this.findTodoDueDate(todo)
      && !todo.attributes["selected"]
      && todo.status !== TodoStatus.Canceled && todo.status !== TodoStatus.Complete)
  }


  private renderColumn(container: Element, columName: string, todos: TodoItem<TFile>[], ondrop: (todo: TodoItem<TFile>) => void | null = null, hideIfEmpty = false) {
    if (todos.length === 0 && hideIfEmpty) {
      return
    }
    const columentEl = container.createDiv("pw-planning-column")
    const titleEl = columentEl.createDiv({ cls: "pw-planning-column-title", text: columName })
    const contentEl = columentEl.createDiv("pw-planning-column-content")
    const todoList = new TodoListComponent(this.events, todos)
    todoList.render(contentEl)

    if (ondrop) {
      contentEl.ondragover = ev => {
        ev.preventDefault()
      }
      contentEl.ondragenter = ev => {
        contentEl.style.borderColor = "blue"
      }
      contentEl.ondragleave = ev => {
        contentEl.style.borderColor = "#ddd"
      }
      contentEl.ondrop = ev => {
        const todoId = ev.dataTransfer.getData(Consts.TodoItemDragType)
        if (todoId) {
          ev.preventDefault()
          const todo = this.draggedTodos[todoId]
          if (Array.from(contentEl.children).indexOf(todo.element) < 0) {
            contentEl.appendChild(todo.element)
            ondrop(todo.todo)
          }
        }
      }
    }
  }

  moveToDate(date: DateTime) {
    return (todo: TodoItem<TFile>) => {
      FileOperations.updateAttributeAsync(todo, "due", date.toISODate()).then()
    }
  }

  removeDate() {
    return (todo: TodoItem<TFile>) => {
      FileOperations.removeAttributeAsync(todo, "due").then()
    }
  }
  renderColumns(container: Element) {
    const today = DateTime.now().startOf("day")
    this.renderColumn(container, "🕸️ Past", this.getTodosByDueDate(null, today).filter(
      todo => todo.status !== TodoStatus.Canceled
        && todo.status !== TodoStatus.Complete),
      null,
      true)
    let bracketStart = today
    let bracketEnd = today.plus({ day: 1 })
    this.renderColumn(container, "☀️ Today", this.getTodosByDueDate(bracketStart, bracketEnd, true)
      .filter(todo => {
        if (!todo.attributes["selected"] || (todo.status !== TodoStatus.Complete && todo.status !== TodoStatus.Canceled)) {
          return true
        }
        const dueDate = this.findTodoDueDate(todo)
        return dueDate !== undefined && dueDate > today.minus({ days: 1 })
      }), this.moveToDate(bracketStart))


    for (let i = 0; i < 6; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketEnd.plus({ day: 1 })
      if (bracketStart.weekday === 6 || bracketStart.weekday === 7) {
        continue
      }
      const label = i === 0 ? "📅 Tomorrow" : bracketStart.toFormat("📅 cccc dd/MM")
      this.renderColumn(container, label, this.getTodosByDueDate(bracketStart, bracketEnd), this.moveToDate(bracketStart))
    }

    for (let i = 1; i < 5; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ weeks: 1 })
      const label = `📅 Week +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`
      this.renderColumn(container, label, this.getTodosByDueDate(bracketStart, bracketEnd), this.moveToDate(bracketStart), this.hideEmpty)
    }

    for (let i = 1; i < 4; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ months: 1 })
      const label = `📅 Month +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`
      this.renderColumn(container, label, this.getTodosByDueDate(bracketStart, bracketEnd), this.moveToDate(bracketStart), this.hideEmpty)
    }
    this.renderColumn(container, "📅 Later", this.getTodosByDueDate(bracketEnd, null), this.moveToDate(bracketStart), this.hideEmpty)
    this.renderColumn(container, "📃 Backlog", this.getTodosWithNoDate(), this.removeDate(), this.hideEmpty)
  }

  private renderHideEmptyToggle(el: HTMLElement) {
    const cont = el.createDiv()
    const checkbox = cont.createEl("input", { type: "checkbox" })
    checkbox.checked = this.hideEmpty
    cont.appendText(" hide empty containers")
    checkbox.onclick = () => {
      this.hideEmpty = checkbox.checked
      this.render()
    }
  }

  render() {
    Array.from(this.contentView.children).forEach(child => this.contentView.removeChild(child))
    this.deps.logger.debug(`Rendering planning view`)
    this.renderHideEmptyToggle(this.contentView)
    this.renderColumns(this.contentView)
  }
}