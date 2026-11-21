import { useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, BookmarkPlus, Library, LoaderCircle, Play, Youtube } from 'lucide-react';
import { browser } from 'wxt/browser';
import { Button } from '../../src/components/ui/button';
import { Textarea } from '../../src/components/ui/textarea';
import { Logo } from '../../src/components/logo';
import { getActiveTab, getNotes, getVideoSnapshot, sendExtensionMessage, formatTimestamp } from '../../src/lib/messaging';
import type { MomentNote, VideoSnapshot } from '../../src/lib/types';
import '../../src/styles/global.css';

function Popup() {
  const [snapshot, setSnapshot] = useState<VideoSnapshot>();
  const [notes, setNotes] = useState<MomentNote[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    const tab = await getActiveTab();
    if (!tab?.id) {
      setSnapshot(undefined);
      setNotes([]);
      setLoading(false);
      return;
    }
    const current = await getVideoSnapshot(tab.id);
    setSnapshot(current);
    setNotes(current ? await getNotes(current.videoId) : []);
    setLoading(false);
  }

  useEffect(() => { void refresh(); }, []);

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    if (!snapshot || !draft.trim()) return;
    setSaving(true);
    setError('');
    try {
      const tab = await getActiveTab();
      const current = tab?.id ? await getVideoSnapshot(tab.id) : undefined;
      const capture = current ?? snapshot;
      const saved = await sendExtensionMessage<MomentNote>({
        type: 'notes:create',
        note: {
          videoId: capture.videoId,
          videoTitle: capture.videoTitle,
          videoUrl: capture.videoUrl,
          seconds: capture.seconds,
          text: draft.trim(),
        },
      });
      setSnapshot(capture);
      setNotes((items) => [saved, ...items].sort((a, b) => b.updatedAt - a.updatedAt));
      setDraft('');
      if (tab?.id) await browser.tabs.sendMessage(tab.id, { type: 'video:refresh-notes' }).catch(() => undefined);
    } catch {
      setError('Could not save this note. Try again.');
    } finally {
      setSaving(false);
    }
  }

  async function seek(seconds: number) {
    const tab = await getActiveTab();
    if (tab?.id) await browser.tabs.sendMessage(tab.id, { type: 'video:seek', seconds }).catch(() => undefined);
  }

  async function openLibrary() {
    await browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html') });
    window.close();
  }

  const recent = notes.slice(0, 4);

  return (
    <main className="atmosphere grain relative w-[390px] overflow-hidden p-5 text-cocoa-900">
      <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-24 size-72 animate-drift rounded-full bg-ember-400/30 blur-3xl" />
      <div className="relative z-10">
        <header className="mb-5 flex animate-rise items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={38} />
            <div>
              <p className="font-display text-[21px] leading-none font-medium tracking-tight text-cocoa-950">CueBit</p>
              <p className="mt-1 text-[11px] text-cocoa-900/55">Cue the moments that matter</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void openLibrary()} aria-label="Open library"><Library size={14} /> Library</Button>
        </header>

        {loading ? (
          <div className="flex h-40 items-center justify-center text-ember-700"><LoaderCircle className="animate-spin" size={20} /></div>
        ) : !snapshot ? (
          <section className="glass animate-rise rounded-3xl p-7 text-center">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-ember-500/15 text-ember-700"><Youtube size={22} /></div>
            <h1 className="font-display text-xl font-medium text-cocoa-950">Open a YouTube video</h1>
            <p className="mx-auto mt-2 max-w-[260px] text-xs leading-5 text-cocoa-900/60">Play a video, then click CueBit to keep a note at its current time.</p>
          </section>
        ) : (
          <>
            <section className="glass mb-4 animate-rise rounded-3xl p-4" style={{ animationDelay: '60ms' }}>
              <div className="eyebrow mb-2 flex items-center gap-2"><span className="size-1.5 rounded-full bg-ember-500 shadow-[0_0_8px_2px_rgb(255_107_53/0.55)]" /> Now watching</div>
              <h1 className="line-clamp-2 text-sm leading-5 font-semibold text-cocoa-950">{snapshot.videoTitle}</h1>
              <div className="mt-3 flex items-baseline gap-2 text-xs text-cocoa-900/55">
                Capturing at
                <span className="font-mono text-lg font-medium tracking-tight text-ember-700 tabular-nums">{formatTimestamp(snapshot.seconds)}</span>
              </div>
            </section>
            <form onSubmit={saveNote} className="animate-rise space-y-2.5" style={{ animationDelay: '120ms' }}>
              <div className="relative">
                <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={500} placeholder="What do you want to remember here?" aria-label="Note text" className="min-h-[92px] pb-7" />
                <span className="pointer-events-none absolute right-3.5 bottom-2.5 font-mono text-[10px] text-cocoa-900/30 tabular-nums">{draft.length}/500</span>
              </div>
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <Button className="w-full" disabled={!draft.trim() || saving}>
                {saving ? <LoaderCircle className="animate-spin" size={16} /> : <BookmarkPlus size={16} />}
                Save at {formatTimestamp(snapshot.seconds)}
              </Button>
            </form>
            <p className="mt-2.5 text-center text-[10px] text-cocoa-900/45">Faster: press <kbd className="rounded bg-cream-200 px-1 font-mono text-cocoa-900/70">B</kbd> on the video page, or <kbd className="rounded bg-cream-200 px-1 font-mono text-cocoa-900/70">Alt</kbd> + <kbd className="rounded bg-cream-200 px-1 font-mono text-cocoa-900/70">Shift</kbd> + <kbd className="rounded bg-cream-200 px-1 font-mono text-cocoa-900/70">N</kbd> from anywhere on the tab.</p>

            <section className="mt-6 animate-rise" style={{ animationDelay: '180ms' }}>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="eyebrow flex items-center gap-2">This video <span className="rounded-full bg-ember-500/15 px-1.5 py-0.5 text-ember-700">{notes.length}</span></h2>
                {notes.length > 4 && <button onClick={() => void openLibrary()} className="cursor-pointer text-[11px] font-medium text-ember-700 hover:text-ember-700">View all</button>}
              </div>
              {recent.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-cocoa-900/15 px-3 py-5 text-center text-xs text-cocoa-900/40">Your saved moments will show up here.</p>
              ) : (
                <ul className="relative space-y-1 before:absolute before:top-3 before:bottom-3 before:left-[34px] before:w-px before:bg-gradient-to-b before:from-ember-400/50 before:to-transparent">
                  {recent.map((note) => (
                    <li key={note.id}>
                      <button onClick={() => void seek(note.seconds)} className="group relative flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-cocoa-900/[0.06] focus-visible:ring-2 focus-visible:ring-cocoa-900/50 focus-visible:outline-none">
                        <span className="mt-0.5 w-[46px] shrink-0 rounded-md bg-cream-200 px-1.5 py-1 text-center font-mono text-[10px] text-ember-700 ring-1 ring-cocoa-900/15 tabular-nums">{formatTimestamp(note.seconds)}</span>
                        <span className="line-clamp-2 flex-1 pt-0.5 text-xs leading-5 text-cocoa-900/85">{note.text}</span>
                        <Play size={13} className="mt-1.5 shrink-0 text-cocoa-900/25 transition-colors group-hover:text-ember-700" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
        <footer className="mt-6 flex items-center justify-between border-t border-cocoa-900/10 pt-3 text-[10px] text-cocoa-900/40">
          <span>Saved only in this browser</span>
          <button className="inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-ember-700" onClick={() => void openLibrary()}>All notes <ArrowUpRight size={11} /></button>
        </footer>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
