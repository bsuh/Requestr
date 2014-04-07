/* global require */
var fs = require('fs');
var webdriver = require('browserstack-webdriver');
var account = require('./account.js');

// The URL of the page to test.
var url = 'http://localhost:8088/tests/iframe_blank_requestr.html';


// Defaults used by all browsers.
var capabilities = {
  'acceptSslCerts': true,
  'browserstack.debug': true,
  'browserstack.local': true,
  'browserstack.user': account.user,
  'browserstack.key': account.key
};


// Browsers to use when taking screenshots.
var browsers = [
  // Firefox Mac.
  {
    'browser': 'Firefox',
    'browser_version': '27.0',
    'os': 'OS X',
    'os_version': 'Mavericks',
    'resolution' : '1600x1200'
  },
  // Firefox Windows.
  {
    'browser': 'Firefox',
    'browser_version': '27.0',
    'os': 'Windows',
    'os_version': '8.1',
    'resolution' : '1600x1200'
  },
  // Chrome Mac.
  {
    'browser': 'Chrome',
    'browser_version': '33.0',
    'os': 'OS X',
    'os_version': 'Mavericks',
    'resolution' : '1600x1200'
  },
  // Chrome Windows.
  {
    'browser': 'Chrome',
    'browser_version': '33.0',
    'os': 'Windows',
    'os_version': '8.1',
    'resolution' : '1600x1200'
  },
  // Windows IE 11.
  {
    'browser': 'IE',
    'browser_version': '11.0',
    'os': 'Windows',
    'os_version': '8.1',
    'resolution' : '1600x1200'
  },
  // Windows IE 10.
  {
    'browser': 'IE',
    'browser_version': '10.0',
    'os': 'Windows',
    'os_version': '8',
    'resolution' : '1280x1024'
  },
  // TODO (jam@): Ask Browserstack about Safari not working.
  // Safari Mac.
  {
    'browser': 'Safari',
    'browser_version': '7.0',
    'os': 'OS X',
    'os_version': 'Mavericks',
    'resolution' : '1600x1200'
  }
];


/**
 * Recursively merge properties of two objects.
 * @param {Object} obj1 Original object (to).
 * @param {Object} obj2 Source object (from).
 * @return {Object} The merged object.
 */
function mergeObjects(obj1, obj2) {
  for (var attrname in obj2) {
    if (obj2.hasOwnProperty(attrname)) {
      obj1[attrname] = obj2[attrname];
    }
  }
  return obj1;
}


// Adding default capabilities to each browser.
for (var i = 0, currBrowser; (currBrowser = browsers[i]); i++) {
  currBrowser = mergeObjects(currBrowser, capabilities);
}

var browserTestIndex = 0;

// Recursion for testing each browser, right now only screenshots.
function testNextBrowser() {
  var browserToTest = browsers[browserTestIndex];

  if (!browserToTest) {
    return;
  }

  // Browserstack webdriver.
  var driver = new webdriver.Builder().
      usingServer('http://hub.browserstack.com/wd/hub').
      withCapabilities(browserToTest).
      build();

  // Setting up the window size manually, seems to be a Browserstack bug.
  driver.manage().window().setSize(1600, 1200);

  // Screenshot handler.
  webdriver.WebDriver.prototype.saveScreenshot = function(filename) {
    return driver.takeScreenshot().then(function(data) {
      fs.writeFile(filename, data.replace(/^data:image\/png;base64,/, ''),
          'base64', function(err) {
            if (err) {
              throw err;
            }
          });
    });
  };

  driver.get(url);

  driver.wait(function() {
    var el, success;
    if ((el = driver.findElement(webdriver.By.id('app'))) && el.getAttribute && el.getAttribute('src') !== null) {
      success = true;
    }
    return success;
  }, 60000);

  driver.saveScreenshot('_screenshots/' +
      browserToTest.browser + '_' +
      browserToTest.browser_version + '_' +
      browserToTest.os + '_' +
      browserToTest.os_version + '.png'
  );
  driver.quit();
  //
  if (browsers[browserTestIndex++]) {
    testNextBrowser();
  }
}

// Starting recursion.
testNextBrowser();
