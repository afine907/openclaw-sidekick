/**
 * OpenClaw Sidekick - 数据持久化模块
 * 提供本地存储、IndexedDB、Sync 等功能
 */

// 本地存储管理器
class StorageManager {
  constructor() {
    this.prefix = 'openclaw_';
  }

  // 基础存储操作
  set(key, value) {
    const fullKey = this.prefix + key;
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  }

  get(key, defaultValue = null) {
    const fullKey = this.prefix + key;
    try {
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage get error:', e);
      return defaultValue;
    }
  }

  remove(key) {
    const fullKey = this.prefix + key;
    localStorage.removeItem(fullKey);
  }

  clear() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this.prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }

  // 批量操作
  setMultiple(items) {
    for (const [key, value] of Object.entries(items)) {
      this.set(key, value);
    }
  }

  getMultiple(keys) {
    const result = {};
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result;
  }

  // 过期存储
  setEx(key, value, ttlSeconds) {
    const data = {
      value,
      expires: Date.now() + ttlSeconds * 1000
    };
    this.set(key, data);
  }

  getEx(key, defaultValue = null) {
    const data = this.get(key);
    if (!data || !data.expires) return defaultValue;
    
    if (Date.now() > data.expires) {
      this.remove(key);
      return defaultValue;
    }
    
    return data.value;
  }

  // 键值迭代
  keys() {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .map(k => k.slice(this.prefix.length));
  }

  // 存储大小
  size() {
    let total = 0;
    for (const key of this.keys()) {
      total += (localStorage.getItem(this.prefix + key) || '').length;
    }
    return total;
  }
}

// IndexedDB 管理器
class IndexedDBManager {
  constructor(dbName = 'openclaw', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
    this._initPromise = this._init();
  }

  async _init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // 创建默认对象存储
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }

  async ready() {
    await this._initPromise;
    return this;
  }

  async _getStore(storeName, mode = 'readonly') {
    await this._initPromise;
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  // CRUD 操作
  async put(storeName, data) {
    const store = await this._getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const store = await this._getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const store = await this._getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const store = await this._getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const store = await this._getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // 游标遍历
  async iterate(storeName, callback) {
    const store = await this._getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          callback(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 索引操作
  async createIndex(storeName, indexName, keyPath, unique = false) {
    const store = this.db.transaction(storeName, 'versionchange').objectStore(storeName);
    store.createIndex(indexName, keyPath, { unique });
  }

  async getByIndex(storeName, indexName, value) {
    const store = await this._getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.get(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Sync 同步管理器
class SyncManager {
  constructor(storageManager) {
    this.storage = storageManager;
    this.syncQueue = [];
    this.syncing = false;
    this.lastSync = null;
    this.listeners = new Map();
  }

  // 队列操作
  async queue(action) {
    this.syncQueue.push({
      ...action,
      timestamp: Date.now(),
      id: this.generateId()
    });
    await this.persistQueue();
  }

  async persistQueue() {
    this.storage.set('sync_queue', this.syncQueue);
  }

  async loadQueue() {
    this.syncQueue = this.storage.get('sync_queue', []);
  }

  // 同步方法
  async sync(remoteHandler) {
    if (this.syncing) return;
    this.syncing = true;

    try {
      await this.loadQueue();
      
      const failed = [];
      
      for (const action of this.syncQueue) {
        try {
          await remoteHandler(action);
          this.syncQueue.shift();
        } catch (e) {
          failed.push({ action, error: e.message });
        }
      }
      
      await this.persistQueue();
      this.lastSync = Date.now();
      
      // 触发监听器
      this.emit('sync', { success: failed.length === 0, failed });
      
      return { success: failed.length === 0, failed };
    } finally {
      this.syncing = false;
    }
  }

  // 冲突解决
  async resolveConflict(local, remote, strategy = 'latest') {
    if (strategy === 'latest') {
      return local.updatedAt > remote.updatedAt ? local : remote;
    } else if (strategy === 'local') {
      return local;
    } else if (strategy === 'remote') {
      return remote;
    }
    return local;
  }

  // 监听器
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(cb => cb(data));
    }
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 数据导出/导入
class DataExporter {
  constructor(storageManager, indexedDBManager) {
    this.storage = storageManager;
    this.db = indexedDBManager;
  }

  async exportAll() {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      localStorage: {},
      indexedDB: {}
    };

    // 导出 localStorage
    for (const key of this.storage.keys()) {
      data.localStorage[key] = this.storage.get(key);
    }

    // 导出 IndexedDB
    try {
      await this.db.ready();
      data.indexedDB.messages = await this.db.getAll('messages');
      data.indexedDB.settings = await this.db.getAll('settings');
    } catch (e) {
      console.error('Export IndexedDB error:', e);
    }

    return data;
  }

  exportJSON() {
    return this.exportAll().then(data => JSON.stringify(data, null, 2));
  }

  async importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      // 验证版本
      if (!data.version) {
        throw new Error('Invalid backup format');
      }

      // 导入 localStorage
      if (data.localStorage) {
        for (const [key, value] of Object.entries(data.localStorage)) {
          this.storage.set(key, value);
        }
      }

      // 导入 IndexedDB
      if (data.indexedDB) {
        await this.db.ready();
        
        if (data.indexedDB.messages) {
          for (const msg of data.indexedDB.messages) {
            await this.db.put('messages', msg);
          }
        }
        
        if (data.indexedDB.settings) {
          for (const setting of data.indexedDB.settings) {
            await this.db.put('settings', setting);
          }
        }
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  downloadAsFile(filename = 'openclaw-backup.json') {
    return this.exportJSON().then(json => {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async uploadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = await this.importJSON(e.target.result);
        resolve(result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }
}

// 消息持久化
class MessageStore {
  constructor(indexedDBManager) {
    this.db = indexedDBManager;
  }

  async save(message) {
    const record = {
      id: message.id || this.generateId(),
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
      metadata: message.metadata || {}
    };
    
    await this.db.put('messages', record);
    return record;
  }

  async saveBatch(messages) {
    for (const msg of messages) {
      await this.save(msg);
    }
  }

  async get(id) {
    return await this.db.get('messages', id);
  }

  async getAll(limit = 100, offset = 0) {
    const all = await this.db.getAll('messages');
    return all
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit);
  }

  async search(query) {
    const results = [];
    await this.db.iterate('messages', (msg) => {
      if (msg.content.toLowerCase().includes(query.toLowerCase())) {
        results.push(msg);
      }
    });
    return results;
  }

  async delete(id) {
    return await this.db.delete('messages', id);
  }

  async clear() {
    return await this.db.clear('messages');
  }

  generateId() {
    return 'msg_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// 设置持久化
class SettingsStore {
  constructor(indexedDBManager) {
    this.db = indexedDBManager;
  }

  async set(key, value) {
    return await this.db.put('settings', {
      key,
      value,
      updatedAt: new Date().toISOString()
    });
  }

  async get(key, defaultValue = null) {
    const record = await this.db.get('settings', key);
    return record ? record.value : defaultValue;
  }

  async delete(key) {
    return await this.db.delete('settings', key);
  }

  async getAll() {
    return await this.db.getAll('settings');
  }

  async import(settings) {
    for (const [key, value] of Object.entries(settings)) {
      await this.set(key, value);
    }
  }
}

// 导出模块
window.StorageManager = StorageManager;
window.IndexedDBManager = IndexedDBManager;
window.SyncManager = SyncManager;
window.DataExporter = DataExporter;
window.MessageStore = MessageStore;
window.SettingsStore = SettingsStore;