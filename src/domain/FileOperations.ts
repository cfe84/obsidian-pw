import { DateTime } from "luxon"
import { ILineStructure, LineOperations } from "./LineOperations"
import { ProletarianWizardSettings } from "./ProletarianWizardSettings";
import { TodoItem, TodoStatus } from "./TodoItem"

export class FileOperations {
  lineOperations
	constructor(private settings?: ProletarianWizardSettings) {
		this.lineOperations = new LineOperations(settings)
	}

	private getEOL(content: string): string {
    if (content.indexOf("\r\n") >= 0) {
      return "\r\n"
    }
    return "\n"
  }

  async updateAttributeAsync<T>(todo: TodoItem<T>, attributeName: string, attributeValue: string | boolean | undefined) {
    const updateLine = (line: ILineStructure) => {
      const attributes = this.lineOperations.parseAttributes(line.line)
      if (attributeValue === false || attributeValue === undefined) {
        delete attributes.attributes[attributeName]
      } else {
        attributes.attributes[attributeName] = attributeValue
      }
      line.line = this.lineOperations.attributesToString(attributes)
    }
    await this.updateContentInFileAsync(todo, updateLine)
  }

  async removeAttributeAsync<T>(todo: TodoItem<T>, attributeName: string) {
    const updateLine = (line: ILineStructure) => {
      const attributes = this.lineOperations.parseAttributes(line.line)
      delete attributes.attributes[attributeName]
      line.line = this.lineOperations.attributesToString(attributes)
    }
    await this.updateContentInFileAsync(todo, updateLine)
  }

  private async updateCheckboxAsync<T>(todo: TodoItem<T>, newCheckbox: string) {
    const updateLine = (line: ILineStructure) => {
      line.checkbox = newCheckbox
    }
    await this.updateContentInFileAsync(todo, updateLine)
  }

  async updateTodoStatus<T>(todo: TodoItem<T>, completedAttribute: string) {
    const isCompleted = todo.status === TodoStatus.Complete || todo.status === TodoStatus.Canceled
    let newCheckBox
    switch (todo.status) {
      case TodoStatus.Todo: newCheckBox = "[ ]"; break;
      case TodoStatus.Canceled: newCheckBox = "[-]"; break;
      case TodoStatus.AttentionRequired: newCheckBox = "[!]"; break;
      case TodoStatus.Complete: newCheckBox = "[x]"; break;
      case TodoStatus.Delegated: newCheckBox = "[d]"; break;
      case TodoStatus.InProgress: newCheckBox = "[>]"; break;
      default: newCheckBox = ""
    }
    await this.updateCheckboxAsync(todo, newCheckBox)
    const completedAttributeValue = isCompleted ? DateTime.now().toISODate() : undefined
    await this.updateAttributeAsync(todo, completedAttribute, completedAttributeValue)
  }

  private async updateContentInFileAsync<T>(todo: TodoItem<T>, updateLine: (line: ILineStructure) => void) {
    const file = todo.file
    const lineNumber = todo.line
    if (lineNumber === undefined) {
      console.error(`Todo '${todo.text}' is missing line (${lineNumber})`)
      return
    }
    const content = await file.getContentAsync()
    const EOL = this.getEOL(content)
    const lines = content.split(EOL)
    const line = this.lineOperations.parseLine(lines[lineNumber])
    updateLine(line)
    lines[lineNumber] = this.lineOperations.lineToString(line)
    const res = lines.join(EOL)
    await file.setContentAsync(res)
  }
}