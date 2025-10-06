// lib/line/event-store.ts

// Node.jsのグローバル変数を使用して、ホットリロード時でも保持
declare global {
  var lineFollowEvents: Map<string, { timestamp: Date }> | undefined;
}

// グローバルなイベントストア
class LineEventStore {
  private followEvents: Map<string, { timestamp: Date }>;

  constructor() {
    // グローバル変数が存在しない場合は新規作成、存在する場合は再利用
    if (!global.lineFollowEvents) {
      global.lineFollowEvents = new Map();
    }
    this.followEvents = global.lineFollowEvents;
  }

  public recordFollowEvent(lineUserId: string): void {
    this.followEvents.set(lineUserId, {
      timestamp: new Date(),
    });

    // 5分後に削除
    setTimeout(() => {
      this.followEvents.delete(lineUserId);
    }, 5 * 60 * 1000);
  }

  public getRecentEvents(): Map<string, { timestamp: Date }> {
    return this.followEvents;
  }

  public deleteEvent(lineUserId: string): void {
    this.followEvents.delete(lineUserId);
  }
}

// シングルトンインスタンス
export const lineEventStore = new LineEventStore();
