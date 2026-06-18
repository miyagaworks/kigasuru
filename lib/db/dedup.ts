import {
  getDB,
  getAllShots,
  updateShot,
  deleteShot,
  invalidateShotsCache,
  type Shot,
} from './index';

/**
 * 端末ローカル(IndexedDB)の既存 shot 重複を「安全に1回」掃除するユーティリティ。
 * （Phase 2 / 2026-06-18 重複バグ後始末。docs/research/2026-06-18-offline-sync-duplicate-rootcause.md）
 *
 * ── 何をするか ─────────────────────────────────────────────
 * 同一 serverId を共有してしまっているローカル重複行を、serverId 単位で 1 行に畳む。
 * serverId はサーバー側の主キー（cuid）なので、ローカルに何行あってもサーバー上は 1 行。
 * 「掃除」とは「冗長なローカルコピーを 1 行に集約し、各 17 項目を非破壊マージで救出する」こと。
 *
 * ── データ消失ゼロの不変条件（最重要） ───────────────────────
 *  1. serverId == null（未同期 create）の行は対象外。グループ化も削除も一切しない。
 *  2. ローカル行の DELETE は「マージ結果を PUT /api/shots/{serverId} で server に反映し、
 *     200 OK を確認した後」だけ実行する。PUT 前・PUT 失敗時は絶対に削除しない。
 *  3. 削除されるのは「代表行以外の兄弟」だけ。代表行は残り、かつマージ済みデータを持つ。
 *     ∴ 削除の瞬間、マージ済みデータは「server」と「ローカル代表行」の両方に存在する。
 *  4. 競合フィールドは破棄しない。memo は連結して救出する。その他はマージ優先順位で 1 値を選び、
 *     捨てた値は dryRun レポートに必ず明示する（黙って消さない）。
 *  5. どの兄弟も値を持たない項目は PUT 本文から省く（null を送らない）。PUT ルートは undefined を
 *     「変更なし」と扱うため、空項目は server の既存値が保持される（server 値を null で消す事故の防止）。
 *  6. PUT が 404（server 未存在）/ 失敗 → そのグループは一切触らず（削除もマージ書き戻しもしない）、
 *     レポートに記録して次のグループへ。再実行で続行できる（冪等）。
 *
 * ── 使い方（DevTools コンソール） ─────────────────────────────
 *   1) 点検（既定・何も変更しない）: await __dedupeShots({ dryRun: true })
 *   2) 問題なければ実行:             await __dedupeShots({ dryRun: false, confirm: true })
 */

// ── マージ対象の編集可能 17 項目（lib/db/index.ts: toEditableFields と同一集合） ──
type FieldKind = 'string' | 'number' | 'result' | 'boolean' | 'memo';

const MERGE_FIELDS: { key: keyof Shot; kind: FieldKind }[] = [
  { key: 'date', kind: 'string' },
  { key: 'club', kind: 'string' },
  { key: 'distance', kind: 'number' },
  { key: 'slope', kind: 'string' },
  { key: 'lie', kind: 'string' },
  { key: 'strength', kind: 'string' },
  { key: 'wind', kind: 'string' },
  { key: 'temperature', kind: 'string' },
  { key: 'result', kind: 'result' },
  { key: 'feeling', kind: 'string' },
  { key: 'memo', kind: 'memo' },
  { key: 'golfCourse', kind: 'string' },
  { key: 'latitude', kind: 'number' },
  { key: 'longitude', kind: 'number' },
  { key: 'actualTemperature', kind: 'number' },
  { key: 'missType', kind: 'string' },
  { key: 'manualLocation', kind: 'boolean' },
];

const MEMO_SEP = '\n';

// ── サーバー行（GET /api/shots）のうち本処理で参照する最小フィールド ──
interface ServerShotLite {
  id: string;
  clientId: string | null;
}

export interface DedupeOptions {
  /** true（既定）: 何も変更せず点検レポートのみ。false: 実変更（confirm 必須）。 */
  dryRun?: boolean;
  /** dryRun:false のとき必須。誤実行防止のガード。 */
  confirm?: boolean;
}

