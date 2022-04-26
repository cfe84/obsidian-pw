import { IFile } from "./IFile"
import { ILineStructure, LineOperations } from "./LineOperations"
import { TodoItem } from "./TodoItem"

const lineOperations = new LineOperations()

export class FileOperations {
  private static getEOL(content: string): string {
    if (content.indexOf("\r\n") >= 0) {
      return "\r\n"
    }
    return "\n"
  }

  static async updateAttributeAsync<T>(todo: TodoItem<T>, attributeName: string, attributeValue: string) {
    const updateLine = (line: ILineStructure) => {
      const attributes = lineOperations.parseAttributes(line.line)
      attributes.attributes[attributeName] = attributeValue
      line.line = lineOperations.attributesToString(attributes)
    }
    await this.updateContentInFileAsync(todo, updateLine)
  }

  static async updateCheckboxAsync<T>(todo: TodoItem<T>, newCheckbox: string) {
    const updateLine = (line: ILineStructure) => {
      line.checkbox = newCheckbox
    }
    await this.updateContentInFileAsync(todo, updateLine)
  }

  private static async updateContentInFileAsync<T>(todo: TodoItem<T>, updateLine: (line: ILineStructure) => void) {
    const file = todo.file
    const lineNumber = todo.line
    if (lineNumber === undefined) {
      console.error(`Todo '${todo.text}' is missing line (${lineNumber})`)
      return
    }
    const content = await file.getContentAsync()
    const EOL = this.getEOL(content)
    const lines = content.split(EOL)
    const line = lineOperations.parseLine(lines[lineNumber])
    updateLine(line)
    lines[lineNumber] = lineOperations.lineToString(line)
    const res = lines.join(EOL)
    await file.setContentAsync(res)
  }
}