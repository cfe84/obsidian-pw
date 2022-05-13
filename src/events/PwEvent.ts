export type eventHandler<T> = (evtDetails: T) => Promise<void>

export class PwEvent<T> {
  private handlers: eventHandler<T>[] = []

  constructor(handler: eventHandler<T> = undefined) {
    if (handler) {
      this.listen(handler)
    }
  }

  listen(handlers: eventHandler<T>) {
    this.handlers.push(handlers);
  }

  async fireAsync(evtDetails: T) {
    await Promise.all(this.handlers.map(handler => handler(evtDetails)))
  }
}