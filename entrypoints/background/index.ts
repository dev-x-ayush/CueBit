import { browser } from 'wxt/browser';
import { createNote, deleteNote, getNotesForVideo, listNotes } from '../../src/lib/database';
import type { ExtensionMessage } from '../../src/lib/types';

export default defineBackground(() => {
  // Global shortcut (default Alt+Shift+N, rebindable at chrome://extensions/shortcuts):
  // opens the note composer on the active YouTube tab.
  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'add-note') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith('https://www.youtube.com/')) return;
    try {
      await browser.tabs.sendMessage(tab.id, { type: 'video:open-composer' } satisfies ExtensionMessage);
    } catch {
      // The page has no CueBit content script yet (e.g. opened before install); ignore.
    }
  });

  browser.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    let operation: Promise<unknown>;
    switch (message.type) {
      case 'notes:list':
        operation = listNotes(message.videoId);
        break;
      case 'notes:create':
        operation = createNote(message.note);
        break;
      case 'notes:delete':
        operation = deleteNote(message.id);
        break;
      case 'video:get-notes':
        operation = getNotesForVideo(message.videoId);
        break;
      case 'video:get-snapshot':
      case 'video:seek':
      case 'video:refresh-notes':
      case 'video:open-composer':
        return false;
    }

    void operation.then(sendResponse, (error: unknown) => {
      console.error('Could not process CueBit message', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    });
    return true;
  });
});
