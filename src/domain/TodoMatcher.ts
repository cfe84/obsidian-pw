import { TodoItem } from "./TodoItem";

export class TodoMatcher<T> {
  private matchTerm: string
  constructor(matchTerm: string) {
    this.matchTerm = matchTerm.toLowerCase()
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