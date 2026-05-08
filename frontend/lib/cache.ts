/**
 * In-memory client-side cache for "who liked me" data.
 * Used for optimistic match animation on swipe right.
 */

class LikedMeCache {
  private likedMeSet: Set<string> = new Set();

  load(userIds: string[]) {
    this.likedMeSet = new Set(userIds);
  }

  has(userId: string): boolean {
    return this.likedMeSet.has(userId);
  }

  add(userId: string) {
    this.likedMeSet.add(userId);
  }

  remove(userId: string) {
    this.likedMeSet.delete(userId);
  }

  clear() {
    this.likedMeSet.clear();
  }

  get size(): number {
    return this.likedMeSet.size;
  }
}

export const likedMeCache = new LikedMeCache();
