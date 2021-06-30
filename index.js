const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const chara = new Image();
chara.src = "./sample.jpeg";
function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.segmentationMask,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  canvasCtx.globalCompositeOperation = "source-in";
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  canvasCtx.globalCompositeOperation = "destination-atop";
  canvasCtx.drawImage(chara, 0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.restore();
  results.segmentationMask.close();
  results.image.close();
}
const selfieSegmentation = new SelfieSegmentation({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
  },
});
selfieSegmentation.setOptions({
  modelSelection: 1,
});
selfieSegmentation.onResults(onResults);
(async function () {
  const localMediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 1080,
      height: 720,
      frameRate: 15,
    },
    audio: false,
  });
  const processor = new MediaStreamTrackProcessor(
    localMediaStream.getVideoTracks()[0]
  );
  const writable = new WritableStream({
    start() {
      console.log("WritableStream started");
    },
    async write(videoFrame) {
      const imageBitmap = await createImageBitmap(videoFrame);
      await selfieSegmentation.send({ image: imageBitmap });
      imageBitmap.close();
      videoFrame.close();
    },
    stop() {
      console.log("WritableStream stopped");
    },
  });
  processor.readable.pipeTo(writable);

  // ストリームの取得
  const segmentedLocalMediaStream = canvasElement.captureStream();
  const peer = new Peer({
    key: "c9ee5f88-86da-4f84-8b81-bc7f4623d302",
    debug: 3,
  });
  peer.on("open", () => {
    document.getElementById("my-id").textContent = peer.id;
  });
  peer.on("call", (mediaConnection) => {
    mediaConnection.answer(segmentedLocalMediaStream);
    setEventListener(mediaConnection);
  });
  // 発信処理
  document.getElementById("make-call").onclick = () => {
    const theirID = document.getElementById("their-id").value;
    const mediaConnection = peer.call(theirID, segmentedLocalMediaStream);
    setEventListener(mediaConnection);
  };

  // イベントリスナを設置する関数
  const setEventListener = (mediaConnection) => {
    mediaConnection.on("stream", (stream) => {
      // video要素にカメラ映像をセットして再生
      const videoElm = document.getElementById("their-video");
      videoElm.srcObject = stream;
      videoElm.play();
    });
  };
})();
