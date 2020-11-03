app.controller('signController', function($scope) {
  void 0;
  var wrapper = document.getElementById("signature-pad"),
    clearButton = wrapper.querySelector("[data-action=clear]"),
    saveButton = wrapper.querySelector("[data-action=save]"),
    canvas = wrapper.querySelector("canvas"),
    signaturePad;
  canvas.width = 600;
  canvas.height = 300;

  function resizeCanvas() {
    var ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);
  }
  signaturePad = new SignaturePad(canvas, {
    minWidth: 1,
    maxWidth: 1.5
  });
});