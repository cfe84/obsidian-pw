export interface IFile<T> {
  file: T,
  name: string,
  path: string,
  id: string,
  getLastModifiedAsync(): Promise<Date>,
  renameAsync(folder: string): Promise<void>
  getContentAsync(): Promise<string>,
  setContentAsync(val: string): Promise<void>,
  isInFolder(folder: string): boolean
}