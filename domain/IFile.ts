export interface IFile<T> {
  file: T,
  name: string,
  getContentAsync(): Promise<string>,
  setContentAsync(val: string): Promise<void>
}