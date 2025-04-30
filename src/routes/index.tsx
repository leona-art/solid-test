import { A } from "@solidjs/router";
import Counter from "~/components/Counter";
import { LocalVideo } from "~/features/camera/ui/localStream";
import { CameraScanner } from "~/features/cameraScan";
import Video from "~/features/video/ui/video";

export default function Home() {
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <LocalVideo />
    </main>
  );
}
