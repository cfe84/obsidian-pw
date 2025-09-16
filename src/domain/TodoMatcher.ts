import { TodoItem } from "./TodoItem";

export class TodoMatcher<T> {
	private matchTerm: string;
	private regex: RegExp;
	constructor(matchTerm: string, private fuzzySearch = false) {
		this.matchTerm = matchTerm.toLowerCase();
		this.matches = this.matches.bind(this);
		matchTerm = matchTerm.replace(/[|^${}()[\]\\ \/]/g, '\\$&')
		this.regex = RegExp(matchTerm, "gi");
	}

	public matches(todo: TodoItem<T>): boolean {
		if (!this.matchTerm) {
			return true;
		}
		if (this.fuzzySearch) {
			return this.fuzzyMatch(todo);
		} else {
			return this.exactMatch(todo);
		}
	}

	private exactMatch(todo: TodoItem<T>) {
		try {
			return todo.text.search(this.regex) >= 0;
		} catch (e) {
			console.error("Error in regex matching:", e);
			return false;
		}
	}

	private fuzzyMatch(todo: TodoItem<T>) {
		let i = 0;
		const todoText = todo.text.toLowerCase();
		for (let char of this.matchTerm) {
			let matchIndex = todoText.indexOf(char, i);
			if (matchIndex < 0) {
				return false;
			}
			i = matchIndex;
		}
		return true;
	}
}
