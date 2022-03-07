import { IFile } from "domain/IFile";
import { App, TFile } from "obsidian";

export class ObsidianFile implements IFile<TFile> {
  name: string;
  get id(): string { return this.file.path }
  constructor(private app: App, public file: TFile) {
    this.name = file.basename;
  }
  async getContentAsync(): Promise<string> {
    return await this.app.vault.cachedRead(this.file);
  }
  async setContentAsync(val: string): Promise<void> {
    await this.app.vault.modify(this.file, val);
  }
}