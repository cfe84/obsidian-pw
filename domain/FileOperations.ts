import { LineOperations } from "./LineOperations"

export class FileOperations {
  private static getEOL(content: string): string {
    if (content.indexOf("\r\n") >= 0) {
      return "\r\n"
    }
    return "\n"
  }

  static updateAttribute(content: string, lineNumber: number, attributeName: string, attributeValue: string): string {
    const lineOperations = new LineOperations()
    const EOL = this.getEOL(content)
    const lines = content.split(EOL)
    const line = lineOperations.parseLine(lines[lineNumber])
    const attributes = lineOperations.parseAttributes(line.line)
    attributes.attributes[attributeName] = attributeValue
    line.line = lineOperations.attributesToString(attributes)
    lines[lineNumber] = lineOperations.lineToString(line)
    console.log(lines)
    return lines.join(EOL)
  }
}