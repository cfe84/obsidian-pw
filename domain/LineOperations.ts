import { TodoItem, TodoStatus } from "./TodoItem";
import { IDictionary } from "./IDictionary";
import { TextDecoder } from "util";

interface ILineStructure {
  indentation: string;
  listMarker: string;
  checkbox: string;
  date: string;
  line: string;
}

export interface ITodoParsingResult<T> {
  isTodo: boolean;
  todo?: TodoItem<T>;
  isBlank?: boolean;
  indentLevel: number;
}

interface IAttributesStructure {
  textWithoutAttributes: string;
  attributes: IDictionary<string | boolean>;
}

export class LineOperations {
  constructor() { }

  private parseLine(line: string): ILineStructure {
    const regexp =
      /^(\s*)?(?:([*-]|\d+\.)\s*)?(?:(\[.?\])\s+)?(?:((?:\d\d\d\d-)?\d\d-\d\d):\s*)?(.+)/;
    const parsed = regexp.exec(line);
    if (!parsed) {
      return {
        indentation: "",
        listMarker: "",
        checkbox: "",
        date: "",
        line: line,
      };
    }
    return {
      indentation: parsed[1] || "",
      listMarker: parsed[2] || "",
      checkbox: parsed[3] || "",
      date: parsed[4] || "",
      line: parsed[5] || "",
    };
  }

  private lineToString(line: ILineStructure): string {
    const space = (item: string, char: string = " ") =>
      item ? `${item}${char}` : "";
    return `${line.indentation}${space(line.listMarker)}${space(
      line.checkbox
    )}${space(line.date, ": ")}${line.line}`;
  }

  private attributesToString(
    attributesStructure: IAttributesStructure
  ): string {
    return (
      attributesStructure.textWithoutAttributes +
      " " +
      Object.keys(attributesStructure.attributes)
        .map((key) =>
          typeof attributesStructure.attributes[key] === "boolean"
            ? `@${key}`
            : `@${key}(${attributesStructure.attributes[key]})`
        )
        .join(" ")
    );
  }

  // convertDateAttributes(line: string): string {
  //   const parsedLine = this.parseLine(line);
  //   const parsedAttributes = this.parseAttributes(parsedLine.line);
  //   Object.keys(parsedAttributes.attributes).forEach((key) => {
  //     const val = parsedAttributes.attributes[key];
  //     if (typeof val === "string") {
  //       const completion = Completion.completeDate(val as string);
  //       if (completion !== null) {
  //         parsedAttributes.attributes[key] = completion;
  //       }
  //     }
  //   });
  //   parsedLine.line = this.attributesToString(parsedAttributes);
  //   return this.lineToString(parsedLine);
  // }

  // addDate(line: string): string {
  //   const todaysDate = this.deps.date.todayAsYMDString();
  //   const parsedLine = this.parseLine(line);
  //   parsedLine.date = todaysDate;
  //   return this.lineToString(parsedLine);
  // }

  toggleTodo(line: string): string {
    const parsedLine = this.parseLine(line);
    if (parsedLine.checkbox) {
      parsedLine.checkbox = "";
    } else {
      parsedLine.checkbox = "[ ]";
    }
    return this.lineToString(parsedLine);
  }

  setCheckmark(line: string, checkMark: string): string {
    const parsedLine = this.parseLine(line);
    parsedLine.checkbox = `[${checkMark}]`;
    return this.lineToString(parsedLine);
  }

  private markToStatus = (mark: string) => {
    mark = mark.toLowerCase();
    return mark === "]"
      ? TodoStatus.Canceled
      : mark === "c"
        ? TodoStatus.Canceled
        : mark === "-"
          ? TodoStatus.InProgress
          : mark === "!"
            ? TodoStatus.AttentionRequired
            : mark === "x"
              ? TodoStatus.Complete
              : mark === " "
                ? TodoStatus.Todo
                : mark === "d"
                  ? TodoStatus.Delegated
                  : TodoStatus.Todo;
  };

  private parseAttributes(text: string): IAttributesStructure {
    const regexp = / @(\w+)(?:\(([^)]+)\))?/g;
    const matches = text.match(regexp);
    const res: IDictionary<string | boolean> = {};
    if (!matches) return { textWithoutAttributes: text, attributes: res };
    let textWithoutAttributes = text;
    matches.forEach((match) => {
      const regexp = / @(\w+)(?:\(([^)]+)\))?/g;

      const submatch = regexp.exec(" " + match + " ");
      if (!submatch) {
        throw Error("No match?");
        return;
      }
      res[submatch[1]] = submatch[2] || true;
      textWithoutAttributes = textWithoutAttributes.replace(match, "");
    });

    return { textWithoutAttributes, attributes: res };
  }

  private getIndentationLevel(str: string) {
    return (str.match(/ /g)?.length || 0) + (str.match(/\t/g)?.length || 0) * 4;
  }

  toTodo<T>(line: string, lineNumber?: number): ITodoParsingResult<T> {
    const parsedLine = this.parseLine(line);
    const indentLevel = this.getIndentationLevel(parsedLine.indentation);
    if (!parsedLine.checkbox)
      return {
        isTodo: false,
        indentLevel,
      };
    const attributesMatching = this.parseAttributes(parsedLine.line);
    const todo: TodoItem<T> = {
      status: this.markToStatus(parsedLine.checkbox[1]),
      text: attributesMatching.textWithoutAttributes,
      attributes: attributesMatching.attributes,
      file: undefined,
    };
    const res: ITodoParsingResult<T> = {
      isTodo: true,
      todo,
      indentLevel: this.getIndentationLevel(parsedLine.indentation),
    };
    if (lineNumber !== undefined) {
      todo.line = lineNumber;
    }
    return res;
  }
}
