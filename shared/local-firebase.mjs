// Bộ lưu cục bộ tương thích với các bài tập được tạo từ mẫu Firebase.
// Khi triển khai cơ sở dữ liệu chung, thay lớp lưu ở đây và ở các mẫu UMD.
const listeners = new Map();
const storageKey = key => 'quiz_' + key;
const timestamp = ms => ({ toMillis: () => ms });

function read(ref) {
  try {
    const rows = JSON.parse(localStorage.getItem(storageKey(ref.key)) || '[]');
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    console.warn('Không đọc được kết quả bài tập:', error);
    return [];
  }
}

function emit(ref) {
  const snapshot = {
    docs: read(ref).map(row => ({
      id: row.id,
      data: () => ({ ...row, timestamp: row.timestampMillis ? timestamp(row.timestampMillis) : null })
    }))
  };
  for (const callback of listeners.get(ref.key) || []) callback(snapshot);
}

function write(ref, rows) {
  localStorage.setItem(storageKey(ref.key), JSON.stringify(rows));
  emit(ref);
}

export const initializeApp = config => ({ config });
export const getAuth = () => ({ currentUser: { uid: 'local-browser-user' } });
export const signInAnonymously = async auth => ({ user: auth.currentUser });
export const signInWithCustomToken = async auth => ({ user: auth.currentUser });
export const onAuthStateChanged = (auth, callback) => {
  queueMicrotask(() => callback(auth.currentUser));
  return () => {};
};
export const getFirestore = () => ({ local: true });
export const collection = (db, ...parts) => ({ key: parts.join('/') });
export const serverTimestamp = () => ({ __serverTimestamp: true });
export const doc = (db, ...parts) => ({ key: parts.slice(0, -1).join('/'), id: parts.at(-1) });

export async function addDoc(ref, data) {
  const id = 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  const item = { ...data, id, timestampMillis: Date.now() };
  delete item.timestamp;
  write(ref, [...read(ref), item]);
  return { id };
}

export function onSnapshot(ref, callback) {
  const callbacks = listeners.get(ref.key) || new Set();
  callbacks.add(callback);
  listeners.set(ref.key, callbacks);
  emit(ref);
  return () => callbacks.delete(callback);
}

export async function deleteDoc(ref) {
  write(ref, read(ref).filter(row => row.id !== ref.id));
}
