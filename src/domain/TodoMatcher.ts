import { TodoItem } from "./TodoItem";

export class TodoMatcher<T> {
  constructor(private matchTerm: string) {
    this.matches = this.matches.bind(this)
  }

  public matches(todo: TodoItem<T>): boolean {
    if (!this.matchTerm) {
      return true;
    }
    let i = 0;
    const todoText = todo.text.toLowerCase()
    for (let char of this.matchTerm) {
      let matchIndex = todoText.indexOf(char, i)
      if (matchIndex < 0) {
        return false
      }
      i = matchIndex
    }
    return true;
  }
}