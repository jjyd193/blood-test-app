import { openDB } from 'idb';

const DB_NAME = 'blood-test-db';
const DB_VERSION = 1;
const STORE_NAME = 'records';
const LEGACY_RECORDS_KEY = 'records';

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'date' });
        }
      },
    });
  }

  return dbPromise;
}

async function migrateLegacyRecords(db) {
  const rawRecords = localStorage.getItem(LEGACY_RECORDS_KEY);
  if (!rawRecords) return;

  try {
    const records = JSON.parse(rawRecords);
    if (!Array.isArray(records)) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(records.filter((record) => record?.date).map((record) => tx.store.put(record)));
    await tx.done;
    localStorage.removeItem(LEGACY_RECORDS_KEY);
  } catch (error) {
    console.error('Failed to migrate records from localStorage to IndexedDB.', error);
  }
}

export async function initDB() {
  const db = await getDB();
  await migrateLegacyRecords(db);
  return db;
}

export async function saveRecord(record) {
  const db = await initDB();
  await db.put(STORE_NAME, record);
}

export async function getAllRecords() {
  const db = await initDB();
  const records = await db.getAll(STORE_NAME);
  return records.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRecord(date) {
  const db = await initDB();
  return db.get(STORE_NAME, date);
}

export async function deleteRecord(date) {
  const db = await initDB();
  await db.delete(STORE_NAME, date);
}

export async function clearAllRecords() {
  const db = await initDB();
  await db.clear(STORE_NAME);
}
