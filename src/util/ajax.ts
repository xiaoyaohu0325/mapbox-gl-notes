export class Ajax {
  static getArrayBuffer(url, callback) {
    const xhr: XMLHttpRequest = new (<any>window).XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onerror = function(e) {
        callback(e);
    };
    xhr.onload = function() {
        if (xhr.response.byteLength === 0 && xhr.status === 200) {
            return callback(new Error('http status 200 returned without content.'));
        }
        if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            callback(null, xhr.response);
        } else {
            callback(new Error(xhr.statusText));
        }
    };
    xhr.send();
    return xhr;
  }

  static getJSON(url, callback) {
    const xhr: XMLHttpRequest = new (<any>window).XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onerror = function(e) {
      callback(e);
    };
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
        let data;
        try {
          data = JSON.parse(xhr.response);
        } catch (err) {
          return callback(err);
        }
        callback(null, data);
      } else {
        callback(new Error(xhr.statusText));
      }
    };
    xhr.send();
    return xhr;
  }
}
