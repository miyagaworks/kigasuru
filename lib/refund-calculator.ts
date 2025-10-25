/**
 * サブスクリプション解約時の返金計算ロジック
 */

export interface RefundCalculation {
  shouldRefund: boolean; // 返金が必要か
  refundAmount: number; // 返金額（円）
  usedMonths: number; // 使用済み月数
  usedAmount: number; // 使用済み金額（円）
  serviceEndDate: Date; // サービス利用終了日（この日まで利用可能）
  reason: string; // 返金可否の理由
}

const MONTHLY_PRICE = 550; // 月額プランの価格（円）
const YEARLY_PRICE = 5500; // 年額プランの価格（円）
const MONTHLY_RATE = 458; // 年額プランの月額換算（円）458.333...を458円として計算

/**
 * サブスクリプション解約時の返金額を計算
 *
 * @param subscriptionStart - サブスクリプション開始日
 * @param interval - プランの種類（'month' | 'year'）
 * @param cancelDate - 解約申請日（デフォルトは現在日時）
 * @returns 返金計算の結果
 */
export function calculateRefund(
  subscriptionStart: Date,
  interval: 'month' | 'year',
  cancelDate: Date = new Date()
): RefundCalculation {
  // 月額プランの場合
  if (interval === 'month') {
    // 契約開始日から1ヶ月後の応当日を計算
    const serviceEndDate = new Date(subscriptionStart);
    serviceEndDate.setMonth(serviceEndDate.getMonth() + 1);

    return {
      shouldRefund: false,
      refundAmount: 0,
      usedMonths: 1,
      usedAmount: MONTHLY_PRICE,
      serviceEndDate,
      reason: '月額プランは返金対象外です。次回更新日まで利用可能です。',
    };
  }

  // 年額プランの場合
  // サービス利用終了日を計算
  // 契約開始日の日にちを基準日として、その5日前を締め切りとする
  // - 基準日の5日前までに申請：翌月の基準日が利用終了日
  // - 基準日の4日前以降に申請：翌々月の基準日が利用終了日

  const baseDay = subscriptionStart.getDate(); // 契約日の日にち（基準日）

  // 今月の基準日を計算
  const thisMonthBaseDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth(), baseDay);

  // 翌月の基準日を計算
  const nextMonthBaseDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth() + 1, baseDay);

  // 翌月の基準日の5日前を計算
  const nextMonthCutoffDate = new Date(nextMonthBaseDate);
  nextMonthCutoffDate.setDate(nextMonthCutoffDate.getDate() - 5);

  let serviceEndDate: Date;

  if (cancelDate <= nextMonthCutoffDate) {
    // 翌月の基準日の5日前まで：翌月の基準日が利用終了日
    serviceEndDate = nextMonthBaseDate;
  } else {
    // 翌月の基準日の4日前以降：翌々月の基準日が利用終了日
    serviceEndDate = new Date(cancelDate.getFullYear(), cancelDate.getMonth() + 2, baseDay);
  }

  // 契約開始日からサービス利用終了日までの経過月数を計算
  // 同じ日にち同士の差なので、年月の差だけで計算
  const yearDiff = serviceEndDate.getFullYear() - subscriptionStart.getFullYear();
  const monthDiff = serviceEndDate.getMonth() - subscriptionStart.getMonth();
  const usedMonths = Math.max(1, yearDiff * 12 + monthDiff);

  // 使用済み金額を計算
  const usedAmount = usedMonths * MONTHLY_RATE;

  // 返金額を計算
  const refundAmount = Math.max(0, YEARLY_PRICE - usedAmount);

  return {
    shouldRefund: true,
    refundAmount,
    usedMonths,
    usedAmount,
    serviceEndDate,
    reason: `${usedMonths}ヶ月分（${usedAmount}円）を差し引いて返金します。`,
  };
}

/**
 * 2つの日付間の経過月数を計算
 *
 * @param startDate - 開始日
 * @param endDate - 終了日
 * @returns 経過月数（小数点以下含む）
 */
function getMonthsElapsed(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  const dayDiff = end.getDate() - start.getDate();

  let totalMonths = yearDiff * 12 + monthDiff;

  // 日の差分を月の割合として加算
  if (dayDiff > 0) {
    const daysInMonth = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate();
    totalMonths += dayDiff / daysInMonth;
  }

  return totalMonths;
}

/**
 * サービス利用終了日を計算（契約から1ヶ月後の応当日）
 *
 * @param subscriptionStart - サブスクリプション開始日
 * @returns サービス利用終了日
 */
export function calculateServiceEndDate(subscriptionStart: Date): Date {
  const endDate = new Date(subscriptionStart);
  endDate.setMonth(endDate.getMonth() + 1);
  return endDate;
}

/**
 * 指定された日付が解約済みサブスクリプションの利用期間内かを判定
 *
 * @param currentDate - 判定する日付
 * @param serviceEndDate - サービス利用終了日
 * @returns 利用可能な場合はtrue
 */
export function isServiceActive(
  currentDate: Date,
  serviceEndDate: Date
): boolean {
  return currentDate <= serviceEndDate;
}

/**
 * 次回更新日の何日前に解約申請すれば間に合うかを判定
 *
 * @param nextRenewalDate - 次回更新日
 * @param currentDate - 現在日時（デフォルトは現在日時）
 * @returns 更新日までの残り日数
 */
export function getDaysUntilRenewal(
  nextRenewalDate: Date,
  currentDate: Date = new Date()
): number {
  const diffTime = nextRenewalDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 解約処理が間に合うかを判定（更新日の7日前までに申請が必要）
 *
 * @param nextRenewalDate - 次回更新日
 * @param currentDate - 現在日時（デフォルトは現在日時）
 * @returns 間に合う場合はtrue
 */
export function canCancelBeforeRenewal(
  nextRenewalDate: Date,
  currentDate: Date = new Date()
): boolean {
  const daysUntilRenewal = getDaysUntilRenewal(nextRenewalDate, currentDate);
  return daysUntilRenewal >= 7;
}
