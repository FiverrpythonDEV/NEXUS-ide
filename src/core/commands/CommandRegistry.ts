export interface Command {
  id: string;
  title: string;
  category?: string;
  keybinding?: string;
  handler: (...args: any[]) => void | Promise<void>;
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  private listeners: Array<() => void> = [];

  public registerCommand(command: Command): () => void {
    this.commands.set(command.id, command);
    this.notify();
    return () => {
      this.commands.delete(command.id);
      this.notify();
    };
  }

  public executeCommand(id: string, ...args: any[]): any {
    const cmd = this.commands.get(id);
    if (!cmd) {
      console.warn(`Command "${id}" not found.`);
      return;
    }
    return cmd.handler(...args);
  }

  public getCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const commandRegistry = new CommandRegistry();