export interface DedupeGroupReport {
  serverId: string;
  /** グループの行数（= ローカル重複コピー数） */
  size: number;
  representativeLocalId: number | undefined;
  /** マージで代表行の値が変わる項目（救出）。"key: 旧→新" 形式。 */
  rescued: string[];
  /** memo 競合（2 つ以上の異なる非空 memo を連結救出）。 */
  memoConflict: { memos: string[]; merged: string } | null;
  /** memo 以外で値が割れた項目（優先順位で 1 値採用・捨てた値も記録）。 */
  fieldConflicts: { field: string; kept: string; dropped: string[] }[];
  /** clientId を server 値（または兄弟の非 null 値）へ正規化する場合の新旧。 */
  clientIdChange: { from: string | null; to: string | null } | null;
  plannedDeletions: number;
  /** server 上に当該 serverId が存在するか。null=未確認（オフライン/GET 失敗）。 */
  serverExists: boolean | null;
  status:
    | 'planned' // dryRun
    | 'merged' // 実行成功（PUT→削除）
    | 'skipped-404' // server 未存在
    | 'skipped-error' // PUT 失敗・例外
    | 'skipped-offline'; // オフライン
  deleted: number;
}

export interface DedupeSummary {
  mode: 'dryRun' | 'execute' | 'aborted';
  totalLocalShots: number;
  /** serverId==null（未同期 create）。一切触らない。 */
  untouchedNullServerId: number;
  /** serverId を持つ行が属するグループ総数。 */
  totalGroups: number;
  /** 重複グループ（size>=2）数。 */
  duplicateGroups: number;
  /** 重複グループに含まれる行の総数。 */
  totalDuplicateRows: number;
  plannedDeletions: number;
  actualDeletions: number;
  memoConflicts: number;
  fieldConflicts: number;
  skipped404: number;
  skippedError: number;
  groups: DedupeGroupReport[];
}

// ── 値ヘルパー ──────────────────────────────────────────────

/** 当該 kind で「意味のある（非 null / 非空）値」か。number の 0 は有効値として残す。 */
function isMeaningful(kind: FieldKind, v: unknown): boolean {
  if (v === null || v === undefined) return false;
  switch (kind) {
    case 'string':
    case 'memo':
      return typeof v === 'string' && v.trim() !== '';
    case 'number':
      return typeof v === 'number' && !Number.isNaN(v);
    case 'result':
      return typeof v === 'object';
    case 'boolean':
      return true;
  }
}

/** 2 値が（当該 kind の意味で）等しいか。string は null/'' を同一視、result は構造比較。 */
function valuesEqual(kind: FieldKind, a: unknown, b: unknown): boolean {
  if (kind === 'result') {
    return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  }
  if (kind === 'string' || kind === 'memo') {
    const na = a === null || a === undefined ? '' : String(a);
    const nb = b === null || b === undefined ? '' : String(b);
    return na === nb;
  }
  if (kind === 'number') {
    const na = a === null || a === undefined ? null : a;
    const nb = b === null || b === undefined ? null : b;
    return na === nb;
  }
  return Boolean(a) === Boolean(b);
}

/** 競合時の優先度: [dirty を 1 とした数値, createdAt]。大きいほど優先。 */
function priorityRank(s: Shot): [number, number] {
  return [s.dirty ? 1 : 0, s.createdAt ?? 0];
}

/** 兄弟集合から最優先の 1 行を選ぶ（dirty → createdAt が新しい）。 */
function pickByPriority(shots: Shot[]): Shot {
  return shots.reduce((best, s) => {
    const rb = priorityRank(best);
    const rs = priorityRank(s);
    if (rs[0] !== rb[0]) return rs[0] > rb[0] ? s : best;
    if (rs[1] !== rb[1]) return rs[1] > rb[1] ? s : best;
    return best;
  });
}

/** 代表行（生き残るローカル行）の選定: dirty → createdAt 新しい → id 小（安定）。 */
function pickRepresentative(group: Shot[]): Shot {
  return group.reduce((best, s) => {
    const rb = priorityRank(best);
    const rs = priorityRank(s);
    if (rs[0] !== rb[0]) return rs[0] > rb[0] ? s : best;
    if (rs[1] !== rb[1]) return rs[1] > rb[1] ? s : best;
    return (s.id ?? Infinity) < (best.id ?? Infinity) ? s : best;
  });
}

