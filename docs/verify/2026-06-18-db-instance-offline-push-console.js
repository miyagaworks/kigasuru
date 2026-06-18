/**
 * ============================================================================
 * DBインスタンス二重化バグ修正(c4276ad) — 実機検証2-2 用
 * 「IndexedDB 読み取り専用 観測スニペット」（ブラウザ Console 貼り付け専用）
 * 作成日: 2026-06-18
 * 対象: ローカル開発サーバ(http://localhost:3000) の自分のアカウントの IndexedDB
 *       （※本検証は push 前に行う。修正コードは localhost のみで稼働。本番 app.kigasuru.com は旧コードなので使わない）
 * ----------------------------------------------------------------------------
 * 【背景：このスニペットが確かめること】
 *   本PWAは IndexedDB をユーザーごとに分離する（DB名は userId の有無で分岐）。
 *     - lib/db/index.ts:64-67 → const dbName = userId ? `KigasuruDB_${userId}` : 'KigasuruDB';
 *     - ログイン後は initDB(userId) で KigasuruDB_<userId>（正）を使う。
 *     - 未初期化フォールバックでは userId 無しの素の KigasuruDB（空・誤）が作られ得る。
 *   修正前バグ : 保存は KigasuruDB_<userId> に入るのに、push は素の KigasuruDB（空）を読み、
 *                オフライン作成ショットがサーバーへ送られなかった。
 *   修正後(c4276ad): push が getDB()=現在ユーザーの KigasuruDB_<userId> を読む。
 *   検証2-2    : オフライン作成ショット(serverId=null)が、オンライン復帰後に
 *                serverId を獲得するか（=正しく push されたか）を観測する。
 *
 * 【使い方】
 *   1. http://localhost:3000 に「自分のアカウントでログインした状態」のタブを開く（アドレスバーに localhost:3000 を
 *      クリーン入力。古い /render/quote… のURLが残っていたら必ず上書きする）。
 *   2. Option(⌥)+Cmd(⌘)+J で Console を開く（Chrome / Edge 推奨）。
 *   3. このファイルの「全文」を Console に貼り付けて Enter。
 *   4. 出力される「==== 観測サマリ ====」以降（特に末尾の JSON）を全文コピーして
 *      検証担当に渡す。
 *
 * 【3スナップショット運用（差分で判定する）】
 *   ① オフライン記録前（基準）: オンライン通常状態で1回貼る
 *        → 既存の「未同期 M件」を把握しておく。
 *   ② 記録後オフライン        : 機内モード/オフラインで新規ショットを作成 → もう1回貼る
 *        → 未同期が増え、serverId=null の新ショットが「未同期の最新ショット」に出ることを確認。
 *   ③ オンライン復帰後        : オンラインに戻し同期完了を待って → もう1回貼る
 *        → 【未同期=0】かつ【最新ショットに serverId 付与】なら push 成功（=修正OK）。
 *
 * 【安全性：完全な読み取り専用。破壊的操作は一切含まない】
 *   - データベース削除API（破壊的）は呼ばない。
 *   - オブジェクトストアへの書き込み（追加 / 更新 / 行の削除）は一切行わない。
 *   - バージョンを上げる open（スキーマ変更）をしない。
 *       → 既存DBは「版指定なし」で開き、readonly トランザクションのみで読む。
 *   - ネットワーク送信（外部APIアクセス）を一切しない。
 *   - アプリの Dexie インスタンスや window グローバルに依存せず、生の indexedDB API だけで完結。
 *   - 開くDB名は indexedDB.databases() が返した「実在するDB」に限定（推測オープンで
 *     空DBを新規作成してしまう事故も防ぐ）。読み取り後は接続を必ず close する。
 *   ※ 宮川さんの実アカウントの本物データ上で走るため、上記を厳守している。
 *
 * 【判定ガイド】
 *   ※判定: オンライン復帰後に【未同期=0】かつ【最新ショットに serverId 付与】なら push 成功。
 *           素の KigasuruDB に shots が溜まっていれば異常。
 * ============================================================================
 */
