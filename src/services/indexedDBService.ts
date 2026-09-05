/**
 * نظام النسخ الاحتياطي في المتصفح عبر IndexedDB
 * يحفظ لقطات دورية وفورية من قاعدة البيانات لضمان عدم ضياع أي بيانات عند إغلاق المتصفح أو مسح الكوكيز
 */

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  label: string;
  recordsCount: {
    accounts: number;
    journalEntries: number;
    invoices: number;
    parties: number;
    certificates: number;
    treasury: number;
    clients: number;
  };
  sizeBytes: number;
  data: any;
}

export type IndexedDBSnapshot = BackupSnapshot;

const DB_NAME = 'Entersoft_Accounting_IndexedDB_v2';
const DB_VERSION = 1;
const STORE_NAME = 'backups_snapshots';
const MAX_SNAPSHOTS = 50;

class IndexedDBBackupService {
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private lastSavedDataHash: string = '';
  private lastBackupTime: string | null = null;
  private listeners: Array<() => void> = [];
  private intervalTimer: any = null;
  private isSaving: boolean = false;
  private isPageUnloading: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.isPageUnloading = true;
        this.stopAutoBackup();
        this.resetConnection();
      });
      window.addEventListener('pagehide', () => {
        this.isPageUnloading = true;
        this.stopAutoBackup();
        this.resetConnection();
      });
    }
  }

  private resetConnection() {
    if (this.db) {
      try {
        this.db.close();
      } catch {}
      this.db = null;
    }
    this.dbPromise = null;
  }

  private init(): Promise<IDBDatabase> {
    if (this.isPageUnloading) {
      return Promise.reject(new Error('Page is unloading'));
    }

    if (this.db) {
      return Promise.resolve(this.db);
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          this.db = db;

          db.onclose = () => {
            this.resetConnection();
          };

          db.onversionchange = () => {
            this.resetConnection();
          };

          db.onerror = () => {
            this.resetConnection();
          };

          resolve(db);
        };

        request.onerror = () => {
          this.resetConnection();
          reject(request.error || new Error('Failed to open IndexedDB'));
        };

        request.onblocked = () => {
          this.resetConnection();
          reject(new Error('IndexedDB open blocked'));
        };
      } catch (err) {
        this.resetConnection();
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * تنفيذ معاملة على IndexedDB مع معالجة إعادة الاتصال التلقائي في حال كان الاتصال مغلقاً
   */
  private async withTransaction<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore, tx: IDBTransaction) => Promise<T> | T
  ): Promise<T> {
    const execute = async (): Promise<T> => {
      const db = await this.init();
      return new Promise<T>((resolve, reject) => {
        let tx: IDBTransaction;
        try {
          tx = db.transaction(STORE_NAME, mode);
        } catch (err: any) {
          this.resetConnection();
          return reject(err);
        }

        const store = tx.objectStore(STORE_NAME);

        let opPromise: Promise<T>;
        try {
          const res = operation(store, tx);
          opPromise =
            res && typeof (res as any).then === 'function'
              ? (res as Promise<T>)
              : Promise.resolve(res as T);
        } catch (err) {
          try {
            tx.abort();
          } catch {}
          return reject(err);
        }

        let isTxDone = false;
        let txError: any = null;

        tx.oncomplete = () => {
          isTxDone = true;
        };

        tx.onerror = () => {
          txError = tx.error || new Error('Transaction error');
        };

        tx.onabort = () => {
          txError = tx.error || new Error('Transaction aborted');
        };

        opPromise
          .then((result) => {
            if (isTxDone) {
              if (txError) reject(txError);
              else resolve(result);
            } else {
              tx.oncomplete = () => resolve(result);
              tx.onerror = () => reject(tx.error || txError || new Error('Transaction error'));
              tx.onabort = () => reject(tx.error || txError || new Error('Transaction aborted'));
            }
          })
          .catch((err) => {
            try {
              tx.abort();
            } catch {}
            reject(err);
          });
      });
    };

    try {
      return await execute();
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      if (
        errMsg.includes('closing') ||
        errMsg.includes('closed') ||
        errMsg.includes('InvalidStateError') ||
        errMsg.includes('connection is closing')
      ) {
        this.resetConnection();
        await new Promise((r) => setTimeout(r, 150));
        return await execute();
      }
      throw err;
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {}
    });
  }

  public getLastBackupTime(): string | null {
    return this.lastBackupTime;
  }

  /**
   * حفظ لقطة جديدة لقاعدة البيانات في IndexedDB
   */
  public async saveSnapshot(data: any, label: string = 'نسخة تلقائية دورية'): Promise<BackupSnapshot | null> {
    if (this.isPageUnloading || !data) return null;

    try {
      const timestamp = new Date().toISOString();
      const id = `snap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const serialized = JSON.stringify(data);
      const sizeBytes = new Blob([serialized]).size;

      const recordsCount = {
        accounts: Array.isArray(data.accounts) ? data.accounts.length : 0,
        journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries.length : 0,
        invoices: Array.isArray(data.invoices) ? data.invoices.length : 0,
        parties: Array.isArray(data.parties) ? data.parties.length : 0,
        certificates: Array.isArray(data.certificates) ? data.certificates.length : 0,
        treasury: Array.isArray(data.treasuryTransactions) ? data.treasuryTransactions.length : 0,
        clients: Array.isArray(data.clientArchives) ? data.clientArchives.length : 0,
      };

      const snapshot: BackupSnapshot = {
        id,
        timestamp,
        label,
        recordsCount,
        sizeBytes,
        data,
      };

      await this.withTransaction('readwrite', (store) => {
        store.put(snapshot);
      });

      this.lastBackupTime = timestamp;
      this.lastSavedDataHash = this.computeHash(serialized);
      this.notify();

      // التنظيف في الخلفية بهدوء
      this.pruneOldSnapshots().catch(() => {});

      return snapshot;
    } catch (err) {
      console.warn('Could not save snapshot to IndexedDB:', err);
      return null;
    }
  }

  /**
   * جلب جميع اللقطات المخزنة مرتبة من الأحدث إلى الأقدم
   */
  public async getAllSnapshots(): Promise<BackupSnapshot[]> {
    if (this.isPageUnloading) return [];

    try {
      return await this.withTransaction('readonly', (store) => {
        return new Promise<BackupSnapshot[]>((resolve, reject) => {
          const req = store.getAll();
          req.onsuccess = () => {
            const list: BackupSnapshot[] = req.result || [];
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            resolve(list);
          };
          req.onerror = () => reject(req.error);
        });
      });
    } catch (err) {
      console.warn('Could not retrieve snapshots from IndexedDB:', err);
      return [];
    }
  }

  /**
   * حذف لقطة معينة
   */
  public async deleteSnapshot(id: string): Promise<boolean> {
    try {
      await this.withTransaction('readwrite', (store) => {
        store.delete(id);
      });
      this.notify();
      return true;
    } catch (err) {
      console.warn('Could not delete snapshot from IndexedDB:', err);
      return false;
    }
  }

  /**
   * حذف جميع اللقطات
   */
  public async clearAllSnapshots(): Promise<boolean> {
    try {
      await this.withTransaction('readwrite', (store) => {
        store.clear();
      });
      this.lastBackupTime = null;
      this.notify();
      return true;
    } catch (err) {
      console.warn('Could not clear snapshots from IndexedDB:', err);
      return false;
    }
  }

  /**
   * حذف اللقطات القديمة إذا تجاوزت الحد الأقصى
   */
  private async pruneOldSnapshots() {
    try {
      const snapshots = await this.getAllSnapshots();
      if (snapshots.length > MAX_SNAPSHOTS) {
        const toDelete = snapshots.slice(MAX_SNAPSHOTS);
        for (const snap of toDelete) {
          await this.deleteSnapshot(snap.id);
        }
      }
    } catch {}
  }

  /**
   * بدء النسخ الدوري التلقائي (كل 30 ثانية إلى دقيقة)
   */
  public startAutoBackup(getDatabaseData: () => any, intervalMs: number = 30000) {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }

    // First immediate backup after load
    setTimeout(() => {
      if (!this.isPageUnloading) {
        this.checkAndSaveBackup(getDatabaseData, 'نسخة افتتاحية عند بدء الجلسة');
      }
    }, 2000);

    // Periodic backups
    this.intervalTimer = setInterval(() => {
      if (!this.isPageUnloading) {
        this.checkAndSaveBackup(getDatabaseData, 'نسخة احتياطية دورية تلقائية (IndexedDB)');
      }
    }, intervalMs);
  }

  public stopAutoBackup() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private async checkAndSaveBackup(getDatabaseData: () => any, label: string) {
    if (this.isSaving || this.isPageUnloading) return;
    this.isSaving = true;

    try {
      const data = getDatabaseData();
      if (!data) return;
      const serialized = JSON.stringify(data);
      const currentHash = this.computeHash(serialized);

      // Only save if data actually changed or no backup exists yet
      if (currentHash !== this.lastSavedDataHash) {
        await this.saveSnapshot(data, label);
      }
    } catch (err) {
      console.warn('Auto backup check deferred:', err);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * جلب نسخة محددة عبر معرفها
   */
  public async getSnapshotById(id: string): Promise<BackupSnapshot | null> {
    try {
      return await this.withTransaction('readonly', (store) => {
        return new Promise<BackupSnapshot | null>((resolve, reject) => {
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
      });
    } catch (err) {
      console.warn('Could not retrieve snapshot by id:', err);
      return null;
    }
  }

  /**
   * إنشاء نسخة يدوية فورية من البيانات الحالية
   */
  public async createSnapshot(label: string = 'نسخة يدوية فورية'): Promise<BackupSnapshot | null> {
    try {
      const data: Record<string, any> = {};
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('elbaz_') || key.startsWith('enterSoft_') || key.startsWith('app_'))) {
            try {
              const val = localStorage.getItem(key);
              data[key] = val ? JSON.parse(val) : null;
            } catch {
              data[key] = localStorage.getItem(key);
            }
          }
        }
      }
      return await this.saveSnapshot(data, label);
    } catch (err) {
      console.warn('Failed to create manual snapshot:', err);
      return null;
    }
  }

  /**
   * استرجاع وتطبيق نسخة احتياطية على النظام
   */
  public async restoreSnapshot(id: string): Promise<boolean> {
    try {
      const snapshot = await this.getSnapshotById(id);
      if (!snapshot || !snapshot.data) return false;

      if (typeof window !== 'undefined' && window.localStorage) {
        const data = snapshot.data;
        Object.keys(data).forEach((key) => {
          const val = data[key];
          if (typeof val === 'string') {
            localStorage.setItem(key, val);
          } else {
            localStorage.setItem(key, JSON.stringify(val));
          }
        });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Failed to restore snapshot:', err);
      return false;
    }
  }

  /**
   * فحص ما إذا كان هناك نسخ في IndexedDB لاسترجاعها عند فتح متصفح جديد فارغ
   */
  public async getLatestSnapshot(): Promise<BackupSnapshot | null> {
    const list = await this.getAllSnapshots();
    return list.length > 0 ? list[0] : null;
  }

  private computeHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `${hash}_${str.length}`;
  }
}

export const indexedDBBackupService = new IndexedDBBackupService();
