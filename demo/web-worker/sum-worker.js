self.addEventListener('message', function (message) {
  console.log('sum worker get message: ' + message.data);
  var inputs = message.data.split(',');
  var result = 0;
  for (var i=0;i<inputs.length;i++) {
    result += +inputs[i];
  }
  self.postMessage(result);
});
