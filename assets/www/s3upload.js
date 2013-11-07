(function() {

  window.S3Upload = (function() {

    S3Upload.prototype.s3_sign_put_url = '/signS3put';

    S3Upload.prototype.file_dom_selector = '#file_upload';

    S3Upload.prototype.onFinishS3Put = function(public_url, file) {
      return console.log('base.onFinishS3Put()', public_url, file);
    };

    S3Upload.prototype.onProgress = function(percent, status, public_url, file) {
      return console.log('base.onProgress()', percent, status, public_url, file);
    };

    S3Upload.prototype.onError = function(status, file) {
      return console.log('base.onError()', status, file);
    };

    function S3Upload(options) {
      if (options == null) {
        options = {};
      }
      _.extend(this, options);
      if (this.file_dom_selector) {
      	console.log("In S3 Upload");
      	console.log(this.file_dom_selector);
      	//console.log(this.file_dom_selector.get(0));
        //this.handleFileSelect($(this.file_dom_selector).get(0));
        this.handleFileSelect(this.file_dom_selector);
      }
    }

    S3Upload.prototype.handleFileSelect = function(file_element) {
      var f, files, output, _i, _len, _results;
      this.onProgress(0, 'Upload started.');
      console.log("the files: ");
      //files = file_element.files;
      output = [];
      _results = [];
      //for (_i = 0, _len = files.length; _i < _len; _i++) {
        //f = files[_i];
      f = file_element
      _results.push(this.uploadFile(f));
      //}
      return _results;
    };

    S3Upload.prototype.createCORSRequest = function(method, url) {
      var xhr;
      xhr = new XMLHttpRequest();
      if (xhr.withCredentials != null) {
        xhr.open(method, url, true);
      } else if (typeof XDomainRequest !== "undefined") {
        xhr = new XDomainRequest();
        xhr.open(method, url);
      } else {
        xhr = null;
      }
      return xhr;
    };

    S3Upload.prototype.executeOnSignedUrl = function(file, callback, opts) {
      var name, this_s3upload, type, xhr;
      this_s3upload = this;
      xhr = new XMLHttpRequest();
      type = opts && opts.type || file.type;
      name = opts && opts.name || file.name;
      xhr.open('GET', this.s3_sign_put_url + '?s3_object_type=' + type + '&s3_object_name=' + encodeURIComponent(name), true);
      xhr.overrideMimeType('text/plain; charset=x-user-defined');
      xhr.onreadystatechange = function(e) {
        var result;
        if (this.readyState === 4 && this.status === 200) {
          try {
            result = JSON.parse(this.responseText);
          } catch (error) {
            this_s3upload.onError('Signing server returned some ugly/empty JSON: "' + this.responseText + '"');
            return false;
          }
          return callback(result.signed_request, result.url);
        } else if (this.readyState === 4 && this.status !== 200) {
          return this_s3upload.onError('Could not contact request signing server. Status = ' + this.status);
        }
      };
      return xhr.send();
    };

    S3Upload.prototype.uploadToS3 = function(file, url, public_url, opts) {
      var this_s3upload, type, xhr;
      this_s3upload = this;
      type = opts && opts.type || file.type;
      xhr = this.createCORSRequest('PUT', url);
      console.log("The URL: " + url);
      console.log("The File: " + file);
      
      if (!xhr) {
        this.onError('CORS not supported');
      } else {
        xhr.onload = function() {
          if (xhr.status === 200) {
            this_s3upload.onProgress(100, 'Upload completed.', public_url, file);
            return this_s3upload.onFinishS3Put(public_url, file);
          } else {
            return this_s3upload.onError('Upload error: ' + xhr.status, file);
            console.log("upload error:");
          }
        };
        xhr.onerror = function() {
          return this_s3upload.onError('XHR error.', file);
        };
        xhr.upload.onprogress = function(e) {
          var percentLoaded;
          if (e.lengthComputable) {
            percentLoaded = Math.round((e.loaded / e.total) * 100);
            return this_s3upload.onProgress(percentLoaded, (percentLoaded === 100 ? 'Finalizing.' : 'Uploading.'), public_url, file);
          }
        };
      }
      xhr.setRequestHeader('Content-Type', type);
      xhr.setRequestHeader('x-amz-acl', 'public-read');
      return xhr.send(file);
    };

    S3Upload.prototype.validate = function(file) {
      return null;
    };

    S3Upload.prototype.uploadFile = function(file, opts) {
      var error, this_s3upload;
      error = this.validate(file);
      opts = {};
      opts.type = "image/jpeg";
      opts.name = "test-file11.jpg";
      console.log("the opts");
      console.log(opts);
      
      if (error) {
        this.onError(error, file);
        return null;
      }
      this_s3upload = this;
      
      console.log("We are still going");
      return this.executeOnSignedUrl(file, function(signedURL, publicURL) {
      	console.log(file);
      	console.log(signedURL);
      	console.log(publicURL);
        return this_s3upload.uploadToS3(file, signedURL, publicURL, opts);
      }, opts);
    };

    return S3Upload;

  })();

}).call(this);
