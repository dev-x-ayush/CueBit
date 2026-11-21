import { browser } from 'wxt/browser';
import type { ExtensionMessage, MomentNote, VideoSnapshot } from '../../src/lib/types';
import './style.css';

let videoId = '';
let notes: MomentNote[] = [];
let refreshTimer: number | undefined;
let renderedSignature = '';
let composer: HTMLElement | undefined;

function currentVideoId(): string {
  return new URL(location.href).searchParams.get('v') ?? '';
}

function getVideo(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>('video.html5-main-video');
}

function getSnapshot(): VideoSnapshot | undefined {
  const video = getVideo();
  const id = currentVideoId();
  if (!video || !id) return undefined;
  const title = document.querySelector('#above-the-fold h1 yt-formatted-string')?.textContent?.trim()
    || document.querySelector('h1.ytd-watch-metadata')?.textContent?.trim()
    || document.title.replace(/\s*-\s*YouTube$/, '').trim()
    || 'YouTube video';
  return {
    videoId: id,
    videoTitle: title,
    videoUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`,
    seconds: video.currentTime,
    duration: Number.isFinite(video.duration) ? video.duration : 0,
  };
}

function formatTimestamp(totalSeconds: number): string {
  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function seekTo(seconds: number) {
  const video = getVideo();
  if (video) video.currentTime = seconds;
}

function showNoteToast(note: MomentNote) {
  document.querySelector('#cuebit-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'cuebit-toast';
  toast.textContent = `✎  ${formatTimestamp(note.seconds)} — ${note.text}`;
  toast.setAttribute('role', 'status');
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function closeComposer() {
  composer?.remove();
  composer = undefined;
}

function stopPlayerShortcutsWhileComposing(event: KeyboardEvent) {
  if (composer?.contains(event.target as Node)) {
    if (event.type === 'keydown' && event.key === 'Enter' && event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      if (!event.repeat) composer.querySelector<HTMLFormElement>('.cuebit-composer-form')?.requestSubmit();
    }
    // YouTube listens for player shortcuts above the composer in the event tree.
    // Stop the event from reaching those handlers without cancelling the browser's
    // default editing behavior (including inserting spaces in the textarea).
    event.stopImmediatePropagation();
  }
}

function openComposerFromShortcut(event: KeyboardEvent) {
  if (
    event.key.toLowerCase() !== 'b'
    || event.repeat
    || event.altKey
    || event.ctrlKey
    || event.metaKey
    || composer
    || !currentVideoId()
    || !getVideo()
  ) return;

  const target = event.target;
  if (target instanceof HTMLElement && (
    target.isContentEditable
    || target.closest('input, textarea, select, [role="textbox"]')
  )) return;

  // Claim the key so YouTube doesn't interpret it as a player shortcut.
  event.preventDefault();
  event.stopImmediatePropagation();
  openComposer();
}

function openComposer() {
  closeComposer();
  const player = document.querySelector<HTMLElement>('#movie_player');
  const snapshot = getSnapshot();
  if (!player || !snapshot) return;

  const panel = document.createElement('section');
  panel.id = 'cuebit-composer';
  panel.innerHTML = `
    <header class="cuebit-composer-header">
      <div><strong>Save a moment</strong><span class="cuebit-composer-time"></span></div>
      <button class="cuebit-composer-close" type="button" aria-label="Close note form">×</button>
    </header>
    <form class="cuebit-composer-form">
      <textarea class="cuebit-composer-text" maxlength="500" required aria-keyshortcuts="Control+Enter" placeholder="What do you want to remember here?"></textarea>
      <p class="cuebit-composer-hint">Ctrl + Enter to save</p>
      <p class="cuebit-composer-error" hidden></p>
      <footer class="cuebit-composer-actions">
        <button class="cuebit-composer-cancel" type="button">Cancel</button>
        <button class="cuebit-composer-save" type="submit">Save note</button>
      </footer>
    </form>`;
  panel.querySelector<HTMLElement>('.cuebit-composer-time')!.textContent = formatTimestamp(snapshot.seconds);
  const textarea = panel.querySelector<HTMLTextAreaElement>('.cuebit-composer-text')!;
  const form = panel.querySelector<HTMLFormElement>('.cuebit-composer-form')!;
  const saveButton = panel.querySelector<HTMLButtonElement>('.cuebit-composer-save')!;
  const error = panel.querySelector<HTMLElement>('.cuebit-composer-error')!;
  panel.querySelector('.cuebit-composer-close')!.addEventListener('click', closeComposer);
  panel.querySelector('.cuebit-composer-cancel')!.addEventListener('click', closeComposer);
  panel.addEventListener('click', (event) => event.stopPropagation());
  panel.addEventListener('keydown', (event) => event.stopPropagation());
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const text = textarea.value.trim();
    if (!text) return;
    saveButton.disabled = true;
    saveButton.textContent = 'Saving…';
    error.hidden = true;
    try {
      const saved = await browser.runtime.sendMessage({
        type: 'notes:create',
        note: {
          videoId: snapshot.videoId,
          videoTitle: snapshot.videoTitle,
          videoUrl: snapshot.videoUrl,
          seconds: snapshot.seconds,
          text,
        },
      } satisfies ExtensionMessage) as MomentNote;
      await loadNotes();
      closeComposer();
      showNoteToast(saved);
    } catch {
      error.textContent = 'Could not save the note. Try again.';
      error.hidden = false;
      saveButton.disabled = false;
      saveButton.textContent = 'Save note';
    }
  });
  player.append(panel);
  composer = panel;
  textarea.focus();
}

function ensureTimelineButton() {
  const controls = document.querySelector<HTMLElement>('.ytp-left-controls');
  if (!controls || controls.querySelector('#cuebit-add-button')) return;
  const button = document.createElement('button');
  button.id = 'cuebit-add-button';
  button.type = 'button';
  button.className = 'ytp-button cuebit-add-button';
  button.title = 'Add a note at the current time (B or Alt+Shift+N)';
  button.setAttribute('aria-label', 'Add a note at the current time (B or Alt+Shift+N)');
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.75h12a1.25 1.25 0 0 1 1.25 1.25v15l-7.25-4.5-7.25 4.5V5A1.25 1.25 0 0 1 6 3.75Z"/><path d="M12 7v6M9 10h6"/></svg>';
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    openComposer();
  });
  const timeDisplay = controls.querySelector('.ytp-time-display');
  if (timeDisplay?.nextSibling) controls.insertBefore(button, timeDisplay.nextSibling);
  else controls.append(button);
}

function drawMarkers() {
  const progress = document.querySelector<HTMLElement>('.ytp-progress-bar-container');
  const video = getVideo();
  if (!progress || !video || !Number.isFinite(video.duration) || video.duration <= 0) return;

  const signature = `${videoId}:${video.duration}:${notes.map((note) => `${note.id}@${note.seconds}`).join(',')}`;
  const existing = progress.querySelector('#cuebit-marker-layer');
  if (existing && signature === renderedSignature) return;
  existing?.remove();

  const layer = document.createElement('div');
  layer.id = 'cuebit-marker-layer';
  layer.setAttribute('aria-label', 'Saved note markers');
  for (const note of notes) {
    const marker = document.createElement('button');
    marker.type = 'button';
    marker.className = 'cuebit-marker';
    marker.style.left = `${Math.min(100, Math.max(0, (note.seconds / video.duration) * 100))}%`;
    marker.title = `${formatTimestamp(note.seconds)} · ${note.text}`;
    marker.setAttribute('aria-label', `Go to ${formatTimestamp(note.seconds)}: ${note.text}`);
    marker.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      seekTo(note.seconds);
      showNoteToast(note);
    });
    layer.append(marker);
  }
  progress.append(layer);
  renderedSignature = signature;
}

async function loadNotes() {
  const nextVideoId = currentVideoId();
  if (!nextVideoId) return;
  if (videoId && nextVideoId !== videoId) closeComposer();
  videoId = nextVideoId;
  renderedSignature = '';
  try {
    notes = await browser.runtime.sendMessage({ type: 'video:get-notes', videoId } satisfies ExtensionMessage);
  } catch {
    notes = [];
  }
  drawMarkers();
  ensureTimelineButton();
}

function scheduleRefresh() {
  if (refreshTimer) window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => {
    if (currentVideoId() !== videoId) void loadNotes();
    else {
      drawMarkers();
      ensureTimelineButton();
    }
  }, 180);
}

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  runAt: 'document_idle',
  main() {
    // Capture before YouTube's document-level keyboard shortcuts. Do not call
    // preventDefault here: text editing in the composer must remain native.
    window.addEventListener('keydown', stopPlayerShortcutsWhileComposing, true);
    window.addEventListener('keyup', stopPlayerShortcutsWhileComposing, true);
    window.addEventListener('keydown', openComposerFromShortcut, true);
    browser.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
      if (message.type === 'video:get-snapshot') {
        sendResponse(getSnapshot());
        return false;
      }
      if (message.type === 'video:seek') {
        seekTo(message.seconds);
        sendResponse(true);
        return false;
      }
      if (message.type === 'video:open-composer') {
        if (composer) composer.querySelector<HTMLTextAreaElement>('.cuebit-composer-text')?.focus();
        else if (currentVideoId() && getVideo()) openComposer();
        sendResponse(true);
        return false;
      }
      if (message.type === 'video:refresh-notes') {
        void loadNotes();
        sendResponse(true);
        return false;
      }
      return false;
    });
    void loadNotes();
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('yt-navigate-finish', scheduleRefresh);
    window.addEventListener('popstate', scheduleRefresh);
  },
});

