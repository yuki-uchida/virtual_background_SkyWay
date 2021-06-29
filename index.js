const canvasElement = document.getElementById("output_canvas");
// ストリームの取得
const segmentedLocalMediaStream = canvasElement.captureStream(); // 25 FPS
const worker = new Worker("offscreen_worker.js");
const offscreenCanvas = canvasElement.transferControlToOffscreen();

async function loadImage() {
  return new Promise((resolve, reject) => {
    const backgroundImage = new Image();
    backgroundImage.onload = () => resolve(backgroundImage);
    backgroundImage.onerror = (e) => reject(backgroundImage);
    backgroundImage.src = "./photo-1579488083677-ac53dcf66911.jpeg";
  });
}

(async function () {
  const backgroundImage = await loadImage();
  const backgroundImageBitMap = await createImageBitmap(backgroundImage);
  worker.postMessage(
    {
      msg: "offscreen",
      canvas: offscreenCanvas,
      backgroundImageBitMap: backgroundImageBitMap,
    },
    [offscreenCanvas, backgroundImageBitMap]
  );
  function onResults(results) {
    worker.postMessage(
      {
        msg: "imageBitMap",
        results: results,
      },
      results
    );
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

  //////////////////////////////////////////////////////

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
      console.log("Writable start");
    },
    async write(videoFrame) {
      const imageBitmap = await createImageBitmap(videoFrame);
      await selfieSegmentation.send({ image: imageBitmap });
      imageBitmap.close();
      videoFrame.close();
    },
    stop() {
      console.log("Writable stop");
    },
  });
  processor.readable.pipeTo(writable);

  const peer = new Peer({
    key: "YOUR API KEY",
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