/** 表示用に値を短く整形（空は「空」、長文は省略）。 */
function disp(kind: FieldKind, v: unknown): string {
  if (v === null || v === undefined || (kind !== 'number' && kind !== 'boolean' && String(v).trim() === '')) {
    return '空';
  }
  if (kind === 'result') return JSON.stringify(v);
  const s = String(v).replace(/\n/g, '⏎');
  return s.length > 40 ? `"${s.slice(0, 40)}…"` : `"${s}"`;
}

/**
 * memo を優先度順（dirty/新しい順）に集め、重複・包含を除いて返す。
 * 包含除去（短い memo が長い memo に内包される場合は長い方だけ残す）で、
 * 途中失敗→再実行時に連結が無限に伸びるのを防ぐ（冪等）。
 */
function collectMemos(group: Shot[]): string[] {
  const ordered = [...group].sort((a, b) => {
    const ra = priorityRank(a);
    const rb = priorityRank(b);
    if (ra[0] !== rb[0]) return rb[0] - ra[0];
    return rb[1] - ra[1];
  });
  const seen: string[] = [];
  for (const s of ordered) {
    const m = typeof s.memo === 'string' ? s.memo.trim() : '';
    if (m === '' || seen.includes(m)) continue;
    seen.push(m);
  }
  return seen.filter((m) => !seen.some((other) => other !== m && other.includes(m)));
}

interface SimpleMerge {
  /**
   * false = どの兄弟も意味のある値を持たない → PUT 本文から「省く」。
   * PUT ルートは undefined フィールドを「変更なし」として扱うため（app/api/shots/[id]/route.ts）、
   * 省けば server 側の既存値が保持される。null を送って server 値を消す事故を防ぐ（データ消失ゼロ）。
   */
  include: boolean;
  value: unknown;
  /** 値が割れた場合の捨てた値（採用値は除く）。割れていなければ null。 */
  dropped: unknown[] | null;
}

/** memo 以外（string/number/result）を非破壊マージ。空 base は兄弟の値で救出。兄弟全空なら include=false。 */
function mergeSimpleField(group: Shot[], rep: Shot, key: keyof Shot, kind: FieldKind): SimpleMerge {
  const base = rep[key];
  const cands = group.filter((s) => isMeaningful(kind, s[key]));
  if (cands.length === 0) {
    // 救出する値が無い → PUT で送らず server 値を維持（base はローカル代表に温存）。
    return { include: false, value: base, dropped: null };
  }
  const distinct: Shot[] = [];
  for (const s of cands) {
    if (!distinct.some((d) => valuesEqual(kind, d[key], s[key]))) distinct.push(s);
  }
  if (distinct.length === 1) {
    return { include: true, value: cands[0][key], dropped: null };
  }
  // 競合: 優先順位で 1 値採用、残りは dropped として記録（黙って消さない）。
  const winner = pickByPriority(cands);
  const dropped = distinct.map((d) => d[key]).filter((v) => !valuesEqual(kind, v, winner[key]));
  return { include: true, value: winner[key], dropped };
}

interface GroupMerge {
  /**
   * PUT 本文＝ローカル代表へ書き戻す項目。「兄弟に意味値がある項目」だけを含む。
   * 兄弟全空の項目は含めない（= PUT で送らず server 値を維持。ローカル代表も元のまま）。
   * date / club（必須）と boolean フラグは常に含む。
   */
  mergedFields: Record<string, unknown>;
  rescued: string[];
  memoConflict: { memos: string[]; merged: string } | null;
  fieldConflicts: { field: string; kept: string; dropped: string[] }[];
}

