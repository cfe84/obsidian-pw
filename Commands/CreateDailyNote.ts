import { DateTime } from "luxon";
import { App, Command, Editor, Hotkey, MarkdownView, TFile } from "obsidian";
import * as path from "path";
import * as fs from "fs";
import { PwPrefs } from "../PwPrefs";

export class CreateDailyNoteCommand implements Command {
  constructor(private prefs: PwPrefs, private app: App) { }

  id = "pw-openDailyNote";
  name = "Open or create daily note";
  icon = "check-small";
  hotkeys: Hotkey[] = [
    {
      key: "n",
      modifiers: ["Alt"]
    }
  ]

  private getDailyNoteFileName() {
    const date = DateTime.now().toISODate()
    const name = `${date} - daily-notes.md`
    const file = this.prefs.dailyNotes.folder + '/' + name
    return file
  }

  async callback() {
    const fileName = this.getDailyNoteFileName()
    let file = this.app.vault.getAbstractFileByPath(fileName)
    if (!file) {
      console.debug(`Creating file ${fileName}`)
      const directory = path.dirname(fileName)
      try {
        await this.app.vault.createFolder(directory)
      } catch (_) {
      }
      file = await this.app.vault.create(fileName, this.prefs.dailyNotes.template)
    }
    this.app.workspace.activeLeaf.openFile(file as TFile)
  };

}