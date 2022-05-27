import { TodoItem, TodoStatus } from "../domain/TodoItem";
import { ILogger } from "../domain/ILogger";
import { App, ItemView, Menu, TFile, View, WorkspaceLeaf } from "obsidian";
import { DateTime } from "luxon";
import { TodoItemComponent } from "./TodoItemComponent";
import { TodoIndex } from "../domain/TodoIndex";
import { TodoListComponent } from "./TodoListComponent";
import { Consts } from "../domain/Consts";
import { FileOperations } from "../domain/FileOperations";
import { TodoMatcher } from "src/domain/TodoMatcher";
import { DragEventParameters, TodoListEvents } from "src/events/TodoListEvents";
import { PwEvent } from "src/events/PwEvent";
import { ProletarianWizardSettings } from "src/domain/ProletarianWizardSettings";

export interface PlanningViewDeps {
  logger: ILogger,
  todoIndex: TodoIndex<TFile>,
}

export class PlanningView extends ItemView {
  private contentView: HTMLDivElement
  private hideEmpty = true
  private todos: TodoItem<TFile>[] = []
  private events: TodoListEvents
  private wipLimit: number
  private wipLimitActive: boolean
  private draggedTodos: { [key: string]: TodoItemComponent } = {}
  getIcon(): string {
    return "calendar-glyph"
  }

  constructor(private deps: PlanningViewDeps, private settings: ProletarianWizardSettings, events: TodoListEvents, leaf: WorkspaceLeaf) {
    super(leaf)
    this.onDragHandler = this.onDragHandler.bind(this)
    this.todos = deps.todoIndex.todos
    this.contentView = this.containerEl.getElementsByClassName("view-content")[0] as HTMLDivElement
    this.events = {
      openFile: events.openFile,
      onFilter: events.onFilter,
      onCheckboxClicked: events.onCheckboxClicked,
      onDrag: new PwEvent(this.onDragHandler)
    }
  }

  private async onDragHandler(dragParameters: DragEventParameters) {
    const { id, todo } = dragParameters
    this.draggedTodos[id] = todo
  }

  static viewType: string = "pw.planning";
  getViewType() { return PlanningView.viewType }
  getDisplayText() { return "Todo planning" }

  async onTodosChanged(todos: TodoItem<TFile>[]) {
    this.todos = todos;
    this.render()
  }

  private findTodoDate(todo: TodoItem<TFile>, attribute: string): DateTime | undefined {
    if (!todo.attributes) {
      return undefined
    }
    const attr = todo.attributes[attribute]
    if (attr) {
      const d = DateTime.fromISO(`${todo.attributes[attribute]}`);
      return d.isValid ? d : undefined
    }
    return undefined
  }

  private getTodosByDate(from: DateTime | null, to: DateTime | null, includeSelected: boolean = false): TodoItem<TFile>[] {
    const dateIsInRange = (date: DateTime) => date && (from === null || date >= from) && (to === null || date < to)
    const todoInRange = (todo: TodoItem<TFile>) => {
      const isDone = todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled
      const isSelected = todo.attributes && !!todo.attributes[this.settings.selectedAttribute]
      const dueDate = this.findTodoDate(todo, this.settings.dueDateAttribute)
      const completedDate = this.findTodoDate(todo, this.settings.completedDateAttribute)
      const dueDateIsInRange = dateIsInRange(dueDate)
      const completedDateIsInRange = dateIsInRange(completedDate)
      const isInRangeOrSelected = dueDateIsInRange || (includeSelected && isSelected && (isDone && completedDateIsInRange || !isDone))
      if (todo.text.contains("lol")) {
        this.deps.logger.info(`Todo:  ${completedDateIsInRange} ${includeSelected} ${isSelected} ${isInRangeOrSelected}`)
      }
      return isInRangeOrSelected
    }
    const todosInRange = this.todos.filter((todo) => todo.attributes && todoInRange(todo));
    return todosInRange
  }

  private getTodosWithNoDate(): TodoItem<TFile>[] {
    return this.todos.filter(todo =>
      !this.findTodoDate(todo, this.settings.dueDateAttribute)
      && !todo.attributes[this.settings.selectedAttribute]
      && todo.status !== TodoStatus.Canceled && todo.status !== TodoStatus.Complete)
  }

