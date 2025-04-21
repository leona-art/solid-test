// src/components/QRCodeScanner.tsx
import { Show } from 'solid-js';
import { useCameraScanner } from '../hooks/useScanner'; // パスを適切に設定

export const Scanner = () => {
  // カスタムフックを利用
  const {
    startCamera,
    stopCamera,
    isCameraActive,
    error,
    setVideoRef // video要素設定用の関数を取得
  } = useCameraScanner();

  return (
    <div class="p-4 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 class="text-xl font-semibold mb-4 text-center">QRコードスキャナー</h2>

      <div class="relative mb-4 bg-gray-200 rounded overflow-hidden aspect-video">
        {/*
          video要素のrefにカスタムフックから取得したsetVideoRefを渡す
          SolidJSのrefは関数を受け取ることができる
         */}
        <video
          ref={setVideoRef} // ここで video 要素を useCameraScanner に渡す
          class={`w-full h-full object-cover ${isCameraActive() ? 'block' : 'hidden'}`}
          // playsInline と muted は useCameraScanner 内の Effect で設定されるが、
          // 初期表示のためや明示性のためにここに書いても良い
          playsinline
          muted
        />
        <Show when={!isCameraActive()}>
          <div class="absolute inset-0 flex items-center justify-center text-gray-500">
            カメラは停止しています
          </div>
        </Show>
      </div>

      <Show when={error()}>
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span class="block sm:inline">{error()}</span>
        </div>
      </Show>

      <div class="flex justify-center space-x-4">
        <Show
          when={!isCameraActive()}
          fallback={
            <button
              onClick={stopCamera} // フックから取得した関数を使用
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700 transition duration-200"
            >
              カメラ停止
            </button>
          }
        >
          <button
            onClick={startCamera} // フックから取得した関数を使用
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-200"
          >
            カメラ起動
          </button>
        </Show>
      </div>
    </div>
  );
};

