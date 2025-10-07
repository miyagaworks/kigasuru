import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = '上手くなる気がするぅぅぅ PRO';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
          padding: '80px',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            marginBottom: 30,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          上手くなる気がするぅぅぅ PRO
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#E8F5E9',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
          }}
        >
          科学的ゴルフ上達アプリ
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#C8E6C9',
            textAlign: 'center',
            marginTop: 20,
            maxWidth: '900px',
          }}
        >
          ジャイロセンサーで傾斜を自動検出
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
