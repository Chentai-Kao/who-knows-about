// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, extensions, window } from 'vscode';
import { GitExtension } from './git';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "who-knows-about" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  registerHelloWorld(context);
  registerWhoKnowsAbout(context);

  test();
}

function registerHelloWorld(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand('who-knows-about.helloWorld', () => {
      window.showInformationMessage('Hello world!');
    })
  );
}

function registerWhoKnowsAbout(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand('who-knows-about.whoknowsabout', () => {
      const quickPick = window.createQuickPick();
      quickPick.items = [{ label: 'showInputBox' }];
      quickPick.onDidChangeSelection(async (items) => {
        if (items[0]) {
          await showInputBox();
        }
      });
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    })
  );
}

async function showInputBox(): Promise<void> {
  const result = await window.showInputBox({
    value: 'abcdef',
    valueSelection: [2, 4],
    placeHolder: 'For example: fedcba. But not: 123',
    validateInput: (text) => {
      window.showInformationMessage(`Validating: ${text}`);
      return text === '123' ? 'Not 123!' : null;
    },
  });
  window.showInformationMessage(`Got: ${result}`);
}

async function test(): Promise<void> {
  const gitExtension =
    extensions.getExtension<GitExtension>('vscode.git')?.exports;
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
