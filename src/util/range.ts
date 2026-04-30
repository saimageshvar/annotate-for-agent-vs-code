import * as vscode from 'vscode'

export function rangeToLines(r: vscode.Range): { startLine: number; endLine: number } {
  return { startLine: r.start.line + 1, endLine: r.end.line + 1 }
}

export function linesToRange(lines: { startLine: number; endLine: number }): vscode.Range {
  return new vscode.Range(
    new vscode.Position(Math.max(0, lines.startLine - 1), 0),
    new vscode.Position(Math.max(0, lines.endLine - 1), 0),
  )
}
