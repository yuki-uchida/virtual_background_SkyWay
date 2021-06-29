let offscreenCanvas;
let offscreenCanvasContext;
let backgroundImageBitMap;
self.onmessage = function (event) {
  if (event.data.msg === "offscreen") {
    offscreenCanvas = event.data.canvas;
    offscreenCanvasContext = offscreenCanvas.getContext("2d");
    backgroundImageBitMap = event.data.backgroundImageBitMap;
  }
  if (event.data.msg == "imageBitMap") {
    offscreenCanvasContext.save();
    offscreenCanvasContext.clearRect(
      0,
      0,
      offscreenCanvas.width,
      offscreenCanvas.height
    );
    offscreenCanvasContext.drawImage(
      event.data.results.segmentationMask,
      0,
      0,
      offscreenCanvas.width,
      offscreenCanvas.height
    );
    // Only overwrite existing pixels.
    offscreenCanvasContext.globalCompositeOperation = "source-in";
    offscreenCanvasContext.drawImage(
      event.data.results.image,
      0,
      0,
      offscreenCanvas.width,
      offscreenCanvas.height
    );
    offscreenCanvasContext.globalCompositeOperation = "destination-atop";
    offscreenCanvasContext.drawImage(
      backgroundImageBitMap,
      0,
      0,
      offscreenCanvas.width,
      offscreenCanvas.height
    );
    offscreenCanvasContext.restore();
    event.data.results.segmentationMask.close();
    event.data.results.image.close();
  }
};
