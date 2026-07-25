export interface Breakpoint {
  id: string;
  fileId: string;
  filePath: string;
  lineNumber: number;
  condition?: string;
  enabled: boolean;
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
}

export interface CallFrame {
  functionName: string;
  file: string;
  line: number;
}

export type DebugState = 'stopped' | 'running' | 'paused';

export class DebugService {
  private breakpoints: Map<string, Breakpoint[]> = new Map(); // fileId -> Breakpoint[]
  private state: DebugState = 'stopped';
  private currentLine: number | null = null;
  private currentFileId: string | null = null;
  private variables: DebugVariable[] = [];
  private callStack: CallFrame[] = [];
  private consoleLogs: Array<{ type: 'info' | 'error' | 'warn'; text: string; time: string }> = [];
  private listeners: Array<() => void> = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public toggleBreakpoint(fileId: string, filePath: string, lineNumber: number) {
    let list = this.breakpoints.get(fileId) || [];
    const index = list.findIndex((bp) => bp.lineNumber === lineNumber);

    if (index !== -1) {
      list.splice(index, 1);
    } else {
      list.push({
        id: `bp-${fileId}-${lineNumber}`,
        fileId,
        filePath,
        lineNumber,
        enabled: true
      });
    }

    this.breakpoints.set(fileId, list);
    this.notify();
  }

  public getBreakpoints(fileId?: string): Breakpoint[] {
    if (fileId) {
      return this.breakpoints.get(fileId) || [];
    }
    let all: Breakpoint[] = [];
    this.breakpoints.forEach((list) => {
      all = all.concat(list);
    });
    return all;
  }

  public getState(): DebugState {
    return this.state;
  }

  public getCurrentLine(): number | null {
    return this.currentLine;
  }

  public getCurrentFileId(): string | null {
    return this.currentFileId;
  }

  public getVariables(): DebugVariable[] {
    return this.variables;
  }

  public getCallStack(): CallFrame[] {
    return this.callStack;
  }

  public getConsoleLogs() {
    return this.consoleLogs;
  }

  public startDebugging(fileId: string, filePath: string) {
    this.state = 'running';
    this.currentFileId = fileId;
    this.consoleLogs.push({
      type: 'info',
      text: `[Debugger] Starting debug session for ${filePath}...`,
      time: new Date().toLocaleTimeString()
    });

    const bps = this.getBreakpoints(fileId);
    if (bps.length > 0) {
      this.pauseAt(fileId, bps[0].lineNumber, 'Breakpoint Hit');
    } else {
      setTimeout(() => {
        this.pauseAt(fileId, 1, 'Initial Execution Pause');
      }, 300);
    }
    this.notify();
  }

  public pauseAt(fileId: string, line: number, reason: string) {
    this.state = 'paused';
    this.currentFileId = fileId;
    this.currentLine = line;

    this.variables = [
      { name: 'config', value: '{ mode: "cyberpunk", version: "2.5.0" }', type: 'Object' },
      { name: 'status', value: '"Active"', type: 'string' },
      { name: 'iterations', value: '42', type: 'number' },
      { name: 'isInitialized', value: 'true', type: 'boolean' }
    ];

    this.callStack = [
      { functionName: 'initializeKernel', file: filePathFromId(fileId), line },
      { functionName: 'mainEntrypoint', file: 'src/index.ts', line: 4 }
    ];

    this.consoleLogs.push({
      type: 'info',
      text: `[Debugger] Paused on line ${line} (${reason})`,
      time: new Date().toLocaleTimeString()
    });

    this.notify();
  }

  public stepOver() {
    if (this.currentLine !== null) {
      this.currentLine += 1;
      this.consoleLogs.push({
        type: 'info',
        text: `[Debugger] Step Over -> Line ${this.currentLine}`,
        time: new Date().toLocaleTimeString()
      });
      this.notify();
    }
  }

  public stepInto() {
    if (this.currentLine !== null) {
      this.currentLine += 1;
      this.consoleLogs.push({
        type: 'info',
        text: `[Debugger] Step Into -> Line ${this.currentLine}`,
        time: new Date().toLocaleTimeString()
      });
      this.notify();
    }
  }

  public continueExecution() {
    this.state = 'running';
    this.consoleLogs.push({
      type: 'info',
      text: '[Debugger] Continuing execution...',
      time: new Date().toLocaleTimeString()
    });
    setTimeout(() => {
      this.stopDebugging();
    }, 1000);
    this.notify();
  }

  public stopDebugging() {
    this.state = 'stopped';
    this.currentLine = null;
    this.currentFileId = null;
    this.variables = [];
    this.callStack = [];
    this.consoleLogs.push({
      type: 'info',
      text: '[Debugger] Debug session terminated.',
      time: new Date().toLocaleTimeString()
    });
    this.notify();
  }

  public clearLogs() {
    this.consoleLogs = [];
    this.notify();
  }
}

function filePathFromId(id: string): string {
  return id.replace('file-', '');
}

export const debugService = new DebugService();
