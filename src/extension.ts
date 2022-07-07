// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, ExtensionContext, extensions, window } from 'vscode';
import { GitExtension } from './git';
import { sortBy, sum } from 'lodash';

// git commit author email => knowledge text blob
const knowledgeMap = new Map<string, string>();

// git commit author email => author name
const authorMap = new Map<string, string>();

// number of candidates to display
const CANDIDATE_COUNT = 10;

// number of git commits to parse that forms the knowledge database
const NUMBER_COMMITS_TO_PARSE = 1000;

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
  context.subscriptions.push(
    commands.registerCommand(
      'who-knows-about.whoknowsabout',
      handleWhoKnowsAbout
    )
  );

  initializeSearchDatabase();
}

// this method is called when your extension is deactivated
export function deactivate() {
  // nothing
}

async function handleWhoKnowsAbout(): Promise<void> {
  const rawQuery = await window.showInputBox({
    placeHolder: 'For example: feature-x, bug-y, fix-z...',
  });
  const query = rawQuery?.trim();
  if (query && knowledgeMap.size > 0) {
    const queryRegEx = new RegExp(query, 'gi'); // all occurrence, case insensitive

    // find the level of knowledge per author, [[authorEmail, count], ...]
    const knowledgeCounts: [string, number][] = [...knowledgeMap].map(
      ([authorEmail, knowledge]) => [
        authorEmail,
        (knowledge.match(queryRegEx) || []).length,
      ]
    );
    // only take authors with non-zero knowledge
    const nonZeroKnowledgeCounts = knowledgeCounts.filter(
      ([, count]) => count > 0
    );
    const sortedKnowledgeCounts = sortBy(
      nonZeroKnowledgeCounts,
      ([, count]) => -count
    );
    const topKnowledgeCounts = sortedKnowledgeCounts.slice(0, CANDIDATE_COUNT);
    const totalCounts = sum(topKnowledgeCounts.map(([, count]) => count));
    const topAuthors = topKnowledgeCounts
      .map(([authorEmail, count]) => {
        const authorName = authorMap.get(authorEmail);
        if (authorName) {
          const ratio = Math.floor(100 * (count / totalCounts));
          return `${authorName} <${authorEmail}> (${ratio}%)`;
        }
        return '';
      })
      .filter((x) => x) as string[];

    // display candidate list
    if (topAuthors.length > 0) {
      const quickPick = window.createQuickPick();
      quickPick.items = topAuthors.map((author) => ({ label: author }));
      quickPick.onDidChangeSelection((items) => {
        const [item] = items;
        if (item) {
          window.showInformationMessage(
            `Who knows about "${query}"? ${item.label}`
          );
          quickPick.dispose();
        }
      });
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    }
  }
}

// go through git commits and populate the knowledge database by commit message
async function initializeSearchDatabase(): Promise<void> {
  const gitApi = extensions
    .getExtension<GitExtension>('vscode.git')
    ?.exports.getAPI(1);
  if (gitApi) {
    const [repo] = gitApi.repositories;
    if (repo) {
      const commits = await repo.log({ maxEntries: NUMBER_COMMITS_TO_PARSE });
      knowledgeMap.clear();
      commits.forEach((commit) => {
        const { authorEmail, authorName, message } = commit;
        if (authorEmail && message) {
          const oldKnowledge = knowledgeMap.get(authorEmail) || '';
          const sanitizedMessage = message.trim().replace(/\s+/g, ' ');
          const newKnowledge = [oldKnowledge, sanitizedMessage].join(' ');
          knowledgeMap.set(authorEmail, newKnowledge);
          if (authorName && !authorMap.has(authorEmail)) {
            authorMap.set(authorEmail, authorName);
          }
        }
      });
    }
  }
}
