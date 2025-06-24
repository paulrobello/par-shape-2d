/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CollectionUtils - Utilities for working with arrays, maps, and sets
 * 
 * Provides reusable patterns for:
 * - Array manipulation and transformation
 * - Map and Set operations
 * - Grouping and partitioning
 * - Searching and filtering
 * - Performance-optimized operations
 */

/**
 * Group result type
 */
export type GroupedMap<K, V> = Map<K, V[]>;

/**
 * Partition result type
 */
export type Partition<T> = [T[], T[]];

export class CollectionUtils {
  /**
   * Group array items by a key function
   * 
   * @example
   * const users = [
   *   { name: 'Alice', age: 25 },
   *   { name: 'Bob', age: 30 },
   *   { name: 'Charlie', age: 25 }
   * ];
   * const grouped = CollectionUtils.groupBy(users, u => u.age);
   * // Map { 25 => [{Alice}, {Charlie}], 30 => [{Bob}] }
   */
  static groupBy<T, K>(
    items: T[],
    keyFn: (item: T) => K
  ): GroupedMap<K, T> {
    const groups = new Map<K, T[]>();
    
    for (const item of items) {
      const key = keyFn(item);
      const group = groups.get(key) || [];
      group.push(item);
      groups.set(key, group);
    }
    
    return groups;
  }

  /**
   * Partition array into two based on predicate
   * 
   * @example
   * const numbers = [1, 2, 3, 4, 5];
   * const [evens, odds] = CollectionUtils.partition(numbers, n => n % 2 === 0);
   * // evens: [2, 4], odds: [1, 3, 5]
   */
  static partition<T>(
    items: T[],
    predicate: (item: T) => boolean
  ): Partition<T> {
    const truthy: T[] = [];
    const falsy: T[] = [];
    
    for (const item of items) {
      if (predicate(item)) {
        truthy.push(item);
      } else {
        falsy.push(item);
      }
    }
    
    return [truthy, falsy];
  }

  /**
   * Create array of unique items
   * 
   * @example
   * const unique = CollectionUtils.unique([1, 2, 2, 3, 3, 3]);
   * // [1, 2, 3]
   * 
   * const uniqueByProp = CollectionUtils.unique(users, u => u.id);
   */
  static unique<T>(
    items: T[],
    keyFn?: (item: T) => unknown
  ): T[] {
    if (!keyFn) {
      return [...new Set(items)];
    }
    
    const seen = new Set<unknown>();
    const result: T[] = [];
    
    for (const item of items) {
      const key = keyFn(item);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }
    
    return result;
  }

  /**
   * Chunk array into smaller arrays
   * 
   * @example
   * const chunks = CollectionUtils.chunk([1, 2, 3, 4, 5], 2);
   * // [[1, 2], [3, 4], [5]]
   */
  static chunk<T>(items: T[], size: number): T[][] {
    if (size <= 0) {
      throw new Error('Chunk size must be positive');
    }
    
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    
    return chunks;
  }

  /**
   * Flatten nested arrays to specified depth
   * 
   * @example
   * const nested = [1, [2, [3, [4]]]];
   * CollectionUtils.flatten(nested, 1); // [1, 2, [3, [4]]]
   * CollectionUtils.flatten(nested, 2); // [1, 2, 3, [4]]
   * CollectionUtils.flatten(nested, Infinity); // [1, 2, 3, 4]
   */
  static flatten<T>(items: any[], depth = 1): T[] {
    if (depth <= 0) return items as T[];
    
    return items.reduce((acc, item) => {
      if (Array.isArray(item)) {
        return acc.concat(this.flatten(item, depth - 1));
      }
      return acc.concat(item);
    }, []);
  }

