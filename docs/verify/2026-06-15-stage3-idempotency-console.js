/**
 * ============================================================================
 * 段階3 §11 冪等性 — 本番(app.kigasuru.com) Console 検証スニペット
 * 作成日: 2026-06-15
 * 対象API: POST /api/shots, GET /api/shots, DELETE /api/shots/[id]
 * ----------------------------------------------------------------------------
 * 【使い方】
 *   1. app.kigasuru.com に「自分のアカウントでログインした状態」のタブを開く。
 *   2. Option(⌥)+Cmd(⌘)+J で Console を開く（Chrome / Edge）。
 *   3. このファイルの「全文」を Console に貼り付けて Enter。
 *   4. 数秒待つ。最後に出る「==== SUMMARY ====」以降の出力（特に末尾の JSON）を
 *      「全部コピー」して検証担当に渡す。
 *
 * 【このスニペットがやること】
 *   - 自分のアカウントに検証用ショットを数件「作成」→ 期待結果を「判定」→「全削除」。
 *   - 作成データには一意マーカー(MARKER)を付与。万一消し残った場合は末尾に id を列挙。
 *   - すべて same-origin（既存ログインCookie利用）。トークン/Cookie値は一切含めない。
 *
 * 【安全性】
 *   - 作成 → 自己削除まで完結。例外が起きても finally で必ずクリーンアップ＆サマリ出力。
 *   - 削除対象は「このスニペットが作成した行（serverId 一致 もしくは 本runの MARKER 一致）」
 *     のみ。MARKER は実行毎に一意(RUN_ID入り)なので、既存データや他runには触れない。
 *   - GET は本人の行しか返さない実装のため、走査範囲も自分のアカウント内に限定される。
 *
 * 【判定基準（PASS条件）】
 *   TEST1 冪等性 : 同一 clientId で2回POST → 両方 200/success/同一 shotId、かつ
 *                   GET の clientId 一致件数 = 1（重複行が作られない）。
 *   TEST2 distance=null : distance を null でPOST → 200保存（400でない）、保存値が null。
 *   TEST3 clientIdなし   : clientId 無しでPOST → 200作成、保存行の clientId が null（旧互換）。
 *   CLEANUP            : 作成した全行を削除し、本runの MARKER を持つ行が 0 件。
 * ============================================================================
 */