  private renderColumn(container: Element, columName: string, todos: TodoItem<TFile>[], ondrop: (todo: TodoItem<TFile>) => void | null = null, hideIfEmpty = false) {
    if (todos.length === 0 && hideIfEmpty) {
      return
    }
    const columentEl = container.createDiv("pw-planning-column")
    const titleEl = columentEl.createDiv({ cls: "pw-planning-column-title", text: columName })
    const contentEl = columentEl.createDiv("pw-planning-column-content")
    const todoList = new TodoListComponent(this.events, todos, this.app, this.settings)
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
      FileOperations.updateAttributeAsync(todo, this.settings.dueDateAttribute, date.toISODate()).then()
    }
  }

  removeDate() {
    return (todo: TodoItem<TFile>) => {
      FileOperations.removeAttributeAsync(todo, this.settings.dueDateAttribute).then()
    }
  }
  renderColumns(container: Element) {
    const today = DateTime.now().startOf("day")
    this.renderColumn(container, "🕸️ Past", this.getTodosByDate(null, today).filter(
      todo => todo.status !== TodoStatus.Canceled && todo.status !== TodoStatus.Complete),
      null,
      true)
    let bracketStart = today
    let bracketEnd = today.plus({ day: 1 })
    this.renderColumn(container, "☀️ Today", this.getTodosByDate(bracketStart, bracketEnd, true)
      // .filter(todo => {
      //   const dueDate = this.findTodoDate(todo, dueDateAttribute)
      //   return dueDate !== undefined && dueDate > today.minus({ days: 1 })
      // })
      , this.moveToDate(bracketStart))


    for (let i = 0; i < 6; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketEnd.plus({ day: 1 })
      if (bracketStart.weekday === 6 || bracketStart.weekday === 7) {
        continue
      }
      const label = i === 0 ? "📅 Tomorrow" : bracketStart.toFormat("📅 cccc dd/MM")
      this.renderColumn(container, label, this.getTodosByDate(bracketStart, bracketEnd), this.moveToDate(bracketStart))
    }

    for (let i = 1; i < 5; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ weeks: 1 })
      const label = `📅 Week +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`
      this.renderColumn(container, label, this.getTodosByDate(bracketStart, bracketEnd), this.moveToDate(bracketStart), this.hideEmpty)
    }

    for (let i = 1; i < 4; i++) {
      bracketStart = bracketEnd
      bracketEnd = bracketStart.plus({ months: 1 })
      const label = `📅 Month +${i} (${bracketStart.toFormat("dd/MM")} - ${bracketEnd.minus({ days: 1 }).toFormat("dd/MM")})`
      this.renderColumn(container, label, this.getTodosByDate(bracketStart, bracketEnd), this.moveToDate(bracketStart), this.hideEmpty)
    }
    this.renderColumn(container, "📅 Later", this.getTodosByDate(bracketEnd, null), this.moveToDate(bracketStart), this.hideEmpty)
    this.renderColumn(container, "📃 Backlog", this.getTodosWithNoDate(), this.removeDate(), this.hideEmpty)
  }

  private renderHideEmptyToggle(el: HTMLElement) {
    const cont = el.createDiv("pw-planning--settings--hide-checkbox")
    const checkbox = cont.createEl("input", { type: "checkbox" })
    checkbox.checked = this.hideEmpty
    cont.appendText(" hide empty containers")
    checkbox.onclick = () => {
      this.hideEmpty = checkbox.checked
      this.render()
    }
  }

  private renderSearchBox(el: HTMLElement) {
    const cont = el.createDiv("pw-planning--settings--search")
    cont.appendText("Filter: ")
    const searchBox = cont.createEl("input")
    const fuzzyCheckbox = cont.createEl("input", { type: "checkbox" })
    cont.appendText(" fuzzy search")

    const refreshSearch = () => {
      const matcher = new TodoMatcher(searchBox.value, fuzzyCheckbox.checked)
      this.events.onFilter.fireAsync(matcher.matches).then()
    }
    searchBox.onkeyup = refreshSearch
    fuzzyCheckbox.onchange = refreshSearch
  }

  private renderWipLimit(el: HTMLElement) {
    const cont = el.createDiv("pw-planning--settings--wip")
    cont.appendText("WIP limit: ")
    const wipLimit = cont.createEl("input")
    const wipLimitActivated = cont.createEl("input", { type: "checkbox" })
    cont.appendText(" show WIP limit")

  }

  private renderSettings(el: HTMLElement) {
    const settingsContainer = el.createDiv("pw-planning--settings")
    this.renderHideEmptyToggle(settingsContainer)
    this.renderSearchBox(settingsContainer)
  }

  render() {
    Array.from(this.contentView.children).forEach(child => this.contentView.removeChild(child))
    this.deps.logger.debug(`Rendering planning view`)
    this.renderSettings(this.contentView)
    this.renderColumns(this.contentView)
  }
}