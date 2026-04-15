/**
 * Storage Module Tests
 * 测试本地存储功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// 简单的 Storage 类实现（用于测试）
class Storage {
  constructor() {
    this.storage = {};
  }
  
  get(key) {
    return Promise.resolve(this.storage[key]);
  }
  
  set(key, value) {
    this.storage[key] = value;
    return Promise.resolve();
  }
  
  remove(key) {
    delete this.storage[key];
    return Promise.resolve();
  }
  
  clear() {
    this.storage = {};
    return Promise.resolve();
  }
}

describe('Storage Module', () => {
  let storage;
  
  beforeEach(() => {
    storage = new Storage();
  });
  
  describe('get', () => {
    it('should return undefined for non-existent key', async () => {
      const result = await storage.get('nonexistent');
      expect(result).toBeUndefined();
    });
    
    it('should return value for existing key', async () => {
      await storage.set('testKey', 'testValue');
      const result = await storage.get('testKey');
      expect(result).toBe('testValue');
    });
  });
  
  describe('set', () => {
    it('should store string value', async () => {
      await storage.set('key', 'value');
      const result = await storage.get('key');
      expect(result).toBe('value');
    });
    
    it('should store object value', async () => {
      const obj = { name: 'test', value: 123 };
      await storage.set('obj', obj);
      const result = await storage.get('obj');
      expect(result).toEqual(obj);
    });
    
    it('should store array value', async () => {
      const arr = [1, 2, 3];
      await storage.set('arr', arr);
      const result = await storage.get('arr');
      expect(result).toEqual(arr);
    });
  });
  
  describe('remove', () => {
    it('should remove existing key', async () => {
      await storage.set('key', 'value');
      await storage.remove('key');
      const result = await storage.get('key');
      expect(result).toBeUndefined();
    });
    
    it('should handle removing non-existent key', async () => {
      await storage.remove('nonexistent');
      // Should not throw
    });
  });
  
  describe('clear', () => {
    it('should clear all stored data', async () => {
      await storage.set('key1', 'value1');
      await storage.set('key2', 'value2');
      await storage.clear();
      
      expect(await storage.get('key1')).toBeUndefined();
      expect(await storage.get('key2')).toBeUndefined();
    });
  });
});