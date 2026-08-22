import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { NotebookShell } from './NotebookShell';

// fake-indexeddb persists data across tests in the same file (it's not
// reset the way jsdom's document is) — each test must start from a genuinely
// empty notebook, or a note created by an earlier test gets auto-selected
// on mount and "start writing" never appears. Clearing the object stores
// directly (not deleteDatabase) — notebookDb.ts caches its connection at
// module scope for the life of the test file, and deleteDatabase blocks
// until every open connection closes, which this one never does between
// tests, so it just hangs.
function resetNotebookDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('olw-notebook', 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('doodles')) db.createObjectStore('doodles', { keyPath: 'id' });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(['notes', 'doodles'], 'readwrite');
      tx.objectStore('notes').clear();
      tx.objectStore('doodles').clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    };
  });
}

beforeEach(async () => {
  window.localStorage.clear();
  await resetNotebookDb();
});

afterEach(() => {
  cleanup();
});

async function createNote() {
  render(<NotebookShell />);
  await waitFor(() => expect(screen.getByText(/start writing/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/start writing/i));
  await waitFor(() => expect(screen.getByPlaceholderText('untitled')).toBeInTheDocument());
}

describe('NotebookShell fullscreen', () => {
  it('has a fullscreen toggle once a note exists', async () => {
    await createNote();
    expect(screen.getByLabelText('expand to fullscreen')).toBeInTheDocument();
  });

  it('toggling fullscreen does not remount the write editor (no data loss)', async () => {
    await createNote();
    const editorBefore = document.querySelector('.notebook-editable');
    expect(editorBefore).not.toBeNull();

    fireEvent.click(screen.getByLabelText('expand to fullscreen'));
    await waitFor(() => expect(screen.getByLabelText('exit fullscreen')).toBeInTheDocument());

    // Same DOM node, not a freshly-mounted one — this is the exact
    // invariant the fullscreen feature depends on: DoodleCanvas/RichTextEditor
    // must survive the toggle so drawings and cursor position aren't lost.
    const editorAfter = document.querySelector('.notebook-editable');
    expect(editorAfter).toBe(editorBefore);
  });

  it('toggling fullscreen does not remount the doodle canvas either', async () => {
    await createNote();
    fireEvent.click(screen.getByText('draw'));
    await waitFor(() => expect(document.querySelector('canvas')).not.toBeNull());
    const canvasBefore = document.querySelector('canvas');

    fireEvent.click(screen.getByLabelText('expand to fullscreen'));
    await waitFor(() => expect(screen.getByLabelText('exit fullscreen')).toBeInTheDocument());

    const canvasAfter = document.querySelector('canvas');
    expect(canvasAfter).toBe(canvasBefore);
  });

  it('Escape exits fullscreen', async () => {
    await createNote();
    fireEvent.click(screen.getByLabelText('expand to fullscreen'));
    await waitFor(() => expect(screen.getByLabelText('exit fullscreen')).toBeInTheDocument());

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.getByLabelText('expand to fullscreen')).toBeInTheDocument());
  });

  it('switching notes exits fullscreen automatically', async () => {
    await createNote();
    fireEvent.click(screen.getByLabelText('expand to fullscreen'));
    await waitFor(() => expect(screen.getByLabelText('exit fullscreen')).toBeInTheDocument());

    // create a second note — this should snap us back out of fullscreen
    fireEvent.click(screen.getByLabelText('new note'));
    await waitFor(() => expect(screen.getByLabelText('expand to fullscreen')).toBeInTheDocument());
  });
});
