import { IFile } from "src/domain/IFile";
import { App, TFile } from "obsidian";

export class ObsidianFile implements IFile<TFile> {
  name: string;
  get id(): string { return this.file.path }
  constructor(private app: App, public file: TFile) {
    this.name = file.basename;
  }
  isInFolder(folder: string): boolean {
    return this.file.path.toLowerCase().startsWith(folder.toLowerCase())
  }
  async getContentAsync(): Promise<string> {
    return await this.app.vault.cachedRead(this.file);
  }
  async setContentAsync(val: string): Promise<void> {
    await this.app.vault.modify(this.file, val);
  }
}