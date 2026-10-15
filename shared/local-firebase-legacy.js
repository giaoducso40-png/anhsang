(function () {
  'use strict';
  const listeners = new Map();
  const keyOf = ref => 'quiz_' + ref.key;
  const read = ref => {
    try {
      const rows = JSON.parse(localStorage.getItem(keyOf(ref)) || '[]');
      return Array.isArray(rows) ? rows : [];
    } catch (error) { console.warn('Không đọc được bài làm:', error); return []; }
  };
  const emit = ref => {
    const snapshot = { docs: read(ref).map(row => ({
      id: row.id,
      data: () => ({ ...row, timestamp: row.timestampMillis ? { toMillis: () => row.timestampMillis } : null })
    })) };
    for (const callback of listeners.get(ref.key) || []) callback(snapshot);
  };
  const write = (ref, rows) => {
    localStorage.setItem(keyOf(ref), JSON.stringify(rows));
    emit(ref);
  };
  window.KHTNLocalFirebase = {
    initializeApp: config => ({ config }),
    getAuth: () => ({ currentUser: { uid: 'local-browser-user' } }),
    signInAnonymously: async auth => ({ user: auth.currentUser }),
    signInWithCustomToken: async auth => ({ user: auth.currentUser }),
    onAuthStateChanged: (auth, callback) => {
      queueMicrotask(() => callback(auth.currentUser));
      return () => {};
    },
    getFirestore: () => ({ local: true }),
    collection: (db, ...parts) => ({ key: parts.join('/') }),
    serverTimestamp: () => ({ __serverTimestamp: true }),
    doc: (db, ...parts) => ({ key: parts.slice(0, -1).join('/'), id: parts.at(-1) }),
    addDoc: async (ref, data) => {
      const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
      const item = { ...data, id, timestampMillis: Date.now() };
      delete item.timestamp;
      write(ref, [...read(ref), item]);
      return { id };
    },
    onSnapshot: (ref, callback) => {
      const callbacks = listeners.get(ref.key) || new Set();
      callbacks.add(callback);
      listeners.set(ref.key, callbacks);
      emit(ref);
      return () => callbacks.delete(callback);
    },
    deleteDoc: async ref => write(ref, read(ref).filter(row => row.id !== ref.id))
  };
})();