/** グループ（兄弟）を 1 行ぶんへマージする。代表行を基準に非破壊で救出（空項目は server 値を温存）。 */
function mergeGroup(group: Shot[], rep: Shot): GroupMerge {
  const mergedFields: Record<string, unknown> = {};
  const rescued: string[] = [];
  const fieldConflicts: { field: string; kept: string; dropped: string[] }[] = [];
  let memoConflict: { memos: string[]; merged: string } | null = null;

  const note = (key: keyof Shot, kind: FieldKind, base: unknown, merged: unknown) => {
    mergedFields[String(key)] = merged;
    if (!valuesEqual(kind, base, merged)) {
      rescued.push(`${String(key)}: ${disp(kind, base)}→${disp(kind, merged)}`);
    }
  };

  for (const { key, kind } of MERGE_FIELDS) {
    const base = rep[key];

    if (kind === 'memo') {
      const memos = collectMemos(group);
      if (memos.length === 0) continue; // 兄弟全空 → 送らない（server の memo を維持）
      const merged = memos.join(MEMO_SEP);
      if (memos.length >= 2) memoConflict = { memos, merged };
      note(key, kind, base, merged);
      continue;
    }

    if (kind === 'boolean') {
      // boolean は実在フラグ（空が無い）→ 常に送る。競合は優先順位の勝者（代表が最優先）。
      const distinct = [...new Set(group.map((s) => Boolean(s[key])))];
      let merged: boolean;
      if (distinct.length <= 1) {
        merged = Boolean(base);
      } else {
        const winner = pickByPriority(group);
        merged = Boolean(winner[key]);
        fieldConflicts.push({
          field: String(key),
          kept: String(merged),
          dropped: distinct.filter((v) => v !== merged).map(String),
        });
      }
      note(key, kind, base, merged);
      continue;
    }

    // string / number / result
    const r = mergeSimpleField(group, rep, key, kind);
    if (!r.include) continue; // 兄弟全空 → 送らない（server 値を維持）
    if (r.dropped && r.dropped.length > 0) {
      fieldConflicts.push({
        field: String(key),
        kept: disp(kind, r.value),
        dropped: r.dropped.map((v) => disp(kind, v)),
      });
    }
    note(key, kind, base, r.value);
  }

  return { mergedFields, rescued, memoConflict, fieldConflicts };
}

/**
 * clientId 正規化値を決める。
 *  - server の clientId が非 null → それに合わせる（server が正）。
 *  - server が null → 代表行→兄弟の順で非 null を維持（救出。決して null で上書き＝消去しない）。
 */
function resolveClientId(
  group: Shot[],
  rep: Shot,
  server: ServerShotLite | undefined
): { value: string | undefined; change: { from: string | null; to: string | null } | null } {
  const serverCid = server?.clientId ?? null;
  let target: string | undefined;
  if (serverCid) {
    target = serverCid;
  } else if (rep.clientId) {
    target = rep.clientId;
  } else {
    target = group.find((s) => s.clientId)?.clientId;
  }
  const from = rep.clientId ?? null;
  const to = target ?? null;
  return { value: target, change: from === to ? null : { from, to } };
}

// ── server 取得 ─────────────────────────────────────────────

