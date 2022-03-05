import { IContext } from "../contract/IContext";
import { deepStrictEqual } from "assert";
import { IDependencies } from "../contract/IDependencies";
import * as chrono from "chrono-node";
import { DateTime } from "luxon";

export class Completion {
  constructor(private deps: IDependencies, private context: IContext) {}

  private completeAttribute(beginning: string): string[] {
    return this.context.parsedFolder.attributes.filter((attr) =>
      attr.startsWith(beginning)
    );
  }

  public static completeDate(prompt: string): string | null {
    const parseResult = chrono.parseDate(prompt);
    if (parseResult !== null) {
      return DateTime.fromJSDate(parseResult).toLocal().toISODate();
    }
    return null;
  }

  private findMatchingAttributeValues(
    attributeName: string,
    beginning: string
  ) {
    const values = this.context.parsedFolder.attributeValues[attributeName];
    if (!values) return [];
    return values.filter((value) => value.startsWith(beginning));
  }

  private completeAttributeValue(
    attributeName: string,
    beginning: string
  ): string[] {
    const dateCompletion = Completion.completeDate(beginning);
    const matchingAttributeValues = this.findMatchingAttributeValues(
      attributeName,
      beginning
    );
    return matchingAttributeValues;
  }

  private findCurrentWordBeginning(content: string, position: number): string {
    let beginning = position;
    while (
      beginning > 0 &&
      content[beginning] !== "@" &&
      content[beginning] !== "\n"
    ) {
      beginning--;
    }
    if (
      beginning <= 1 ||
      content[beginning] !== "@" ||
      content[beginning - 1] !== " "
    ) {
      return "";
    }
    return content.substr(beginning, position - beginning);
  }

  complete(content: string, position: number): string[] {
    const currentWordBeginning = this.findCurrentWordBeginning(
      content,
      position
    );
    if (currentWordBeginning === "") {
      return [];
    }
    const valueBeginningIndex = currentWordBeginning.indexOf("(");
    if (valueBeginningIndex >= 0) {
      const attributeName = currentWordBeginning.substr(
        1,
        valueBeginningIndex - 1
      ); // ignore @
      const valueBeginning = currentWordBeginning.substr(
        valueBeginningIndex + 1,
        currentWordBeginning.length - valueBeginningIndex - 1
      );
      return this.completeAttributeValue(attributeName, valueBeginning);
    }
    return this.completeAttribute(
      currentWordBeginning.substr(1, currentWordBeginning.length - 1)
    );
  }
}
