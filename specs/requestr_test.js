/* Globals exposed by Jasmine*/
/* global jasmine, isCommonJS, exports, spyOn, it,
xit, expect, runs, waits, waitsFor, beforeEach,
afterEach, describe, xdescribe */

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
    expect(Requestr.ELEMENTS_QUERY).toBe(
        '[rel~="stylesheet"][href], [rel~="icon"][href], [src]');
    expect(Requestr.SERIALIZATION_QUERY).toBe(
        'script[type="text/requestr-serialization"]');
    expect(Requestr.JS_ELEMENT_ATTRIBUTE).toBe('data-requestr-js');
    expect(Requestr.ORIGINAL_URL_ATTRIBUTE).toBe('data-requestr-url');
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
    expect(Requestr.customEvents.DOCUMENT_LOAD_START).toBe(
        'documentLoadStart');
    expect(Requestr.customEvents.DOCUMENT_LOAD_PROGRESS).toBe(
        'documentLoadProgress');
    expect(Requestr.customEvents.DOCUMENT_LOAD_ERROR).toBe(
        'documentLoadError');
    expect(Requestr.customEvents.DOCUMENT_LOAD_COMPLETE).toBe(
        'documentLoadComplete');
    expect(Requestr.customEvents.DOCUMENT_RENDERED).toBe(
        'documentRendered');
    expect(Requestr.customEvents.DOCUMENT_BLOB_URL_CREATED).toBe(
        'documentBlobUrlCreated');
    expect(Requestr.customEvents.RESOURCE_API_ERROR).toBe(
        'resourceApiError');
    expect(Requestr.customEvents.RESOURCE_LOAD_START).toBe(
        'resourceLoadStart');
    expect(Requestr.customEvents.RESOURCE_LOAD_PROGRESS).toBe(
        'resourceLoadProgress');
    expect(Requestr.customEvents.RESOURCE_LOAD_ERROR).toBe(
        'resourceLoadError');
    expect(Requestr.customEvents.RESOURCE_LOAD_COMPLETE).toBe(
        'resourceLoadComplete');
    expect(Requestr.customEvents.RESOURCE_RESOLVING).toBe(
        'resourceResolving');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_START).toBe(
        'externalCssLoadStart');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_COMPLETE).toBe(
        'externalCssLoadComplete');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_PROGRESS).toBe(
        'externalCssLoadProgress');
    expect(Requestr.customEvents.EXTERNAL_CSS_LOAD_ERROR).toBe(
        'externalCssLoadError');

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
      Requestr.onEvent = null;
    });
    afterEach(function() {
      Requestr.onEvent = null;
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
    it('should fail, no serialization', function() {
      spyOn(window, 'dispatchEvent');

      Requestr.parseSerialization(null);

      expect(Requestr.serialization).toBe(null);
      expect(window.dispatchEvent).not.toHaveBeenCalled();
    });
    it('should parse service property', function() {
      spyOn(window, 'dispatchEvent');

      Requestr.parseSerialization({textContent: '{"service": "works"}'});

      expect(Requestr.serialization.service).toBe('works');
      expect(window.dispatchEvent).toHaveBeenCalled();
    });
    it('should parse expires property', function() {
      spyOn(window, 'dispatchEvent');

      Requestr.parseSerialization({textContent:
          '{"expires": "Mon, 10 Mar 2014 20:00:00 GMT"}'});

      expect(Requestr.serialization.expires).toBe(
          'Mon, 10 Mar 2014 20:00:00 GMT');
      expect(Requestr.cache.expires).toBe(1394481600000);
      expect(window.dispatchEvent).toHaveBeenCalled();
    });

    it('should parse self property', function() {
      spyOn(window, 'dispatchEvent');
      spyOn(Requestr, 'loadPage');

      Requestr.parseSerialization({textContent: '{"self": true}'});

      expect(Requestr.serialization.self).toBe(true);
      expect(window.dispatchEvent).toHaveBeenCalled();
      expect(Requestr.loadPage).toHaveBeenCalledWith(window.location.href);
    });

    it('should parse owner property', function() {
      spyOn(window, 'dispatchEvent');
      spyOn(Requestr, 'loadPage');

      Requestr.parseSerialization({textContent: '{"owner": "some.url"}'});

      expect(Requestr.serialization.owner).toBe('some.url');
      expect(window.dispatchEvent).toHaveBeenCalled();
      expect(Requestr.loadPage).toHaveBeenCalledWith('some.url');
    });
  });

  describe('Requestr.initLocalDb', function() {
    beforeEach(function() {
      Requestr.localDb = null;
      window.indexedDB = null;
      Requestr.browser.isSafari = false;
    });
    afterEach(function() {
      Requestr.localDb = null;
      window.indexedDB = null;
      Requestr.browser.isSafari = false;
    });
    it('should be defined', function() {
      expect(Requestr.initLocalDb).toBeDefined();
    });
    // TODO (jam@): Find proper test spec for IndexedDb.
    it('should create indexeddb database instance', function() {
      var result, hackRequest = {}, callback = function(r) {result = r;};

      window.indexedDB = {
        open: function() {
          return hackRequest;
        }
      };

      Requestr.initLocalDb(1, callback);

      hackRequest.result = {};
      hackRequest.onsuccess(null);

      expect(window.indexedDB).not.toBe(null);
      expect(Requestr.localDb).not.toBe(null);
      expect(result).toBe(true);
    });
    it('should not create indexeddb database instance', function() {
      var result, hackRequest = {}, callback = function(r) {result = r;};

      window.indexedDB = {
        open: function() {
          return hackRequest;
        }
      };

      Requestr.initLocalDb(1, callback);

      hackRequest.onerror({target: {errorCode: 'error'}});

      expect(Requestr.localDb).toBe(null);
      expect(result).toBe(false);
    });
    it('should fail, database not supported', function() {
      var result, callback = function(r) {result = r;};
      Requestr.initLocalDb(1, callback);

      expect(window.indexedDB).toBe(null);
      expect(Requestr.localDb).toBe(null);
      expect(result).toBe(false);
    });

    it('should create webSQL database instance', function() {
      Requestr.browser.isSafari = true;
      window.indexedDB = null;

      var result, done, callback = function(r) {done = true; result = r;};

      Requestr.initLocalDb(1, callback);

      waitsFor(function() {
        return done;
      }, '', 10000);

      runs(function() {
        expect(Requestr.localDbPolyfill).not.toBe(null);
        expect(result).toBe(true);
      });

      Requestr.browser.isSafari = false;
    });

    it('should not create webSQL database instance', function() {
      Requestr.browser.isSafari = true;
      window.indexedDB = null;

      var result, done, old = window.openDatabase,
          callback = function(r) {done = true; result = r;};

      window.openDatabase = function() {return null;};
      Requestr.initLocalDb(1, callback);

      waitsFor(function() {
        return done;
      }, '', 10000);

      runs(function() {
        expect(Requestr.localDbPolyfill).toBe(null);
        expect(result).toBe(false);
      });

      Requestr.browser.isSafari = false;
      window.openDatabase = old;
    });
  });

  describe('Requestr.cache.update', function() {
    beforeEach(function() {
      Requestr.localDb = null;
      Requestr.browser.isSafari = false;
    });
    afterEach(function() {
      Requestr.localDb = null;
      Requestr.browser.isSafari = false;
      Requestr.localDbPolyfill = null;
    });
    it('should be defined', function() {
      expect(Requestr.cache.update).toBeDefined();
    });
    it('should be add resources via IndexedDb', function() {
      var resources = [1, 2, 3];
      Requestr.localDb = {};
      spyOn(Requestr.cache, 'add');

      Requestr.cache.update(resources);

      expect(Requestr.cache.add).toHaveBeenCalledWith(
          resources, jasmine.any(Function), jasmine.any(Function));
    });
    it('should be add resources via webSQL', function() {
      var resources = [1, 2, 3];
      Requestr.browser.isSafari = true;
      Requestr.localDbPolyfill = {};
      spyOn(Requestr.cache.pollyfill.websql, 'add');

      Requestr.cache.update(resources);

      expect(Requestr.cache.pollyfill.websql.add).toHaveBeenCalledWith(
          resources, jasmine.any(Function), jasmine.any(Function));
    });
  });

  describe('Requestr.cache.pollyfill.websql.add', function() {
    var resources, success, error, done;

    beforeEach(function() {
      Requestr.localDbPolyfill = {};
    });

    afterEach(function() {
      resources = success = error = null;
      Requestr.localDbPolyfill = null;
    });

    it('should be defined', function() {
      expect(Requestr.cache.pollyfill.websql.add).toBeDefined();
    });

    it('should add resources to cache (websql polyfill)', function() {
      resources = [{
        url: '',
        token: '',
        mimeType: '',
        dataType: '',
        data: '',
        date: ''
      }];

      Requestr.localDbPolyfill.transaction = function(func) {
        func({executeSql: function(p1, p2, s, e) {
          s();
          done = true;
        }});
      };

      waitsFor(function() {
        return done;
      }, '', 10000);

      runs(function() {
        expect(success).toBe(true);
        expect(error).toBe(null);
      });

      Requestr.cache.pollyfill.websql.add(resources, function() {
        success = true;
      }, function(e) {
        error = true;
      });
    });
  });

  describe('Requestr.cache.add', function() {
    var resources, success, error, done, request, transaction;

    beforeEach(function() {
      Requestr.localDb = {};
    });

    afterEach(function() {
      resources = success = error = null;
      Requestr.localDb = null;
    });

    it('should be defined', function() {
      expect(Requestr.cache.add).toBeDefined();
    });

    it('should add resources to cache (indexeddb)', function() {
      resources = [{
        url: 'http://tradeshift.com',
        token: '',
        mimeType: '',
        dataType: '',
        data: '',
        date: ''
      }];

      Requestr.localDb.transaction = function(p1, p2) {
        return transaction = {
          objectStore: function(p) {
            return {put: function(pp) {
              return request = {};
            }};
          }
        };
      };

      Requestr.cache.add(resources,
      function() {
        success = true;
      },
      function(e) {
        error = true;
      });

      request.onsuccess({target: {result: 'xxx'}});
      transaction.oncomplete();
      expect(success).toBe(true);
      expect(error).toBe(null);

    });

    it('should not add resources to cache (indexeddb) due to error',
        function() {
      resources = [{
        url: 'http://tradeshift.com',
        token: '',
        mimeType: '',
        dataType: '',
        data: '',
        date: ''
      }];

      Requestr.localDb.transaction = function(p1, p2) {
        return transaction = {
          objectStore: function(p) {
            return {put: function(pp) {
              return request = {};
            }};
          }
        };
      };

      Requestr.cache.add(resources,
      function() {
        success = true;
      },
      function(e) {
        error = true;
      });

      request.onerror({target: {error: {message: 'xxx'}}});
      transaction.onerror();
      expect(success).toBe(null);
      expect(error).toBe(true);

    });
  });

  describe('Requestr.cache.pollyfill.websql.read', function() {
    beforeEach(function() {
      Requestr.localDbPolyfill = {};
    });

    afterEach(function() {
      Requestr.localDbPolyfill = null;
    });

    it('should be defined', function() {
      expect(Requestr.cache.pollyfill.websql.read).toBeDefined();
    });

    it('should be defined', function() {
      var success, requests = [{
        Url: 'http://tradeshift.com'
      }];

      Requestr.localDbPolyfill.transaction = function(func) {
        func({executeSql: function(p1, p2, s, e) {
          success = true;
        }});
      };

      Requestr.cache.pollyfill.websql.read(requests,
          function(r) {success = true;});

      expect(success).toBe(true);
    });
  });

  describe('Requestr.cache.read', function() {
    var request;

    beforeEach(function() {
      Requestr.localDbPolyfill = {};
      Requestr.browser.isSafari = false;
      Requestr.localDb = {
        transaction: function() {
          return {objectStore: function() {
              return {get: function(url) {return request;}};
            }
          };
        },
        objectStoreNames: {length: 1}
      };
    });

    afterEach(function() {
      Requestr.localDbPolyfill = null;
      Requestr.browser.isSafari = false;
      Requestr.localDb = null;
    });

    it('should be defined', function() {
      expect(Requestr.cache.read).toBeDefined();
    });

    it('should read resource from cache', function() {
      var requests, result;

      request = {};

      requests = [{Url: 'http://tradeshift.com'}];

      Requestr.cache.read(requests, function(r) {result = r;});
      request.onsuccess({target: {result: {}}});

      expect(result.length).toBe(1);
    });

    it('should not read resource from cache', function() {
      var requests, result;

      request = {};

      requests = [{Url: 'http://tradeshift.com'}];

      Requestr.cache.read(requests, function(r) {result = r;});
      request.onerror(null);

      expect(result.length).toBe(0);
    });
  });

  describe('Requestr.cache.remove', function() {
    it('should be defined', function() {
      expect(Requestr.cache.remove).toBeDefined();
    });
    // TODO (jam@): Add test when functionality is ready.
  });

  describe('Requestr.cache.clear', function() {
    afterEach(function() {
      Requestr.localDbPolyfill = null;
      Requestr.browser.isSafari = false;
      Requestr.localDb = null;
      window.indexedDB = null;
    });

    it('should be defined', function() {
      expect(Requestr.cache.clear).toBeDefined();
    });

    it('should clear indexeddb cache', function() {
      Requestr.localDb = {};
      window.indexedDB = {deleteDatabase: function() {}};

      spyOn(window.indexedDB, 'deleteDatabase');

      Requestr.cache.clear();

      expect(window.indexedDB.deleteDatabase).toHaveBeenCalledWith(
          Requestr.CACHING_DB_NAME);
    });

    it('should clear websql cache', function() {
      Requestr.browser.isSafari = true;
      Requestr.localDbPolyfill = {transaction: function() {}};

      spyOn(Requestr.localDbPolyfill, 'transaction');

      Requestr.cache.clear();

      expect(Requestr.localDbPolyfill.transaction).toHaveBeenCalledWith(
          jasmine.any(Function));
    });
  });

  describe('Requestr.loadFragment', function() {
    it('should be defined', function() {
      expect(Requestr.loadFragment).toBeDefined();
    });

    it('should parse fragment', function() {
      var result, source = 'http://tradeshift.com',
          html = '<p>tradeshift</p>';

      spyOn(Requestr, 'parsePage').andCallThrough();

      Requestr.loadFragment(source, html, function(r) {result = r;});

      expect(Requestr.parsePage).toHaveBeenCalledWith({
          originUrl: source,
          target: jasmine.any(Object)
        },
        jasmine.any(Function), null, null, true);
      expect(typeof result).toBe('string');
      expect(result).toBe('<p>tradeshift</p>');
    });
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
      spyOn(Requestr, 'requestDataUriFromService');

      Requestr.loadPage('some.html');

      var url = document.createElement('a');
      url.setAttribute('href', 'some.html');
      url = url.href;

      expect(document.documentElement.classList.contains(
          Requestr.LOADING_CLASS)).toBe(true);
      expect(Requestr.stopWindow).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.DOCUMENT_LOAD_START);
      expect(Requestr.requestDataUriFromService).toHaveBeenCalledWith(
          Requestr.service,
        [{
          Url: url,
          Document: true,
          Token: null,
          Type: 'STRING'
        }],
        jasmine.any(Object),
        null,
        Requestr.cache.expires,
        2000000
      );
    });

    it('should make xhr to load page with callback', function() {
      spyOn(Requestr, 'stopWindow');
      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'requestDataUriFromService');

      var someCallBack = function myFancyFunction() {};
      Requestr.loadPage('some.html', someCallBack);

      var url = document.createElement('a');
      url.setAttribute('href', 'some.html');
      url = url.href;

      expect(document.documentElement.classList.contains(
          Requestr.LOADING_CLASS)).toBe(true);
      expect(Requestr.stopWindow).not.toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.DOCUMENT_LOAD_START);
      expect(Requestr.requestDataUriFromService).toHaveBeenCalledWith(
          Requestr.service,
        [{
          Url: url,
          Document: true,
          Token: null,
          Type: 'STRING'
        }],
        jasmine.any(Object),
        null,
        Requestr.cache.expires,
        2000000
      );
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

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.DOCUMENT_LOAD_PROGRESS, {
          progress:
                Math.round(progress.loaded / progress.totalSize * 100),
          bytes: 50,
          total: 100
        }
      );
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

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.DOCUMENT_LOAD_ERROR, {error: error});
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

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.DOCUMENT_LOAD_ERROR, {error: abort});
    });
  });

  // TODO (jam@): Address missing tests. Update test due to changes
  // (callback, expires, mutator, fragment).
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
          html = '<img src="http://blog.intuit.co.uk/wp-content/uploads' +
              '/2013/01/tradeshift_logo_blue.jpg" />';

      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'requestDataUriFromService');

      doc.body.innerHTML = html;
      Requestr.service = 'http://some.domain.com/my/api/url';
      Requestr.parsePage({target: {response: doc}});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.DOCUMENT_LOAD_COMPLETE);
      expect(Requestr.ownerDocument).toBe(doc);
      // TODO (jam@): Add checks to elements to be matched.
      expect(doc.head.getElementsByTagName('base').length).toBe(1);
      // TODO (jam@): Add checks to make sure Requestr
      // elements are removed.
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
      Requestr.customEvents.RESOURCE_LOAD_START);
      // TODO (jam@): Add checks to ensure the XHR is made with
      // the proper data.
      expect(Requestr.requestDataUriFromService).toHaveBeenCalled();
    });
  });

  describe('Requestr.getMatchingObjectWithUrl', function() {
    it('should be defined', function() {
      expect(Requestr.getMatchingObjectWithUrl).toBeDefined();
    });

    it('should return a match', function() {
      var list = [{url: 'test'}], url = 'test';

      var test = Requestr.getMatchingObjectWithUrl(list, url);

      expect(test).toBe(list[0]);
    });

    it('should not return a match', function() {
      var list = [{url: 'testing'}], url = 'test';

      var test = Requestr.getMatchingObjectWithUrl(list, url);

      expect(test).toBe(undefined);
    });
  });

  describe('Requestr.requestDataUriFromService', function() {
    it('should be defined', function() {
      expect(Requestr.requestDataUriFromService).toBeDefined();
    });

    it('should try to get resource from cache or service', function() {
      var result;

      spyOn(Requestr.cache, 'read').andCallThrough();

      Requestr.requestDataUriFromService('ghghg', [],
          {load: function(r) {result = r;}}, function(r) {});

      expect(Requestr.xhr.blobUrlCallback).toBeDefined();
      expect(Requestr.cache.read).toHaveBeenCalled();
      expect(result.target.response.Resources).toBeDefined();
    });
    // TODO (jam@): Improve and add missing tests.
  });

  describe('Requestr.getParsedCssFromRules', function() {
    it('should be defined', function() {
      expect(Requestr.getParsedCssFromRules).toBeDefined();
    });
    // TODO (jam@): Add test!
  });

  describe('Requestr.getUrlsFromCssString', function() {
    it('should be defined', function() {
      expect(Requestr.getUrlsFromCssString).toBeDefined();
    });

    it('should not parse rules because not defined', function() {
      var test = Requestr.getParsedCssFromRules(null);

      expect(test).toBe(null);
    });

    it('should parse rules and return valid string', function() {
      var test = Requestr.getParsedCssFromRules([{cssText: 'test'},
          {cssText: ' testing'}]);

      expect(typeof test).toBe('string');
      expect(test).toBe('test testing');
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

      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith(
          'load', Requestr.handleResponseResources, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith(
          'progress', Requestr.handleResponseResourcesProgress, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith(
          'error', Requestr.handleResponseResourcesError, true);
      expect(Requestr.xhr.removeEventListener).toHaveBeenCalledWith(
          'abort', Requestr.handleResponseResourcesAbort, true);
    });
  });

  // TODO (jam@): Add missing tests when finalized. Update test
  // due to changes.
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

    it('should not do any resolving since no resources returned from ' +
        'service', function() {
      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'dataURItoBlob');
      spyOn(Requestr, 'setDocumentHtml');
      spyOn(Requestr, 'createDocumentBlobUrl');
      spyOn(Requestr, 'removeResponseLoadXhrListener');

      Requestr.xhr = {};
      Requestr.handleResponseResources({target: {response: {}}});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.RESOURCE_LOAD_COMPLETE);
      expect(Requestr.removeResponseLoadXhrListener).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.RESOURCE_API_ERROR);
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.RESOURCE_RESOLVING);
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

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.RESOURCE_LOAD_PROGRESS,
              {bytes: Math.round(progress.loaded)});
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
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.RESOURCE_LOAD_ERROR, {error: abort});
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
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.RESOURCE_LOAD_ERROR, {error: error});
      expect(Requestr.setDocumentHtml).toHaveBeenCalled();
    });
  });

  describe('Requestr.completeResolvingDocument', function() {
    it('should be defined', function() {
      expect(Requestr.completeResolvingDocument).toBeDefined();
    });

    it('should set loaded into current document', function() {
      var owner = {}, dimp = {documentElement: {outerHTML: 'ts'}};

      spyOn(Requestr, 'setDocumentHtml');
      spyOn(Requestr.cache, 'update');

      Requestr.completeResolvingDocument(dimp, owner);

      expect(Requestr.setDocumentHtml).toHaveBeenCalledWith(
          owner, dimp.documentElement.outerHTML);
      expect(Requestr.cache.update).toHaveBeenCalled();
    });

    it('should create blob url from loaded document', function() {
      spyOn(Requestr, 'createDocumentBlobUrl');
      spyOn(Requestr.cache, 'update');

      Requestr.completeResolvingDocument({}, {}, function() {});

      expect(Requestr.createDocumentBlobUrl).toHaveBeenCalled();
      expect(Requestr.cache.update).toHaveBeenCalled();
    });
  });

  describe('Requestr.loadExternalCssUrls', function() {
    it('should be defined', function() {
      expect(Requestr.loadExternalCssUrls).toBeDefined();
    });

    it('should resolve document with no additional urls to parse',
        function() {
      spyOn(Requestr, 'resolveDocumentCssUrls');
      spyOn(Requestr, 'dispatchCustomEvent');

      Requestr.loadExternalCssUrls([], [], null, {}, []);

      expect(Requestr.resolveDocumentCssUrls).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).not.toHaveBeenCalledWith(
          Requestr.customEvents.EXTERNAL_CSS_LOAD_START);
    });

    it('should parse additional urls before resolving document',
        function() {
      spyOn(Requestr, 'requestDataUriFromService');
      spyOn(Requestr, 'dispatchCustomEvent');

      Requestr.loadExternalCssUrls(
          ['http://tradeshift.com'], [], null, {}, []);

      expect(Requestr.requestDataUriFromService).toHaveBeenCalled();
      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.EXTERNAL_CSS_LOAD_START);
    });
  });

  describe('Requestr.handleExternalCssResourcesProgress', function() {
    it('should be defined', function() {
      expect(Requestr.handleExternalCssResourcesProgress).toBeDefined();
    });

    it('should dispatch external css load progress event', function() {
      spyOn(Requestr, 'dispatchCustomEvent');

      Requestr.handleExternalCssResourcesProgress({loaded: 24.6});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
        Requestr.customEvents.EXTERNAL_CSS_LOAD_PROGRESS,
        {bytes: 25}
      );
    });
  });

  describe('Requestr.handleExternalCssResourcesError', function() {
    it('should be defined', function() {
      expect(Requestr.handleExternalCssResourcesError).toBeDefined();
    });

    it('should dispatch external css load error event', function() {
      spyOn(Requestr, 'dispatchCustomEvent');

      Requestr.handleExternalCssResourcesError('error');

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
        Requestr.customEvents.EXTERNAL_CSS_LOAD_ERROR,
        {error: 'error'}
      );
    });
  });

  describe('Requestr.handleDocumentCssUris', function() {
    it('should be defined', function() {
      expect(Requestr.handleDocumentCssUris).toBeDefined();
    });

    it('should attempt to resolve document with no additional ' +
        'external css to parse', function() {
      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'resolveDocumentCssUrls');

      Requestr.handleDocumentCssUris(
          {target: {response: {}}}, [], {}, [], function() {});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.EXTERNAL_CSS_LOAD_COMPLETE);
      expect(Requestr.resolveDocumentCssUrls).toHaveBeenCalled();
    });

    it('should attempt to resolve document with no additional urls in ' +
        'external css to parse', function() {
      spyOn(Requestr, 'dispatchCustomEvent');
      spyOn(Requestr, 'resolveDocumentCssUrls');
      spyOn(Requestr, 'createUrlFromResource');

      Requestr.handleDocumentCssUris(
          {target: {response: {Resources: [{Url:
              'http://tradeshift.com'}]}}}, [], {}, [], function() {});

      expect(Requestr.dispatchCustomEvent).toHaveBeenCalledWith(
          Requestr.customEvents.EXTERNAL_CSS_LOAD_COMPLETE);
      expect(Requestr.resolveDocumentCssUrls).toHaveBeenCalled();
      expect(Requestr.createUrlFromResource).toHaveBeenCalled();
    });
  });

  describe('Requestr.resolveDocumentCssUrls', function() {
    it('should be defined', function() {
      expect(Requestr.resolveDocumentCssUrls).toBeDefined();
    });

    it('should make callback with no urls to resolve', function() {
      var success;

      Requestr.resolveDocumentCssUrls([], {}, [],
          function() {success = true;});

      expect(Requestr.resolveDocumentCssUrls).toBeDefined();
      expect(success).toBe(true);
    });

    it('should make callback with urls resolved', function() {
      var success;

      spyOn(Requestr, 'replaceDocumentUrlsWithBlob');

      Requestr.resolveDocumentCssUrls([{Data: 'hello'}], {}, [],
          function() {success = true;});

      expect(Requestr.resolveDocumentCssUrls).toBeDefined();
      expect(Requestr.replaceDocumentUrlsWithBlob).toHaveBeenCalled();
      expect(success).toBe(true);
    });
  });

  describe('Requestr.parseCssResourcesForUrls', function() {
    it('should be defined', function() {
      expect(Requestr.parseCssResourcesForUrls).toBeDefined();
    });

    it('should not return any parsed urls', function() {
      var test = Requestr.parseCssResourcesForUrls([]);

      expect(test).toBe(undefined);
    });

    it('should return parsed urls from css', function() {
      var test = Requestr.parseCssResourcesForUrls([{
        Url: 'http://tradeshift.com',
        Data: 'class {background: url(img.png)}'
      }]);

      expect(test[0]).toBe('http://tradeshift.com/img.png');
    });
  });

  describe('Requestr.matchResourceWithCache', function() {
    it('should be defined', function() {
      expect(Requestr.matchResourceWithCache).toBeDefined();
    });

    it('should not find match', function() {
      spyOn(Requestr, 'getMatchingObjectWithUrl').andReturn(null);

      var test = Requestr.matchResourceWithCache([],
          'http://tradeshift.com');

      expect(test).toBe(false);
      expect(Requestr.getMatchingObjectWithUrl).toHaveBeenCalled();
    });

    it('should find match', function() {
      spyOn(Requestr, 'getMatchingObjectWithUrl').andReturn(
          {dataType: '', data: '', mimeType: ''});

      var test = Requestr.matchResourceWithCache([],
          'http://tradeshift.com');

      expect(test).toBe(true);
      expect(Requestr.getMatchingObjectWithUrl).toHaveBeenCalled();
    });
  });

  describe('Requestr.createUrlFromResource', function() {
    it('should be defined', function() {
      expect(Requestr.createUrlFromResource).toBeDefined();
    });

    it('should create url from blob of DATA_URI', function() {
      spyOn(Requestr, 'dataStringToBlob');
      spyOn(Requestr, 'dataURItoBlob');
      spyOn(window.URL, 'createObjectURL').andReturn('blob://url');

      var test = Requestr.createUrlFromResource({
        Url: 'http://tradeshift.com',
        ContentType: 'something',
        Type: 'DATA_URI',
        Token: 'vjheouivjejve==',
        Data: 'somethingtoo'
      });

      expect(test).toBe('blob://url');
      expect(Requestr.dataURItoBlob).toHaveBeenCalled();
      expect(Requestr.dataStringToBlob).not.toHaveBeenCalled();
    });

    it('should create url from blob of STRING', function() {
      spyOn(Requestr, 'dataStringToBlob');
      spyOn(Requestr, 'dataURItoBlob');
      spyOn(window.URL, 'createObjectURL').andReturn('blob://url');

      var test = Requestr.createUrlFromResource({
        Url: 'http://tradeshift.com',
        ContentType: 'something',
        Type: 'STRING',
        Token: 'vjheouivjejve==',
        Data: 'somethingtoo'
      });

      expect(test).toBe('blob://url');
      expect(Requestr.dataStringToBlob).toHaveBeenCalled();
      expect(Requestr.dataURItoBlob).not.toHaveBeenCalled();
    });
  });

  describe('Requestr.replaceDocumentUrlsWithBlob', function() {
    it('should be defined', function() {
      expect(Requestr.replaceDocumentUrlsWithBlob).toBeDefined();
    });

    it('should replace url in image html', function() {
      var dimp = window.document.implementation.createHTMLDocument('');
      dimp.body.innerHTML = '<img src="http://tradeshift.com/img.png" />';

      spyOn(Requestr, 'createUrlFromResource').andReturn('blob://url');

      Requestr.replaceDocumentUrlsWithBlob(
          {Url: 'http://tradeshift.com/img.png'}, dimp, []);

      expect(Requestr.createUrlFromResource).toHaveBeenCalled();
      expect(dimp.body.innerHTML).toBe('<img src="blob://url" ' +
          Requestr.ORIGINAL_URL_ATTRIBUTE +
          '="http://tradeshift.com/img.png">');
    });

    it('should replace url in style element', function() {
      var dimp = window.document.implementation.createHTMLDocument(''),
          css = {innerText:
          'rule {background: url(http://tradeshift.com/img.png)}'};

      spyOn(Requestr, 'createUrlFromResource').andReturn('blob://url');

      Requestr.replaceDocumentUrlsWithBlob(
          {Url: 'http://tradeshift.com/img.png'}, dimp, [css]);

      expect(Requestr.createUrlFromResource).toHaveBeenCalled();
      expect(css.innerText).toBe('rule {background: url(blob://url)}');
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

      var test, uri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA' +
          'UAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNB' +
          'AAO9TXL0Y4OHwAAAABJRU5ErkJggg';
      test = Requestr.dataURItoBlob(uri);

      expect(window.Blob).toHaveBeenCalled();
      expect(window.Uint8Array).toHaveBeenCalled();
    });
  });

  describe('Requestr.dataStringToBlob', function() {
    it('should be defined', function() {
      expect(Requestr.dataStringToBlob).toBeDefined();
    });

    it('should make call to convert uri to blob', function() {
      spyOn(Requestr, 'dataURItoBlob');

      var test = Requestr.dataStringToBlob('data', 'mime');

      expect(Requestr.dataURItoBlob).toHaveBeenCalledWith(
      'data:mime;base64,ZGF0YQ==', 'mime');
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
      expect(document.documentElement.getAttribute(
          'data-test')).toBe('works');
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

      expect(test.callback).toHaveBeenCalledWith(
          {url: undefined, html: doc.documentElement.outerHTML});
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

  describe('Requestr.thirdParty.preg_quote', function() {
    it('should be defined', function() {
      expect(Requestr.thirdParty.preg_quote).toBeDefined();
    });

    it('should normalize string for regex', function() {
      var test = Requestr.thirdParty.preg_quote('http://tradeshift.com');

      expect(test).toBe('http\\://tradeshift\\.com');
    });
  });

  describe('Requestr.init', function() {
    it('should be defined', function() {
      expect(Requestr.init).toBeDefined();
    });

    it('should init with serialization', function() {
      spyOn(Requestr, 'parseSerialization');

      var ser = {};

      Requestr.init(ser);

      expect(Requestr.parseSerialization).toHaveBeenCalledWith(ser);
    });

    it('should wait for document loaded before parsing serialization',
        function() {
      spyOn(Requestr, 'parseSerialization');
      spyOn(window, 'addEventListener');

      Requestr.init();

      expect(window.addEventListener).toHaveBeenCalledWith(
          'DOMContentLoaded', jasmine.any(Function));
      expect(Requestr.parseSerialization).not.toHaveBeenCalled();
    });
  });

});