(async () => {
  // ---- 共通ユーティリティ（すべて読み取り専用） ----
  const J = (v) => { try { return JSON.stringify(v); } catch (_) { return String(v); } };

  // createdAt(epoch ms 想定) を ISO 文字列へ。不正値でも例外を投げず明示表示。
  const toISO = (v) => {
    try {
      if (typeof v === 'number' && isFinite(v)) return new Date(v).toISOString();
      if (typeof v === 'string' && v) {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toISOString();
      }
      return `(createdAt不正: ${J(v)})`;
    } catch (_) {
      return `(変換失敗: ${J(v)})`;
    }
  };

  // 未同期判定 = serverId が null または undefined（確定スキーマ）。
  const isUnsynced = (s) => s == null || s.serverId === null || s.serverId === undefined;
  // createdAt の数値ソートキー（降順用）
  const ck = (s) => {
    const v = s && s.createdAt;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') { const t = Date.parse(v); return isNaN(t) ? 0 : t; }
    return 0;
  };
  // ショット1件を表示用に整形（memo は改行畳んで先頭20字）
  const fmt = (s) => ({
    id: s && s.id,
    createdAtISO: toISO(s && s.createdAt),
    createdAtRaw: s && s.createdAt,
    serverId: (s && s.serverId !== undefined) ? s.serverId : null,
    club: (s && s.club !== undefined) ? s.club : null,
    memoHead: String((s && s.memo) || '').replace(/\s+/g, ' ').slice(0, 20),
  });

  // 版指定なしで open（既存DBの現行バージョンで開く＝スキーマ変更・upgrade を起こさない）。
  const openReadonly = (name) => new Promise((resolve, reject) => {
    const req = indexedDB.open(name); // ← 第2引数(version)は渡さない
    let created = false;
    req.onupgradeneeded = () => {
      // 実在DB(databases()由来)では発火しない想定。万一発火＝新規作成なので、
      // オブジェクトストアは一切作らず（書き込み・スキーマ生成をしない）フラグのみ立てる。
      created = true;
    };
    req.onsuccess = () => resolve({ db: req.result, created });
    req.onerror = () => reject(req.error || new Error(`open(${name}) failed`));
    req.onblocked = () => console.warn(`⚠️ open(${name}) blocked（他タブが版変更中？読み取りは継続試行）`);
  });
  const promisify = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IDB request failed'));
  });

  // 1つのDBから shots を読む（readonly のみ）。
  const readShots = async (name) => {
    const { db, created } = await openReadonly(name);
    try {
      if (created) {
        return { shotsStoreExists: false, total: 0, unsynced: 0, latest5: [], newestUnsynced: null,
                 note: '⚠️想定外: 実在しないDBを開いて新規作成した可能性' };
      }
      if (!db.objectStoreNames.contains('shots')) {
        return { shotsStoreExists: false, total: 0, unsynced: 0, latest5: [], newestUnsynced: null };
      }
      const tx = db.transaction(['shots'], 'readonly'); // ← readonly トランザクションのみ
      const store = tx.objectStore('shots');
      const all = await promisify(store.getAll());
      const rows = Array.isArray(all) ? all : [];
      const total = rows.length;
      const unsyncedRows = rows.filter(isUnsynced).sort((a, b) => ck(b) - ck(a));
      const sortedDesc = rows.slice().sort((a, b) => ck(b) - ck(a));
      return {
        shotsStoreExists: true,
        total,
        unsynced: unsyncedRows.length,
        latest5: sortedDesc.slice(0, 5).map(fmt),
        newestUnsynced: unsyncedRows.length ? fmt(unsyncedRows[0]) : null,
      };
    } finally {
      db.close(); // 接続は必ず閉じる
    }
  };

  // ---- 収集結果（finally で必ずサマリ化するため try の外で宣言） ----
  let databasesSupported = (typeof indexedDB !== 'undefined') && (typeof indexedDB.databases === 'function');
  let dbNames = [];
  const userDbs = [];
  let bare = { exists: false, shotsStoreExists: null, shotsCount: null, unsynced: null, latest5: [] };

  console.log(
    `%c[検証2-2] IndexedDB 読み取り専用 観測 開始  origin=${(typeof location !== 'undefined' ? location.origin : '?')}  時刻=${new Date().toISOString()}`,
    'font-weight:bold;font-size:13px'
  );

  try {
    if (typeof indexedDB === 'undefined') {
      console.error('❌ この環境に IndexedDB がありません。ブラウザのタブで実行してください。');
      return;
    }

    // a. 全DB名を列挙（未対応ブラウザなら明示メッセージで継続）
    if (databasesSupported) {
      try {
        const list = await indexedDB.databases();
        dbNames = (list || [])
          .map((d) => d && d.name)
          .filter((n) => typeof n === 'string' && n.length > 0);
      } catch (e) {
        databasesSupported = false;
        console.warn('⚠️ indexedDB.databases() の実行に失敗:', e);
      }
    }
    if (!databasesSupported) {
      console.warn('⚠️ このブラウザは indexedDB.databases() 未対応（Firefox 等）。DB名を列挙できません。');
      console.warn('   → 安全のため推測でのDBオープンは行いません。Chrome / Edge で再実行してください。');
    }

    // b. ユーザーDB(KigasuruDB_*) を検出（複数なら全て） / c. 素の KigasuruDB を検出
    const userDbNames = dbNames.filter((n) => n.indexOf('KigasuruDB_') === 0);
    const bareExists = dbNames.indexOf('KigasuruDB') !== -1;

    // d. 各ユーザーDBを readonly で読む
    for (const name of userDbNames) {
      try {
        const r = await readShots(name);
        userDbs.push(Object.assign({ name }, r));
      } catch (e) {
        userDbs.push({ name, error: String((e && e.message) || e) });
        console.error(`❌ ${name} の読み取りに失敗:`, e);
      }
    }

    // c'. 素の KigasuruDB が実在する場合のみ shots 件数を読む（空か否かの確認）
    bare.exists = bareExists;
    if (bareExists) {
      try {
        const r = await readShots('KigasuruDB');
        bare = {
          exists: true,
          shotsStoreExists: r.shotsStoreExists,
          shotsCount: r.total,
          unsynced: r.unsynced,
          latest5: r.latest5,
        };
      } catch (e) {
        bare = { exists: true, error: String((e && e.message) || e) };
        console.error('❌ 素の KigasuruDB の読み取りに失敗:', e);
      }
    }
  } catch (e) {
    console.error('❌ 観測中に例外:', e);
  } finally {
    // ============ 観測サマリ（日本語・✅/⚠️ 併用） ============
    console.log('%c==== 観測サマリ ====', 'font-weight:bold;font-size:14px');

    if (databasesSupported) {
      console.log(`列挙された全DB(${dbNames.length}件): ${dbNames.join(', ') || '(なし)'}`);
    }

    if (userDbs.length === 0) {
      console.warn('⚠️ ユーザーDB(KigasuruDB_*) が見つかりません。ログイン状態 / 同一オリジンを確認してください。');
    } else {
      try {
        console.table(userDbs.map((u) => ({
          DB: u.name,
          総件数: u.error ? '(エラー)' : u.total,
          未同期: u.error ? '(エラー)' : u.unsynced,
          shotsストア: u.error ? '(エラー)' : u.shotsStoreExists,
        })));
      } catch (_) { /* console.table 非対応でも続行 */ }
    }

    for (const u of userDbs) {
      if (u.error) {
        console.error(`❌ ユーザーDB: ${u.name} / 読み取りエラー: ${u.error}`);
        continue;
      }
      const mark = u.unsynced === 0 ? '✅' : '⚠️';
      console.log(`${mark} ユーザーDB: ${u.name} / 総 ${u.total}件 / 未同期 ${u.unsynced}件`);
      if (!u.shotsStoreExists) {
        console.warn('   ⚠️ shots ストアが存在しません（このDBは空 or 別スキーマ）。');
      }
      if (u.unsynced > 0 && u.newestUnsynced) {
        const n = u.newestUnsynced;
        console.log(
          `   未同期の最新ショット: id=${n.id} serverId=${J(n.serverId)} ` +
          `createdAt=${n.createdAtISO} club=${J(n.club)} memo="${n.memoHead}"`
        );
      } else if (u.total > 0 && u.latest5[0]) {
        const t = u.latest5[0];
        console.log(`   最新ショット: id=${t.id} serverId=${J(t.serverId)} createdAt=${t.createdAtISO}（未同期=0）`);
      }
    }

    // 素の KigasuruDB（空フォールバックDB）の状態
    if (!bare.exists) {
      console.log('✅ 空フォールバックDB(素のKigasuruDB): 存在しない');
    } else if (bare.error) {
      console.warn(`⚠️ 空フォールバックDB(素のKigasuruDB): 存在するが読み取りエラー: ${bare.error}`);
    } else {
      const k = bare.shotsCount;
      const mark = (typeof k === 'number' && k > 0) ? '⚠️' : '✅';
      const tail = (typeof k === 'number' && k > 0)
        ? '（※異常の疑い: バグ再発の兆候。本来ここに shots は溜まらない）'
        : '（空＝正常）';
      console.log(`${mark} 空フォールバックDB(素のKigasuruDB): 存在し shots=${k}件${tail}`);
    }

    // 固定の判定ガイド行
    console.log(
      '%c※判定: オンライン復帰後に【未同期=0】かつ【最新ショットに serverId 付与】なら push 成功。' +
      '素の KigasuruDB に shots が溜まっていれば異常。',
      'color:#0a7d00;font-weight:bold'
    );

    // ============ 全文コピー用 JSON ============
    const report = {
      generatedAtISO: new Date().toISOString(),
      origin: (typeof location !== 'undefined') ? location.origin : null,
      databasesApiSupported: databasesSupported,
      allDatabaseNames: dbNames,
      userDbCount: userDbs.length,
      userDbs,
      bareKigasuruDb: bare,
      verdictGuide: 'オンライン復帰後に【未同期=0】かつ【最新ショットに serverId 付与】なら push 成功。素の KigasuruDB に shots が溜まっていれば異常。',
    };
    console.log('---- ↓ このJSONを全文コピーして検証担当に渡してください ↓ ----');
    console.log(JSON.stringify(report, null, 2));
    console.log('==== END ====');
  }
})();
