import { IDictionary } from "../domain/IDictionary";
import { TodoItem } from "../domain/TodoItem";
import { TFile } from "obsidian";
import { TodoItemComponent } from "./TodoItemComponent";
import { TodoFilter, TodoListEvents } from "../events/TodoListEvents";

export class TodoListComponent {
  private todoComponents: TodoItemComponent[] = []
  constructor(private events: TodoListEvents, private todos: TodoItem<TFile>[]) {

  }


  private getPriorityValue(todo: TodoItem<TFile>): number {
    if (!todo.attributes || !todo.attributes["priority"]) {
      return 0
    }
    const priority = todo.attributes["priority"] as string
    const priorities: IDictionary<number> = {
      critical: 10,
      high: 9,
      medium: 5,
      low: 3,
      lowest: -1,
    }
    return priorities[priority] || 0
  };

  private sortTodos(todos: TodoItem<TFile>[]): TodoItem<TFile>[] {
    if (!todos) {
      return []
    }
    return todos.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b) - this.getPriorityValue(a);
      if (!priorityDiff) {
        return a.text.toLocaleLowerCase().localeCompare(b.text.toLocaleLowerCase())
      }
      return priorityDiff
    })
  }

  public render(el: HTMLElement) {
    el.createDiv(undefined, (el) => {
      const todos = this.sortTodos(this.todos)
      this.todoComponents = todos.map(todo => new TodoItemComponent(this.events, todo))
      this.todoComponents.forEach(component => component.render(el))
    })
  }
}