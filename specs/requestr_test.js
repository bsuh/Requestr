/* Globals exposed by Jasmine*/
/* global jasmine, isCommonJS, exports, spyOn, it, xit, expect, runs, waits, waitsFor, beforeEach, afterEach, describe, xdescribe */

/* Gobals exposed by Reqestr */
/* global Requestr */

describe('Requestr', function() {

  it('should be defined', function() {
    expect(window).toBeDefined();
    expect(Requestr).toBeDefined();
    expect(window.Requestr).toBeDefined();
    expect(window.serialization).toBe(undefined);
    expect(window.CustomEvent).toBeDefined();
    expect(window.URL).toBeDefined();
  });

  it('should check for initialization', function() {

    expect(Requestr.LOADING_CLASS).toBe('requestr');
    expect(Requestr.ELEMENTS_QUERY).toBe('[rel~="stylesheet"][href], [rel~="icon"][href], [src]');
    expect(Requestr.SERIALIZATION_QUERY).toBe('script[type="text/requestr-serialization"]');
    expect(Requestr.JS_ELEMENT_ATTRIBUTE).toBe('data-requestr-js');
    expect(Requestr.DEFAULT_SERVICE_FILE_MAX_SIZE).toBe(40000);

    expect(Requestr.serialization).toBe(null);
    expect(Requestr.onEvent).toBe(null);

    expect(Requestr.urlParsingEnabledElement).toBeDefined();
    expect(Requestr.urlParsingEnabledElement.IMG).toBeDefined();
    expect(Requestr.urlParsingEnabledElement.LINK).toBeDefined();
    expect(Requestr.urlParsingEnabledElement.SCRIPT).toBeDefined();

    expect(Requestr.resolvedUrls).toBeDefined();
    expect(Requestr.thirdParty).toBeDefined();

    expect(Requestr.browser).toBeDefined();
    expect(Requestr.browser.isSafari).toBeDefined();
    expect(Requestr.browser.isFirefox).toBeDefined();
    expect(Requestr.browser.ieInternetExplorer).toBeDefined();

    expect(Requestr.customEvents).toBeDefined();
    expect(Requestr.customEvents.REQUESTR_READY).toBe('requestrReady');
    expect(Requestr.customEvents.DOCUMENT_LOAD_START).toBe('documentLoadStart');
    expect(Requestr.customEvents.DOCUMENT_LOAD_PROGRESS).toBe('documentLoadProgress');
    expect(Requestr.customEvents.DOCUMENT_LOAD_ERROR).toBe('documentLoadError');
    expect(Requestr.customEvents.DOCUMENT_LOAD_COMPLETE).toBe('documentLoadComplete');
    expect(Requestr.customEvents.DOCUMENT_RENDERED).toBe('documentRendered');
    expect(Requestr.customEvents.DOCUMENT_BLOB_URL_CREATED).toBe('documentBlobUrlCreated');
    expect(Requestr.customEvents.RESOURCE_API_ERROR).toBe('resourceApiError');
    expect(Requestr.customEvents.RESOURCE_LOAD_START).toBe('resourceLoadStart');
    expect(Requestr.customEvents.RESOURCE_LOAD_PROGRESS).toBe('resourceLoadProgress');
    expect(Requestr.customEvents.RESOURCE_LOAD_ERROR).toBe('resourceLoadError');
    expect(Requestr.customEvents.RESOURCE_LOAD_COMPLETE).toBe('resourceLoadComplete');
    expect(Requestr.customEvents.RESOURCE_RESOLVING).toBe('resourceResolving');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_START).toBe('externalCssLoadStart');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_COMPLETE).toBe('externalCssLoadComplete');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_PROGRESS).toBe('externalCssLoadProgress');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_ERROR).toBe('externalCssLoadError');

    expect(Requestr.CACHING_DB_NAME).toBe('Requestr');
    expect(Requestr.CACHING_DB_STORE_NAME).toBe('datauris');
    expect(Requestr.CACHING_DB_STORE_KEY).toBe('url');
    expect(Requestr.CACHING_DB_VERSION).toBeDefined();

    expect(Requestr.localDb || Requestr.localDbPolyfill).toBeDefined();

    expect(Requestr.resourcesToCache).toEqual([]);
    expect(Requestr.resourcesFetchedFromCache).toEqual([]);
    expect(Requestr.cache).toBeDefined();
    expect(Requestr.cache.expires).toBeDefined();
    expect(Requestr.cache.pollyfill).toBeDefined();
    expect(Requestr.cache.pollyfill.websql).toBeDefined();
    expect(Requestr.WEBSQL_DEFAULT_SIZE).toBe(2.5 * 1024 * 1024);
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

    it('should call window stop', function() {
      spyOn(window, 'stop');
      Requestr.stopWindow();
      expect(window.stop).toHaveBeenCalled();
    });

    it('should call window stop with IE command', function() {
      var stop = window.stop;
      window.stop = null;
      spyOn(document, 'execCommand');

      Requestr.stopWindow();

      expect(document.execCommand).toHaveBeenCalledWith('Stop');
    });
  });

  describe('Requestr.parseSerialization', function() {
    it('should be defined', function() {
      expect(Requestr.parseSerialization).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.initLocalDb', function() {
    it('should be defined', function() {
      expect(Requestr.initLocalDb).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.cache.update', function() {
    it('should be defined', function() {
      expect(Requestr.cache.update).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.cache.pollyfill.websql.add', function() {
    it('should be defined', function() {
      expect(Requestr.cache.pollyfill.websql.add).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.cache.add', function() {
    it('should be defined', function() {
      expect(Requestr.cache.add).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.cache.pollyfill.websql.read', function() {
    it('should be defined', function() {
      expect(Requestr.cache.pollyfill.websql.read).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.cache.read', function() {
    it('should be defined', function() {
      expect(Requestr.cache.read).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.cache.remove', function() {
    it('should be defined', function() {
      expect(Requestr.cache.remove).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.cache.clear', function() {
    it('should be defined', function() {
      expect(Requestr.cache.clear).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.loadFragment', function() {
    it('should be defined', function() {
      expect(Requestr.loadFragment).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  // TODO (jam@): Update due to changes.
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

    });

    it('should make xhr to load page with callback', function() {
      spyOn(Requestr, 'stopWindow');
      spyOn(Requestr, 'dispatchCustomEvent');

      var someCallBack = function myFancyFunction() {};
      Requestr.loadPage('some.html', someCallBack);

      expect(document.documentElement.classList.contains(Requestr.LOADING_CLASS)).toBe(true);
      expect(Requestr.stopWindow).not.toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_START);
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

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_PROGRESS, {progress: Math.round(progress.loaded / progress.totalSize * 100), bytes: 50, total: 100});
    });
  });

  describe('Requestr.pageLoadError', function() {
    it('should be defined', function() {
      expect(Requestr.pageLoadError).toBeDefined();
    });

    it('should dispatch custom error event', function() {
      spyOn(Requestr, 'dispatchCustomEvent');

      var error = {some: 'test'};
      Requestr.pageLoadError(error);

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_ERROR, {error: error});
    });
  });

  describe('Requestr.pageLoadAbort', function() {
    it('should be defined', function() {
      expect(Requestr.pageLoadAbort).toBeDefined();
    });

    it('should dispatch custom abort event', function() {
      spyOn(Requestr, 'dispatchCustomEvent');

      var abort = {some: 'test'};
      Requestr.pageLoadError(abort);

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_ERROR, {error: abort});
    });
  });

  // TODO (jam@): Address missing tests. Update test due to changes.
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

      doc.body.innerHTML = html;
      Requestr.service = 'http://some.domain.com/my/api/url';
      Requestr.parsePage({target: {response: doc}});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.DOCUMENT_LOAD_COMPLETE);
      expect(Requestr.ownerDocument).toBe(doc);
      // TODO (jam@): Add checks to elements to be matched.
      expect(doc.head.getElementsByTagName('base').length).toBe(1);
      // TODO (jam@): Add checks to make sure Requestr elements are removed.
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(Requestr.customEvents.RESOURCE_LOAD_START);
      // TODO (jam@): Add checks to ensure the XHR is made with the proper data.
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.getMatchingObjectWithUrl', function() {
    it('should be defined', function() {
      expect(Requestr.getMatchingObjectWithUrl).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.requestDataUriFromService', function() {
    it('should be defined', function() {
      expect(Requestr.requestDataUriFromService).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.getParsedCssFromRules', function() {
    it('should be defined', function() {
      expect(Requestr.getParsedCssFromRules).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.getUrlsFromCssString', function() {
    it('should be defined', function() {
      expect(Requestr.getUrlsFromCssString).toBeDefined();
    });
  });

  describe('Requestr.removeResponseLoadXhrListener', function() {
    afterEach(function() {
      Requestr.xhr = {removeEventListener: function() {}};
    });
    afterEach(function() {
      Requestr.xhr = null;
    });
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

  // TODO (jam@): Add missing tests when finalized. Update test due to changes.
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

  // TODO (jam@): Add missing test.
  describe('Requestr.completeResolvingDocument', function() {
    it('should be defined', function() {
      expect(Requestr.completeResolvingDocument).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.loadExternalCssUrls', function() {
    it('should be defined', function() {
      expect(Requestr.loadExternalCssUrls).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.handleExternalCssResourcesProgress', function() {
    it('should be defined', function() {
      expect(Requestr.handleExternalCssResourcesProgress).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.handleExternalCssResourcesError', function() {
    it('should be defined', function() {
      expect(Requestr.handleExternalCssResourcesError).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.handleDocumentCssUris', function() {
    it('should be defined', function() {
      expect(Requestr.handleDocumentCssUris).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.resolveDocumentCssUrls', function() {
    it('should be defined', function() {
      expect(Requestr.resolveDocumentCssUrls).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.parseCssResourcesForUrls', function() {
    it('should be defined', function() {
      expect(Requestr.parseCssResourcesForUrls).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.matchResourceWithCache', function() {
    it('should be defined', function() {
      expect(Requestr.matchResourceWithCache).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.createUrlFromResource', function() {
    it('should be defined', function() {
      expect(Requestr.createUrlFromResource).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.replaceDocumentUrlsWithBlob', function() {
    it('should be defined', function() {
      expect(Requestr.replaceDocumentUrlsWithBlob).toBeDefined();
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

  // TODO (jam@): Add missing test.
  describe('Requestr.dataStringToBlob', function() {
    it('should be defined', function() {
      expect(Requestr.dataStringToBlob).toBeDefined();
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

  // TODO (@jam): Update test.
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

  // TODO (jam@): Add missing test.
  describe('Requestr.thirdParty.preg_quote', function() {
    it('should be defined', function() {
      expect(Requestr.thirdParty.preg_quote).toBeDefined();
    });
  });

  // TODO (jam@): Add missing test.
  describe('Requestr.init', function() {
    it('should be defined', function() {
      expect(Requestr.init).toBeDefined();
    });
  });

});