  /**
   * Find first item matching predicate
   * 
   * @example
   * const user = CollectionUtils.find(users, u => u.age > 25);
   */
  static find<T>(
    items: T[],
    predicate: (item: T, index: number) => boolean
  ): T | undefined {
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i], i)) {
        return items[i];
      }
    }
    return undefined;
  }

  /**
   * Find last item matching predicate
   * 
   * @example
   * const lastEven = CollectionUtils.findLast([1, 2, 3, 4, 5], n => n % 2 === 0);
   * // 4
   */
  static findLast<T>(
    items: T[],
    predicate: (item: T, index: number) => boolean
  ): T | undefined {
    for (let i = items.length - 1; i >= 0; i--) {
      if (predicate(items[i], i)) {
        return items[i];
      }
    }
    return undefined;
  }

  /**
   * Create object from array using key and value functions
   * 
   * @example
   * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
   * const userMap = CollectionUtils.toObject(users, u => u.id, u => u.name);
   * // { 1: 'Alice', 2: 'Bob' }
   */
  static toObject<T, K extends string | number | symbol, V>(
    items: T[],
    keyFn: (item: T) => K,
    valueFn: (item: T) => V
  ): Record<K, V> {
    const result = {} as Record<K, V>;
    
    for (const item of items) {
      result[keyFn(item)] = valueFn(item);
    }
    
    return result;
  }

  /**
   * Merge multiple maps
   * 
   * @example
   * const merged = CollectionUtils.mergeMaps(map1, map2, map3);
   */
  static mergeMaps<K, V>(...maps: Map<K, V>[]): Map<K, V> {
    const result = new Map<K, V>();
    
    for (const map of maps) {
      for (const [key, value] of map) {
        result.set(key, value);
      }
    }
    
    return result;
  }

  /**
   * Filter map entries
   * 
   * @example
   * const filtered = CollectionUtils.filterMap(map, (k, v) => v > 10);
   */
  static filterMap<K, V>(
    map: Map<K, V>,
    predicate: (key: K, value: V) => boolean
  ): Map<K, V> {
    const result = new Map<K, V>();
    
    for (const [key, value] of map) {
      if (predicate(key, value)) {
        result.set(key, value);
      }
    }
    
    return result;
  }

  /**
   * Map over map values
   * 
   * @example
   * const doubled = CollectionUtils.mapValues(numberMap, v => v * 2);
   */
  static mapValues<K, V, R>(
    map: Map<K, V>,
    fn: (value: V, key: K) => R
  ): Map<K, R> {
    const result = new Map<K, R>();
    
    for (const [key, value] of map) {
      result.set(key, fn(value, key));
    }
    
    return result;
  }

  /**
   * Create range of numbers
   * 
   * @example
   * CollectionUtils.range(5); // [0, 1, 2, 3, 4]
   * CollectionUtils.range(2, 5); // [2, 3, 4]
   * CollectionUtils.range(0, 10, 2); // [0, 2, 4, 6, 8]
   */
  static range(start: number, end?: number, step = 1): number[] {
    if (end === undefined) {
      end = start;
      start = 0;
    }
    
    if (step === 0) {
      throw new Error('Step cannot be zero');
    }
    
    const result: number[] = [];
    if (step > 0) {
      for (let i = start; i < end; i += step) {
        result.push(i);
      }
    } else {
      for (let i = start; i > end; i += step) {
        result.push(i);
      }
    }
    
    return result;
  }

  /**
   * Shuffle array (Fisher-Yates)
   * 
   * @example
   * const shuffled = CollectionUtils.shuffle([1, 2, 3, 4, 5]);
   */
  static shuffle<T>(items: T[]): T[] {
    const result = [...items];
    
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    
    return result;
  }

  /**
   * Sample random items from array
   * 
   * @example
   * const sample = CollectionUtils.sample([1, 2, 3, 4, 5], 3);
   * // e.g., [2, 5, 1]
   */
  static sample<T>(items: T[], count: number): T[] {
    if (count >= items.length) {
      return this.shuffle(items);
    }
    
    const indices = new Set<number>();
    const result: T[] = [];
    
    while (indices.size < count) {
      const index = Math.floor(Math.random() * items.length);
      if (!indices.has(index)) {
        indices.add(index);
        result.push(items[index]);
      }
    }
    
    return result;
  }

  /**
   * Get intersection of multiple arrays
   * 
   * @example
   * const common = CollectionUtils.intersection([1, 2, 3], [2, 3, 4], [3, 4, 5]);
   * // [3]
   */
  static intersection<T>(...arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    if (arrays.length === 1) return [...arrays[0]];
    
    const [first, ...rest] = arrays;
    const sets = rest.map(arr => new Set(arr));
    
    return first.filter(item => 
      sets.every(set => set.has(item))
    );
  }

  /**
   * Get union of multiple arrays
   * 
   * @example
   * const all = CollectionUtils.union([1, 2], [2, 3], [3, 4]);
   * // [1, 2, 3, 4]
   */
  static union<T>(...arrays: T[][]): T[] {
    return this.unique(arrays.flat());
  }

  /**
   * Get difference between arrays (items in first but not in others)
   * 
   * @example
   * const diff = CollectionUtils.difference([1, 2, 3, 4], [2, 4], [3]);
   * // [1]
   */
  static difference<T>(source: T[], ...exclude: T[][]): T[] {
    const excludeSet = new Set(exclude.flat());
    return source.filter(item => !excludeSet.has(item));
  }

  /**
   * Zip multiple arrays together
   * 
   * @example
   * const zipped = CollectionUtils.zip([1, 2, 3], ['a', 'b', 'c']);
   * // [[1, 'a'], [2, 'b'], [3, 'c']]
   */
  static zip<T extends unknown[][]>(...arrays: T): Array<{ [K in keyof T]: T[K] extends (infer U)[] ? U : never }> {
    if (arrays.length === 0) return [];
    
    const minLength = Math.min(...arrays.map(arr => arr.length));
    const result: any[] = [];
    
    for (let i = 0; i < minLength; i++) {
      result.push(arrays.map(arr => arr[i]));
    }
    
    return result;
  }

  /**
   * Count occurrences of items
   * 
   * @example
   * const counts = CollectionUtils.countBy(['a', 'b', 'a', 'c', 'b', 'a']);
   * // Map { 'a' => 3, 'b' => 2, 'c' => 1 }
   */
  static countBy<T, K>(
    items: T[],
    keyFn?: (item: T) => K
  ): Map<K | T, number> {
    const counts = new Map<K | T, number>();
    
    for (const item of items) {
      const key = keyFn ? keyFn(item) : item;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    
    return counts;
  }

  /**
   * Sort array by multiple criteria
   * 
   * @example
   * const sorted = CollectionUtils.sortBy(users, [
   *   { key: u => u.age, order: 'asc' },
   *   { key: u => u.name, order: 'desc' }
   * ]);
   */
  static sortBy<T>(
    items: T[],
    criteria: Array<{
      key: (item: T) => any;
      order?: 'asc' | 'desc';
    }>
  ): T[] {
    return [...items].sort((a, b) => {
      for (const { key, order = 'asc' } of criteria) {
        const aVal = key(a);
        const bVal = key(b);
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
}