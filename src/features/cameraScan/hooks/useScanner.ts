// src/hooks/useCameraScanner.ts
import { createSignal, onCleanup, createEffect, Accessor } from 'solid-js';

// useCameraScannerが返す値の型定義
export interface UseCameraScannerReturn {
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  isCameraActive: Accessor<boolean>; // Signal<boolean> の Getter
  error: Accessor<string | null>;   // Signal<string | null> の Getter
  setVideoRef: (element: HTMLVideoElement) => void; // video要素を設定する関数
}

export function useCameraScanner(): UseCameraScannerReturn {
  const [stream, setStream] = createSignal<MediaStream | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  // video要素自体をSignalで管理する
  const [videoElement, setVideoElement] = createSignal<HTMLVideoElement | undefined>(undefined);

  // video要素への参照を設定するための関数
  const setVideoRef = (element: HTMLVideoElement) => {
    setVideoElement(element);
  };

  // カメラがアクティブかどうかを判定する derived signal (Accessor)
  const isCameraActive = () => stream() !== null;

  // カメラを起動する関数
  const startCamera = async () => {
    setError(null);
    const currentVideoElement = videoElement(); // ローカル変数に格納

    if (!currentVideoElement) {
        setError("ビデオ要素がまだ設定されていません。");
        console.warn("Video element is not yet available.");
        return;
    }

    // 既にストリームがあれば何もしない（重複起動防止）
    if(isCameraActive()) {
      console.warn("Camera is already active.");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      // video要素へのストリーム設定は createEffect で行う
    } catch (err) {
      console.error("Error accessing camera:", err);
       if (err instanceof DOMException) {
          if (err.name === "NotAllowedError") {
              setError("カメラへのアクセスが許可されていません。");
          } else if (err.name === "NotFoundError") {
              setError("利用可能なカメラが見つかりません。");
          } else if (err.name === "NotReadableError") {
               setError("カメラが他のアプリケーションで使用されている可能性があります。");
           } else {
               setError(`カメラへのアクセス中にエラーが発生しました: ${err.message}`);
           }
       } else {
           setError("カメラへのアクセス中に不明なエラーが発生しました。");
       }
      setStream(null);
    }
  };

  // カメラを停止する関数
  const stopCamera = () => {
    const currentStream = stream();
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
     setError(null); // エラーもクリア
     // video要素のsrcObjectクリアは createEffect で行う
  };

  // stream または videoElement が変更されたら srcObject を更新する Effect
  createEffect(() => {
    const currentVideoElement = videoElement();
    const currentStream = stream();

    if (currentVideoElement) {
      // ストリームがある場合：srcObjectに設定し、再生を試みる
      if (currentStream) {
        currentVideoElement.srcObject = currentStream;
        currentVideoElement.muted = true; // 再生ポリシーのためミュート推奨
        currentVideoElement.playsInline = true; // iOS Safari 対応
        currentVideoElement.play().catch(err => {
          console.error("Video play failed:", err);
          // 自動再生が失敗した場合のエラー処理（必要に応じて）
          // stopCamera() を呼ぶか、ユーザーに再生ボタンを押させるなど
          setError("ビデオの再生に失敗しました。");
          // 再生失敗した場合、ストリームは維持するかもしれないし、停止するかもしれない（設計による）
          // ここでは一旦停止する例
          stopCamera();
        });
      } else {
        // ストリームがない場合：srcObjectをクリアし、ビデオを一時停止
        currentVideoElement.srcObject = null;
        // pause() は srcObject が null になれば不要かもしれないが一応
        currentVideoElement.pause();
      }
    }
  });


  // コンポーネント破棄時のクリーンアップ
  onCleanup(() => {
    stopCamera();
  });

  // 必要な関数と状態（の Accessor）を返す
  return {
    startCamera,
    stopCamera,
    isCameraActive, // isCameraActive() で値を取得
    error,          // error() で値を取得
    setVideoRef,    // ref={setVideoRef} のように使う
  };
}