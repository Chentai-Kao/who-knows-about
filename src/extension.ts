// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GitExtension } from './git';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "who-knows-about" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    'who-knows-about.helloWorld',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage('Hello World from who-knows-about!');
    }
  );
  test();

  context.subscriptions.push(disposable);
}

async function test(): Promise<void> {
  const gitExtension =
    vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
  if (gitExtension) {
    const api = gitExtension.getAPI(1);
    const repo = api.repositories[0];
    const head = repo.state.HEAD;

    // Get the branch and commit
    if (head) {
      const { commit, name: branch } = head;

      // Get head of any other branch
      const mainBranch = 'master';
      const branchDetails = await repo.getBranch(mainBranch);

      if (branch) {
        // Get last merge commit
        const lastMergeCommit = await repo.getMergeBase(branch, mainBranch);

        const status = await repo.status();

        console.log({
          branch,
          commit,
          lastMergeCommit,
          needsSync: lastMergeCommit !== commit,
          branchDetails,
          status,
        });
      }
    }
  }
}

// this method is called when your extension is deactivated
export function deactivate() {
  // nothing
}