(async () => {
  // ---- 共通ユーティリティ ----
  const uuid = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const RUN_ID = uuid();
  const MARKER = `__IDEMPOTENCY_VERIFY_${RUN_ID}__`;
  const BASE = '/api/shots';
  const createdIds = new Set(); // POST が返した shotId を蓄積（重複は Set で吸収）

  // 判定結果（finally でサマリ化するため try の外で宣言）
  let authed = false;
  let test1Pass = false;
  let test2Pass = false;
  let test3Pass = false;
  const detail = { test1: {}, test2: {}, test3: {}, cleanup: {} };

  const J = (v) => {
    try { return JSON.stringify(v); } catch (_) { return String(v); }
  };
  const rowHasMarker = (s) =>
    (typeof s?.memo === 'string' && s.memo.includes(MARKER)) || s?.golfCourse === MARKER;

  // すべての fetch は same-origin（既存セッションCookie利用）
  async function api(method, url, payload) {
    const opt = { method, credentials: 'same-origin', headers: {} };
    if (payload !== undefined) {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(payload);
    }
    const res = await fetch(url, opt);
    let body = null;
    try { body = await res.json(); } catch (_) { body = null; }
    return { status: res.status, ok: res.ok, body };
  }
  const postShot = (payload) => api('POST', BASE, payload);
  const getShots = () => api('GET', BASE);
  const deleteShot = (id) => api('DELETE', `${BASE}/${encodeURIComponent(id)}`);

  // 最小有効ペイロード（必須 = date, club）＋ 識別マーカー
  const basePayload = (label, extra) => ({
    date: new Date().toISOString(),
    club: '7I',
    distance: 150,
    memo: `${MARKER} ${label}`,
    golfCourse: MARKER,
    ...extra,
  });
  const trackId = (r) => {
    const id = r && r.body && r.body.shotId;
    if (typeof id === 'string') createdIds.add(id);
    return id;
  };

  console.log(
    `%c[段階3 §11 冪等性検証] 開始  RUN_ID=${RUN_ID}  origin=${location.origin}`,
    'font-weight:bold'
  );

  try {
    // ============ 認証プローブ（GET 1回） ============
    const probe = await getShots();
    if (probe.status === 401) {
      console.error(
        '❌ 未認証(401)。app.kigasuru.com にログイン済みのタブで実行してください。テストを中断します。'
      );
    } else if (probe.status !== 200 || probe.body?.success !== true) {
      console.error(
        `❌ GET /api/shots が想定外: status=${probe.status} body=${J(probe.body)}。中断します。`
      );
    } else {
      authed = true;
      console.log(`✅ 認証OK。既存ショット件数=${(probe.body.shots || []).length}`);
    }

    if (authed) {
      // ============ TEST1: 冪等性（同一 clientId×2 → 1件） ============
      console.log('— TEST1: 冪等性（同一 clientId で2回POST → GET件数=1 期待）');
      const C1 = uuid();
      const p1 = basePayload('test1-idempotency', { clientId: C1 });
      const r1a = await postShot(p1); trackId(r1a);
      const r1b = await postShot(p1); trackId(r1b);
      const g1 = await getShots();
      const rows1 = (g1.body?.shots || []).filter((s) => s.clientId === C1);
      const id1a = r1a.body?.shotId;
      const id1b = r1b.body?.shotId;
      test1Pass =
        r1a.status === 200 && r1a.body?.success === true && typeof id1a === 'string' &&
        r1b.status === 200 && r1b.body?.success === true && typeof id1b === 'string' &&
        id1a === id1b &&
        rows1.length === 1 &&
        rows1[0]?.id === id1a;
      detail.test1 = {
        clientId: C1,
        post1: { status: r1a.status, shotId: id1a },
        post2: { status: r1b.status, shotId: id1b },
        sameShotId: id1a === id1b,
        getCount: rows1.length,
        expectGetCount: 1,
      };
      console.log(
        `  POST#1=${r1a.status}/${id1a}  POST#2=${r1b.status}/${id1b}  ` +
        `sameId=${id1a === id1b}  GET件数=${rows1.length}(期待1)  => ${test1Pass ? 'PASS' : 'FAIL'}`
      );

      // ============ TEST2: distance=null → 200保存（400でない） ============
      console.log('— TEST2: distance=null でPOST → 200保存 期待');
      const C2 = uuid();
      const p2 = basePayload('test2-distance-null', { clientId: C2, distance: null });
      const r2 = await postShot(p2);
      const id2 = trackId(r2);
      const g2 = await getShots();
      const row2 = (g2.body?.shots || []).find((s) => s.clientId === C2);
      test2Pass =
        r2.status === 200 && r2.body?.success === true && typeof id2 === 'string' &&
        row2 != null && row2.distance === null;
      detail.test2 = {
        clientId: C2,
        status: r2.status,
        shotId: id2,
        savedDistance: row2 ? row2.distance : '(row not found)',
        expectStatus: 200,
        expectDistance: null,
      };
      console.log(
        `  POST=${r2.status}/${id2}  保存distance=${row2 ? J(row2.distance) : '(行なし)'}(期待null)` +
        `  => ${test2Pass ? 'PASS' : 'FAIL'}`
      );

      // ============ TEST3: clientId なし → 200作成（旧互換 create） ============
      console.log('— TEST3: clientId 無しでPOST → 200作成 期待');
      const p3 = basePayload('test3-no-clientId', {}); // clientId は付けない
      const r3 = await postShot(p3);
      const id3 = trackId(r3);
      const g3 = await getShots();
      const row3 = (g3.body?.shots || []).find((s) => s.id === id3);
      test3Pass =
        r3.status === 200 && r3.body?.success === true && typeof id3 === 'string' &&
        row3 != null && (row3.clientId === null || row3.clientId === undefined);
      detail.test3 = {
        status: r3.status,
        shotId: id3,
        savedClientId: row3 ? row3.clientId : '(row not found)',
        expectStatus: 200,
        expectClientId: null,
      };
      console.log(
        `  POST=${r3.status}/${id3}  保存clientId=${row3 ? J(row3.clientId) : '(行なし)'}(期待null)` +
        `  => ${test3Pass ? 'PASS' : 'FAIL'}`
      );
    }
  } catch (e) {
    console.error('❌ テスト実行中に例外:', e);
  } finally {
    // ============ クリーンアップ（常に実行・best-effort） ============
    const delResults = [];
    const safetyResults = [];
    let finalLeftovers = [];
    let cleanupPass = true; // 何も作成していなければ true（未認証時など）

    if (authed) {
      try {
        // pass1: 追跡した serverId を削除
        for (const id of createdIds) {
          const d = await deleteShot(id);
          delResults.push({
            id,
            status: d.status,
            ok: d.status === 200 && d.body?.success === true,
          });
        }
        // pass2: 取りこぼし安全網 — 本runの MARKER を持つ未追跡行を削除
        const gScan = await getShots();
        if (gScan.status === 200) {
          const stray = (gScan.body?.shots || [])
            .filter(rowHasMarker)
            .map((s) => s.id)
            .filter((id) => !createdIds.has(id));
          for (const id of stray) {
            const d = await deleteShot(id);
            safetyResults.push({
              id,
              status: d.status,
              ok: d.status === 200 && d.body?.success === true,
            });
          }
        }
        // 最終確認: 本runの MARKER を持つ行が残っていないか再取得
        const gFinal = await getShots();
        finalLeftovers =
          gFinal.status === 200
            ? (gFinal.body?.shots || []).filter(rowHasMarker).map((s) => s.id)
            : ['(最終GET失敗のため未確認)'];
        cleanupPass =
          delResults.every((r) => r.ok) &&
          safetyResults.every((r) => r.ok) &&
          finalLeftovers.length === 0;
      } catch (e2) {
        console.error('❌ クリーンアップ中に例外:', e2);
        cleanupPass = false;
        if (finalLeftovers.length === 0) finalLeftovers = ['(クリーンアップ例外のため未確認)'];
      }
    }
    detail.cleanup = {
      deleted: delResults,
      safetyNetDeleted: safetyResults,
      leftover: finalLeftovers,
    };

    // ============ サマリ出力 ============
    const verdict = (b) => (b ? 'PASS' : 'FAIL');
    const summaryTable = {
      'TEST1 冪等性(同一clientId×2→1件)': authed ? verdict(test1Pass) : 'NOT_RUN(未認証)',
      'TEST2 distance=null→200保存': authed ? verdict(test2Pass) : 'NOT_RUN(未認証)',
      'TEST3 clientIdなし→200作成': authed ? verdict(test3Pass) : 'NOT_RUN(未認証)',
      'CLEANUP 全削除/消し残しなし': authed ? verdict(cleanupPass) : 'SKIP(作成なし)',
    };
    const allPass = authed && test1Pass && test2Pass && test3Pass && cleanupPass;

    console.log('%c==== SUMMARY ====', 'font-weight:bold;font-size:14px');
    console.table(summaryTable);
    console.log(
      `%c総合判定: ${allPass ? '✅ ALL PASS' : '❌ FAIL あり（下記JSONを確認）'}`,
      `font-weight:bold;color:${allPass ? 'green' : 'red'}`
    );
    if (finalLeftovers.length) {
      console.warn('⚠️ 消し残り serverId:', finalLeftovers, '（手動削除してください）');
    } else if (authed) {
      console.log('🧹 消し残しなし');
    }

    const report = {
      runId: RUN_ID,
      origin: location.origin,
      marker: MARKER,
      summary: summaryTable,
      allPass,
      leftoverServerIds: finalLeftovers,
      detail,
    };
    console.log('---- ↓ このJSONを全文コピーして共有してください ↓ ----');
    console.log(JSON.stringify(report, null, 2));
    console.log('==== END ====');
  }
})();
