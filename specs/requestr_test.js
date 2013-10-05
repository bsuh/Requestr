describe('Requestr', function() {

  it('should be defined', function() {
    expect(window).toBeDefined();
    expect(Requestr).toBeDefined();
    expect(window.Requestr).toBeDefined();
    expect(window.serialization).toBe(undefined);
  });

  it('should check for initialization', function() {

    expect(Requestr.LOADING_CLASS).toBe('requestr');
    expect(Requestr.ELEMENTS_QUERY).toBe('[rel~="stylesheet"][href], [rel~="icon"][href], [src]');
    expect(Requestr.SERIALIZATION_QUERY).toBe('script[type="text/requestr-serialization"]');
    expect(Requestr.JS_ELEMENT_ATTRIBUTE).toBe('data-requestr-js');
    expect(Requestr.DEFAULT_SERVICE_FILE_MAX_SIZE).toBe(100000);

    expect(Requestr.serialization).toBe(null);
    expect(Requestr.onEvent).toBe(null);

    expect(Requestr.urlParsingEnabledElement).toBeDefined();
    expect(Requestr.urlParsingEnabledElement.IMG).toBeDefined();
    expect(Requestr.urlParsingEnabledElement.LINK).toBeDefined();
    expect(Requestr.urlParsingEnabledElement.SCRIPT).toBeDefined();

    expect(Requestr.customEvents).toBeDefined();
    expect(Requestr.customEvents.REQUESTR_READY).toBe('requestrReady');
    expect(Requestr.customEvents.DOCUMENT_LOAD_START).toBe('documentLoadStart');
    expect(Requestr.customEvents.DOCUMENT_LOAD_PROGRESS).toBe('documentLoadProgress');
    expect(Requestr.customEvents.DOCUMENT_LOAD_ERROR).toBe('documentLoadError');
    expect(Requestr.customEvents.DOCUMENT_LOAD_COMPLETE).toBe('documentLoadComplete');
    expect(Requestr.customEvents.DOCUMENT_RENDERED).toBe('documentRendered');
    expect(Requestr.customEvents.RESOURCE_API_ERROR).toBe('resourceApiError');
    expect(Requestr.customEvents.RESOURCE_LOAD_START).toBe('resourceLoadStart');
    expect(Requestr.customEvents.RESOURCE_LOAD_PROGRESS).toBe('resourceLoadProgress');
    expect(Requestr.customEvents.RESOURCE_LOAD_ERROR).toBe('resourceLoadError');
    expect(Requestr.customEvents.RESOURCE_LOAD_COMPLETE).toBe('resourceLoadComplete');
    expect(Requestr.customEvents.RESOURCE_RESOLVING).toBe('resourceResolving');
  });

  describe('Requestr.dispatchCustomEvent', function() {
    beforeEach(function() {
      // TODO (jam@): Add better test with CustomEvent support.
      window.CustomEvent = function() {};
      Requestr.onEvent = null;
    });
    afterEach(function() {
      Requestr.onEvent = null;
      window.CustomEvent = null;
    });

    it('should be defined', function() {
      expect(Requestr.dispatchCustomEvent).toBeDefined();
    });

    it('should dispath a custom event', function() {
      spyOn(Requestr, 'onEvent');
      spyOn(window, 'CustomEvent');

      Requestr.dispatchCustomEvent('test');

      expect(Requestr.onEvent).toHaveBeenCalled();
      expect(window.CustomEvent).toHaveBeenCalled();
    });

    it('should not dispath a custom event', function() {
      spyOn(window, 'CustomEvent');

      Requestr.dispatchCustomEvent('test');

      expect(window.CustomEvent).not.toHaveBeenCalled();
    });
  });

  describe('Requestr.stopWindow', function() {
    it('should be defined', function() {
      expect(Requestr.stopWindow).toBeDefined();
    });
    // TODO (jam@): Add test when IE support is implemented.
    it('should call window stop', function() {
      spyOn(window, 'stop');
      Requestr.stopWindow();
      expect(window.stop).toHaveBeenCalled();
    });
  });

  describe('Requestr.parseSerialization', function() {
    it('should be defined', function() {
      expect(Requestr.parseSerialization).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.loadPage', function() {
    afterEach(function() {
      document.documentElement.classList.remove(Requestr.LOADING_CLASS);
    });
    it('should be defined', function() {
      expect(Requestr.loadPage).toBeDefined();
    });

    it('should make xhr to load page with no callback', function() {
      spyOn(Requestr, 'stopWindow');
      spyOn(Requestr, 'dispatchCustomEvent');

      Requestr.loadPage('some.html');

      expect(document.documentElement.classList.contains(Requestr.LOADING_CLASS)).toBe(true);
      expect(Requestr.stopWindow).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_START);
      expect(typeof Requestr.xhr).toBe('object');
      expect(Requestr.xhr.blobUrlCallback).toBe(undefined);
      expect(Requestr.xhr.responseType).toBe('document');
    });

    it('should make xhr to load page with callback', function() {
      spyOn(Requestr, 'stopWindow');
      spyOn(Requestr, 'dispatchCustomEvent');

      var someCallBack = function myFancyFunction() {};
      Requestr.loadPage('some.html', someCallBack);

      expect(document.documentElement.classList.contains(Requestr.LOADING_CLASS)).toBe(true);
      expect(Requestr.stopWindow).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_START);
      expect(typeof Requestr.xhr).toBe('object');
      expect(Requestr.xhr.blobUrlCallback).toBe(someCallBack);
      expect(Requestr.xhr.responseType).toBe('document');
    });
  });

  describe('Requestr.removePageLoadXhrListeners', function() {
    it('should be defined', function() {
      expect(Requestr.removePageLoadXhrListeners).toBeDefined();
    });

    it('should remove event listeners', function() {
      spyOn(Requestr.xhr, 'removeEventListener');

      Requestr.removePageLoadXhrListeners();

      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('load', Requestr.parsePage, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('progress', Requestr.pageLoadProgress, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('error', Requestr.pageLoadError, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('abort', Requestr.pageLoadAbort, true);
    });
  });

  describe('Requestr.pageLoadProgress', function() {
    it('should be defined', function() {
      expect(Requestr.pageLoadProgress).toBeDefined();
    });

    it('should dispatch a custom event with progress data', function() {
      spyOn(Requestr, 'dispatchCustomEvent');

      var progress = {totalSize: 100, loaded: 50};
      Requestr.pageLoadProgress(progress);

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_PROGRESS, {progress: Math.round(progress.loaded / progress.totalSize * 100)});
    });
  });

  describe('Requestr.pageLoadError', function() {
    it('should be defined', function() {
      expect(Requestr.pageLoadError).toBeDefined();
    });

    it('should dispatch custom error event', function() {
      spyOn(Requestr, 'removePageLoadXhrListeners');
      spyOn(Requestr, 'dispatchCustomEvent');

      var error = {some: 'test'};
      Requestr.pageLoadError(error);

      expect(Requestr.removePageLoadXhrListeners).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_ERROR, {error: error});
    });
  });

  describe('Requestr.pageLoadAbort', function() {
    it('should be defined', function() {
      expect(Requestr.pageLoadAbort).toBeDefined();
    });

    it('should dispatch custom abort event', function() {
      spyOn(Requestr, 'removePageLoadXhrListeners');
      spyOn(Requestr, 'dispatchCustomEvent');

      var abort = {some: 'test'};
      Requestr.pageLoadError(abort);

      expect(Requestr.removePageLoadXhrListeners).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_ERROR, {error: abort});
    });
  });

  // TODO (jam@): Address missing tests.
  describe('Requestr.parsePage', function() {
    beforeEach(function() {
      delete Requestr.service;
    });
    afterEach(function() {
      delete Requestr.service;
    });

    it('should be defined', function() {
      expect(Requestr.parsePage).toBeDefined();
    });

    it('should attempt to parse the document', function() {
      var doc = window.document.implementation.createHTMLDocument(''),
          html = '<img src="http://blog.intuit.co.uk/wp-content/uploads/2013/01/tradeshift_logo_blue.jpg" />';

      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'removePageLoadXhrListeners');

      doc.body.innerHTML = html;
      Requestr.service = 'http://some.domain.com/my/api/url';
      Requestr.parsePage({target: {response: doc}});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_COMPLETE);
      expect(Requestr.removePageLoadXhrListeners).toHaveBeenCalled();
      expect(Requestr.ownerDocument).toBe(doc);
      // TODO (jam@): Add checks to elements to be matched.
      expect(doc.head.getElementsByTagName('base').length).toBe(1);
      // TODO (jam@): Add checks to make sure Requestr elements are removed.
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_LOAD_START);
      // TODO (jam@): Add checks to ensure the XHR is made with the proper data.
    });
  });

  describe('Requestr.removeResponseLoadXhrListener', function() {
    it('should be defined', function() {
      expect(Requestr.removeResponseLoadXhrListener).toBeDefined();
    });

    it('should remove event listeners', function() {
      spyOn(Requestr.xhr, 'removeEventListener');

      Requestr.removeResponseLoadXhrListener();

      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('load', Requestr.handleResponseResources, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('progress', Requestr.handleResponseResourcesProgress, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('error', Requestr.handleResponseResourcesError, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith('abort', Requestr.handleResponseResourcesAbort, true);
    });
  });

  // TODO (jam@): Add missing tests when finalized.
  describe('Requestr.handleResponseResources', function() {
    it('should be defined', function() {
      expect(Requestr.handleResponseResources).toBeDefined();
    });
    beforeEach(function() {
      delete Requestr.xhr;
    });
    afterEach(function() {
      delete Requestr.xhr;
    });

    it('should not do any resolving since no resources returned from service', function() {
      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'dataURItoBlob');
      spyOn(Requestr, 'setDocumentHtml');
      spyOn(Requestr, 'createDocumentBlobUrl');
      spyOn(Requestr, 'removeResponseLoadXhrListener');

      Requestr.xhr = {};
      Requestr.handleResponseResources({target: {response: {}}});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_LOAD_COMPLETE);
      expect(Requestr.removeResponseLoadXhrListener).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_API_ERROR);
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_RESOLVING);
      expect(Requestr.dataURItoBlob).not.toHaveBeenCalled();
      expect(Requestr.setDocumentHtml).toHaveBeenCalled();
    });
  });

  describe('Requestr.handleResponseResourcesProgress', function() {
    it('should be defined', function() {
      expect(Requestr.handleResponseResourcesProgress).toBeDefined();
    });

    it('should dispatch a custom event with progress data', function() {
      spyOn(Requestr, 'dispatchCustomEvent');

      var progress = {loaded: 77};
      Requestr.handleResponseResourcesProgress(progress);

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_LOAD_PROGRESS, {bytes: Math.round(progress.loaded)});
    });
  });

  describe('Requestr.handleResponseResourcesAbort', function() {
    it('should be defined', function() {
      expect(Requestr.handleResponseResourcesAbort).toBeDefined();
    });

    it('should dispatch custom abort event', function() {
      spyOn(Requestr, 'removeResponseLoadXhrListener');
      spyOn(Requestr, 'dispatchCustomEvent');

      var abort = {some: 'test'};
      Requestr.handleResponseResourcesAbort(abort);

      expect(Requestr.removeResponseLoadXhrListener).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_LOAD_ERROR, {error: abort});
    });
  });

  describe('Requestr.handleResponseResourcesError', function() {
    it('should be defined', function() {
      expect(Requestr.handleResponseResourcesError).toBeDefined();
    });

    it('should dispatch custom error event', function() {
      spyOn(Requestr, 'removeResponseLoadXhrListener');
      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'setDocumentHtml');

      var error = {some: 'test'};
      Requestr.handleResponseResourcesError(error);

      expect(Requestr.removeResponseLoadXhrListener).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_LOAD_ERROR, {error: error});
      expect(Requestr.setDocumentHtml).toHaveBeenCalled();
    });
  });

  // TODO (jam@): Improve test to include checking the data and blob.
  describe('Requestr.dataURItoBlob', function() {
    it('should be defined', function() {
      expect(Requestr.dataURItoBlob).toBeDefined();
    });

    it('should create a blob from the uri data', function() {
      spyOn(window, 'Uint8Array');
      spyOn(window, 'Blob');

      var test, uri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg';
      test = Requestr.dataURItoBlob(uri);

      expect(window.Blob).toHaveBeenCalled();
      expect(window.Uint8Array).toHaveBeenCalled();
    });
  });

  describe('Requestr.setDocumentHtml', function() {
    it('should be defined', function() {
      expect(Requestr.setDocumentHtml).toBeDefined();
    });

    it('should replace current document with parsed data', function() {
      var doc = window.document.implementation.createHTMLDocument(''),
          html = '<html><body>hi</body></html>';

      spyOn(window, 'dispatchEvent');

      doc.documentElement.setAttribute('data-test', 'works');
      Requestr.setDocumentHtml(doc, html);

      expect(window.dispatchEvent).toHaveBeenCalled();
      expect(document.body.innerHTML).toBe('hi');
      expect(document.documentElement.getAttribute('data-test')).toBe('works');
    });
  });

  describe('Requestr.createDocumentBlobUrl', function() {
    it('should be defined', function() {
      expect(Requestr.createDocumentBlobUrl).toBeDefined();
    });

    it('should create a blob url from data in memory', function() {
      var test = {callback: function() {}},
          doc = window.document.implementation.createHTMLDocument('');

      spyOn(Requestr, 'setDocumentElementAttributes');
      spyOn(test, 'callback');
      spyOn(Requestr, 'dataURItoBlob');

      Requestr.createDocumentBlobUrl(doc, doc, test.callback);

      expect(test.callback).toHaveBeenCalledWith({url: undefined, html: doc.documentElement.outerHTML});
    });
  });

  describe('Requestr.duplicateElementAttributes', function() {
    it('should be defined', function() {
      expect(Requestr.duplicateElementAttributes).toBeDefined();
    });

    it('should copy attributes from one element to another', function() {
      var el1 = document.createElement('div'),
          el2 = document.createElement('div');
      el1.setAttribute('data-test', 'works');

      Requestr.duplicateElementAttributes(el1, el2);

      expect(el2.getAttribute('data-test')).toBe('works');
    });
  });

  describe('Requestr.setDocumentElementAttributes', function() {
    it('should be defined', function() {
      expect(Requestr.setDocumentElementAttributes).toBeDefined();
    });

    it('should copy attributes from one element to another', function() {
      var el1 = document.createElement('div'),
          el2 = document.createElement('div');
      el1.setAttribute('data-test', 'works');
      el2.setAttribute('data-removeit', 'works');

      Requestr.setDocumentElementAttributes(el2, el1);

      expect(el2.getAttribute('data-test')).toBe('works');
      expect(el2.getAttribute('data-removeit')).toBe(null);
    });
  });

  // TODO (jam@): Determin if this is needed, if so add test.
  describe('Requestr.getDocType', function() {
    it('should be defined', function() {
      expect(Requestr.getDocType).toBeDefined();
    });
  });

});