/** GET /api/shots を取得し serverId→{id,clientId} の Map を返す。失敗時は null。 */
async function fetchServerShots(): Promise<Map<string, ServerShotLite> | null> {
  try {
    const res = await fetch('/api/shots', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    if (!data?.success || !Array.isArray(data.shots)) return null;
    const map = new Map<string, ServerShotLite>();
    for (const s of data.shots as { id: string; clientId: string | null }[]) {
      if (s?.id) map.set(s.id, { id: s.id, clientId: s.clientId ?? null });
    }
    return map;
  } catch {
    return null;
  }
}

// ── レポート出力 ─────────────────────────────────────────────

function logDryRunReport(summary: DedupeSummary, serverReachable: boolean): void {
  const line = '─'.repeat(56);
  console.log(`%c[dedup] 点検（dryRun）レポート`, 'color:#2563eb;font-weight:bold;font-size:13px');
  console.log(line);
  console.log(`ローカル総行数            : ${summary.totalLocalShots}`);
  console.log(`未同期(serverId=null)行   : ${summary.untouchedNullServerId}（対象外・触りません）`);
  console.log(`serverId グループ総数      : ${summary.totalGroups}`);
  console.log(`重複グループ(2件以上)      : ${summary.duplicateGroups}`);
  console.log(`重複グループ内の総行数     : ${summary.totalDuplicateRows}`);
  console.log(`削除予定（代表以外）       : ${summary.plannedDeletions} 行`);
  console.log(`memo 競合グループ          : ${summary.memoConflicts}`);
  console.log(`その他フィールド競合       : ${summary.fieldConflicts}`);
  if (!serverReachable) {
    console.warn('⚠️ server へ接続できず（オフライン/GET 失敗）。server 存在確認は未確定です。');
  }
  console.log(line);

  if (summary.duplicateGroups === 0) {
    console.log('✅ 重複は見つかりませんでした。掃除は不要です。');
  } else {
    summary.groups.forEach((g, i) => {
      const exists = g.serverExists === null ? '存在?(未確認)' : g.serverExists ? 'server存在' : 'server未存在(404予想→スキップ)';
      console.log(
        `%c▸ #${i + 1} serverId ${g.serverId.slice(0, 8)}…  ローカル ${g.size} 件 / 削除予定 ${g.plannedDeletions} 件  [${exists}]`,
        'color:#0f766e;font-weight:bold'
      );
      console.log(`    代表ローカルID: ${g.representativeLocalId}`);
      if (g.rescued.length > 0) {
        console.log(`    救出される項目 : ${g.rescued.join(' , ')}`);
      } else {
        console.log('    救出される項目 : なし（兄弟は全同一）');
      }
      if (g.memoConflict) {
        console.log(
          `%c    memo 競合（連結して救出）: ${g.memoConflict.memos.map((m) => `"${m.replace(/\n/g, '⏎')}"`).join(' + ')}`,
          'color:#b45309'
        );
      }
      if (g.fieldConflicts.length > 0) {
        g.fieldConflicts.forEach((c) =>
          console.log(`%c    競合 ${c.field}: 採用 ${c.kept} / 不採用 ${c.dropped.join(', ')}`, 'color:#b45309')
        );
      }
      if (g.clientIdChange) {
        console.log(`    clientId 正規化 : ${g.clientIdChange.from ?? 'null'} → ${g.clientIdChange.to ?? 'null'}`);
      }
    });
  }

  console.log(line);
  console.log('%c注: どの兄弟にも値が無い項目は PUT で送らず server の既存値を保持します（消去しません）。', 'color:#6b7280');
  console.log('%c次の手順:', 'font-weight:bold');
  console.log('  ① 上の内容（特に memo 競合・救出項目）に問題が無いか確認してください。');
  console.log('  ② 問題なければ実行: %cawait __dedupeShots({ dryRun: false, confirm: true })', 'color:#16a34a;font-weight:bold');
  console.log('     （オンライン状態で実行してください。1 serverId ずつ PUT 成功→削除。途中で止まっても再実行で続行できます）');
}

function logExecuteReport(summary: DedupeSummary): void {
  const line = '─'.repeat(56);
  console.log(`%c[dedup] 実行（execute）レポート`, 'color:#16a34a;font-weight:bold;font-size:13px');
  console.log(line);
  console.log(`畳んだ重複グループ : ${summary.groups.filter((g) => g.status === 'merged').length} / ${summary.duplicateGroups}`);
  console.log(`削除したローカル行 : ${summary.actualDeletions} 行`);
  console.log(`スキップ(404)      : ${summary.skipped404}（server 未存在。手動確認要）`);
  console.log(`スキップ(失敗)     : ${summary.skippedError}（再実行で続行できます）`);
  console.log(line);
  summary.groups.forEach((g, i) => {
    const label =
      g.status === 'merged'
        ? `✅ PUT成功 → ${g.deleted} 行削除`
        : g.status === 'skipped-404'
          ? '⏭️ 404: server未存在 → 触らずスキップ'
          : g.status === 'skipped-offline'
            ? '⏭️ オフライン → スキップ'
            : '⚠️ PUT失敗 → 触らずスキップ（再実行で続行）';
    console.log(`▸ #${i + 1} serverId ${g.serverId.slice(0, 8)}…  ${label}`);
  });
  console.log(line);
  if (summary.skipped404 + summary.skippedError > 0) {
    console.log('%c未処理が残っています。オンラインで await __dedupeShots({ dryRun:false, confirm:true }) を再実行してください。', 'color:#b45309');
  } else {
    console.log('%c✅ すべての重複を安全に掃除しました。', 'color:#16a34a;font-weight:bold');
  }
}

// ── 本体 ────────────────────────────────────────────────────

/**
 * 端末ローカルの shot 重複を serverId 単位で 1 回掃除する。
 *
 * @param opts.dryRun true（既定）=点検のみ / false=実変更（confirm:true 必須）
 * @param opts.confirm dryRun:false のとき必須
 */
export async function dedupeShotsByServerId(opts: DedupeOptions = {}): Promise<DedupeSummary> {
  const dryRun = opts.dryRun !== false; // 既定 true
  const confirm = opts.confirm === true;

  const empty: DedupeSummary = {
    mode: 'aborted',
    totalLocalShots: 0,
    untouchedNullServerId: 0,
    totalGroups: 0,
    duplicateGroups: 0,
    totalDuplicateRows: 0,
    plannedDeletions: 0,
    actualDeletions: 0,
    memoConflicts: 0,
    fieldConflicts: 0,
    skipped404: 0,
    skippedError: 0,
    groups: [],
  };

  // 環境ガード（ブラウザ専用）
  if (typeof window === 'undefined') {
    console.warn('[dedup] ブラウザ環境でのみ実行できます。');
    return empty;
  }

  // DB 初期化ガード: 既定 DB のままだと別(空)DBを掃除してしまうため拒否。
  if (getDB().name === 'KigasuruDB') {
    console.warn('[dedup] DB が未初期化です。ログイン後に「履歴」または「記録」ページを開いてから実行してください。');
    return empty;
  }

  // 実行モードのガード（誤実行防止）
  if (!dryRun && !confirm) {
    console.warn('%c[dedup] 実行モードには confirm:true が必須です。中止しました。', 'color:#dc2626;font-weight:bold');
    console.warn('  実行する場合: await __dedupeShots({ dryRun: false, confirm: true })');
    return { ...empty, mode: 'aborted' };
  }

  // 実行モードはオンライン必須（PUT/GET が要る）
  const online = typeof navigator === 'undefined' || navigator.onLine;
  if (!dryRun && !online) {
    console.warn('%c[dedup] オフラインのため実行できません。オンラインで再実行してください。', 'color:#dc2626;font-weight:bold');
    return { ...empty, mode: 'aborted' };
  }

  // ── ローカル行を取得（キャッシュ無視で最新）し serverId でグループ化 ──
  const localShots = await getAllShots(true);
  const groupsMap = new Map<string, Shot[]>();
  let untouchedNull = 0;
  for (const s of localShots) {
    if (!s.serverId) {
      untouchedNull++; // serverId==null は対象外（pushUnsyncedShots の領分）
      continue;
    }
    const arr = groupsMap.get(s.serverId);
    if (arr) arr.push(s);
    else groupsMap.set(s.serverId, [s]);
  }

  const duplicateGroups = [...groupsMap.entries()].filter(([, arr]) => arr.length >= 2);

  // ── server 取得（dryRun でも online なら存在確認/ clientId 用に取得） ──
  const serverMap = online ? await fetchServerShots() : null;
  const serverReachable = serverMap !== null;
  if (!dryRun && !serverReachable) {
    console.warn('%c[dedup] server へ接続できませんでした。オンラインで再実行してください。', 'color:#dc2626;font-weight:bold');
    return { ...empty, mode: 'aborted' };
  }

  const summary: DedupeSummary = {
    mode: dryRun ? 'dryRun' : 'execute',
    totalLocalShots: localShots.length,
    untouchedNullServerId: untouchedNull,
    totalGroups: groupsMap.size,
    duplicateGroups: duplicateGroups.length,
    totalDuplicateRows: duplicateGroups.reduce((n, [, arr]) => n + arr.length, 0),
    plannedDeletions: duplicateGroups.reduce((n, [, arr]) => n + (arr.length - 1), 0),
    actualDeletions: 0,
    memoConflicts: 0,
    fieldConflicts: 0,
    skipped404: 0,
    skippedError: 0,
    groups: [],
  };

  for (const [serverId, group] of duplicateGroups) {
    const rep = pickRepresentative(group);
    const siblings = group.filter((s) => s.id !== rep.id && s.id != null);
    const { mergedFields, rescued, memoConflict, fieldConflicts } = mergeGroup(group, rep);
    const serverShot = serverMap?.get(serverId);
    const { value: clientIdValue, change: clientIdChange } = resolveClientId(group, rep, serverShot);

    if (memoConflict) summary.memoConflicts++;
    summary.fieldConflicts += fieldConflicts.length;

    const report: DedupeGroupReport = {
      serverId,
      size: group.length,
      representativeLocalId: rep.id,
      rescued,
      memoConflict,
      fieldConflicts,
      clientIdChange,
      plannedDeletions: siblings.length,
      serverExists: serverReachable ? !!serverShot : null,
      status: 'planned',
      deleted: 0,
    };

    if (dryRun) {
      summary.groups.push(report);
      continue;
    }

    // ── 実行モード ── 不変条件: PUT 200 を確認した後にだけローカル行を削除する。
    if (rep.id == null) {
      report.status = 'skipped-error';
      summary.skippedError++;
      summary.groups.push(report);
      continue;
    }

    try {
      const res = await fetch(`/api/shots/${serverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mergedFields), // マージ結果（兄弟に値がある項目のみ。空項目は送らず server 値を維持）
      });

      if (res.status === 404) {
        // server 未存在: server 専用行ではなくローカル専用（serverId が宙吊り）。一切触らない。
        report.status = 'skipped-404';
        summary.skipped404++;
        summary.groups.push(report);
        continue;
      }

      if (!res.ok) {
        // 一時失敗（403/500/ネットワーク等）: ローカルは触らず次回再実行に委ねる。
        report.status = 'skipped-error';
        summary.skippedError++;
        summary.groups.push(report);
        continue;
      }

      // PUT 200: server にマージ済みデータが載った。
      // ① 代表行へマージ結果を書き戻し（dirty=false / clientId 正規化）。
      const repUpdate: Record<string, unknown> = { ...mergedFields, dirty: false };
      if (clientIdChange) repUpdate.clientId = clientIdValue;
      await updateShot(rep.id, repUpdate as Partial<Shot>);

      // ② server＋ローカル代表の双方にデータが在る状態で、冗長な兄弟だけを削除。
      let deleted = 0;
      for (const sib of siblings) {
        if (sib.id == null) continue;
        await deleteShot(sib.id);
        deleted++;
      }

      report.status = 'merged';
      report.deleted = deleted;
      summary.actualDeletions += deleted;
      summary.groups.push(report);
    } catch (e) {
      // 例外でもローカルは触らない（削除は try 内の PUT 200 後のみ）。次回再実行で続行。
      console.error(`[dedup] serverId ${serverId} の処理で例外:`, e);
      report.status = 'skipped-error';
      summary.skippedError++;
      summary.groups.push(report);
    }
  }

  invalidateShotsCache();

  if (dryRun) logDryRunReport(summary, serverReachable);
  else logExecuteReport(summary);

  return summary;
}

// ── DevTools コンソール公開 ─────────────────────────────────

let registered = false;

/**
 * window.__dedupeShots に dedupeShotsByServerId を公開する（ガード付き・冪等）。
 * initDB 後（DB 初期化済み）に呼ぶこと。Layout の初期化 effect から呼び出す。
 */
export function registerDedupConsoleHelper(): void {
  if (typeof window === 'undefined') return;
  if (registered) return;
  const w = window as unknown as { __dedupeShots?: typeof dedupeShotsByServerId };
  if (w.__dedupeShots) {
    registered = true;
    return;
  }
  w.__dedupeShots = dedupeShotsByServerId;
  registered = true;
  console.log('%c[dedup] 重複掃除ツール __dedupeShots を読み込みました。', 'color:#2563eb;font-weight:bold');
  console.log('  ① 点検: await __dedupeShots({ dryRun: true })');
  console.log('  ② 実行: await __dedupeShots({ dryRun: false, confirm: true })');
}
