#Requestr

Requestr wants to fix the latency issue created by the waterfall approach of loading assets by browsers. In order to do this, Requestr will look at executing JavaScript at runtime and use a server-side API to combine all the network requests into a single request. Combining the multiple network requests into a single requests will drastically speed up the time it takes to load all the assets by eliminating the latency added as the requests are made in the grouped waterfall currently implemented by the browsers.

The benefit of combining the network requests is that the browser is only attempting to fetch a single request, which cuts down the latency of the waterfall, while also moving the network request to a single thread, which speeds up the available computing power available to the window while loading these network requests. Additionally, Requestr optimizes the document paint/render cycle, which futher reduces the processing power used to render a document.

####Page loaded without Requestr
![Page loaded without Requestr](http://drive.google.com/uc?export=view&id=0B5D-rzbtF3GHVHlKSzA4ZVdLcjQ "Page loaded without Requestr")

####Page loaded with Requestr
![Page loaded without Requestr](http://drive.google.com/uc?export=view&id=0B5D-rzbtF3GHa3JScUJlSVBmSG8 "Page loaded without Requestr")


##Under the Hood

In order to achieve this ambitious goal, Requestr uses a mix of Frontend and Backend APIs. On the Frontend, Requestr provides a single JavaScript library to be loaded by the window attempting to use it. This library will then use native browser provided APIs to parse the document for network request URLs, and aggregate all those requests to be fetched from the Backend API in a single network request. The Backend API will then get the aggregated network requests URLs and form a JSON structure that returns all the network requests as, for the moment, data URIs or strings. Alternatively, the JSON returned by the backend API could be manually created, removing the need for a Backend API.

Once the Backend API returns the JSON data, the Frontend library converts the data URI and string data into in-memory requests that the browser can redirect the original network request to, essentially removing the need to make an actual network request, and instead loading the request from the browser's memory.

The following is the original [design document](https://docs.google.com/a/tradeshift.com/document/d/12K7GVr9Fdy2AsvCpLe35fkkgTpjB_SYVlbIbtem3STs) for Requestr, feel free to comment and contribute.


##Using Requestr

In order to get started, you will need to know that currently there is a **dependency on the Request API** [repository](https://github.com/Tradeshift/RequestrAPI) and the service it provides. So you will need to checkout that repository before getting started. Once checked out, you will need to get the service running. Getting the service running is as simple as running `npm install` and then `grunt`. This will start the Requestr API at `http://localhost:3000/asset`, please make a note of that for later reference.

Now the fun part, the following are examples on how to get documents to load with Requestr, please keep in mind that you will need to serve the page over HTTP/HTTPs when testing as the library relies on XHRs that would not work when served over the file protocol. The `service` property is always required in the serialization, as of now, because of the dependency on the Requestr API. The `service` property is the location of the Requestr API.

####Preloader
The following example loads the page defined in the `owner` property of the serialization element into the document. This is how a preloader would work, as the original document is displayed until the `owner` document is loaded and then replaces it. The `maxFileSize` property specifies the maximum file size of each resource to load via the Requestr API in bytes. The `expires` property specifies how long the cache is valid.
 ```html
<script type="text/requestr-serialization">
  {
    "owner": "data/index.html",
    "service": "http://localhost:3000/asset",
    "maxFileSize": 200000,
    "expires": "Mon, 10 Mar 2014 20:00:00 GMT"
  }
</script>
<script type="text/javascript">
// Include the minified Requestr library inline, this is to avoid making another network request!
</script>
 ```

####iFrame
In this example, Requestr fetches a page then returns a parsed blob URL which is used to then load in an iFrame. In short, Requestr is given a page, which it then fetches and resolves all network requests. Upon parsing and combining all network requests, it returns a blob URL with all URLs resolved and placed in the browser's memory, which ultimately optimizes the document paint/render cycle, asides cutting down the network latency.
```html
<script type="text/javascript">
  // Loads the document after Requestr is ready.
  window.addEventListener('requestrReady', function() {
    // Setting the source of the iFrame after parsed by Requestr.
    function handlePageBlobUrl (result) {
      var appFrame = document.getElementById('app');
      // Loading page fetched by Requestr into iFrame.
      appFrame.src = result.url;
    }
    // Loading the document, can do cross-domain as well.
    Requestr.loadPage('/tests/data/index.html', handlePageBlobUrl);
  }, false);
</script>
<script type="text/javascript">
// Include the minified Requestr library inline, this is to avoid making another network request!
</script>
<script type="text/requestr-serialization">
  {
    "service": "http://localhost:3000/asset",
    "maxFileSize": 200000
  }
</script>
```
Additional examples can be found in the `tests` directory, and more are to come, please be patient!

####Serialization
These are the currently implemented serialization properties by Requestr.

| Property | Description | Required |
| -------- | ----------- | -------- |
| self | Interpreted by Requestr to mean that the current document should be parsed | No* |
| owner | Used by Requestr to replace the currently loaded document while optimizing the requests before loading. This is considered more optimal since its cleaner and human readable | No* |
| service | The URL for the Backend API used by Requestr | Yes |
| maxFileSize | The maximum file size of network requests to be converted into data URIs, larger requests will remain traditional un-parsed network requests | No |
| allow | Filter of allowed domains or URIs to be fetched by Requestr. Used in a matching index pattern | No |
| exclude | Filter of domains or URIs to exclude when gather list of requests to fetch via Requestr. Used in a matching index pattern | No |
| expires | Global time used a la “expired header” for all nested requests within the document | No |
| development | Flag used to include debugging data when developing | No |
*You will need one of `self` or `owner` when loading a document, unless you want to load fragments, for which neither is needed.

##Development Environment

If you would like to contribute or setup Requestr for local development, you will need to do the following:

1. Install `Node.js`, follow instructions on http://nodejs.org
2. Install `Grunt`, follow instructions on http://gruntjs.com/getting-started
3. Install the `Closure Linter`, follow instructions on https://developers.google.com/closure/utilities/docs/linter_howto

Once `Grunt` and the `Closure Linter` are installed:

3. Go into the main directory and run `npm install`
4. Once everything is installed, run `grunt githooks` and then run `grunt`

That's it, you will have the entire project built and ready for local development.

Requestr uses a `pre-commit` hook that runs the `default` task. This means that in order to commit your changes must pass both jasmine tests and jshint.

For the **Requestr API**, please refer to the documentation in its respective repository:
[https://github.com/Tradeshift/RequestrAPI](https://github.com/Tradeshift/RequestrAPI)


##Supported Browsers

Since Requestr is making use of a lot of modern browser APIs, particularly those of the HTML5 specification, there will be some limits as to which browsers Requestr will support at runtime.

It is the intent of Requestr to support the following browsers:

- `Chrome 31+`
- `Firefox 25+`
- `Safari 7+`
- `Internet Explorer 10+`

More browsers will be added as tests are conducted and such browsers adopt and integrate the HTML5 specification. Alternatively, Requestr will look at using server-side helpers to make it possible to support legacy browsers in the future. Currently, Requestr has been tested on `Chrome`, `Firefox`, `Internet Explorer 10`, and `Safari`, and proven to perform as designed.


##Caveats

Requestr is still in "alpha" mode, so there will with no doubt be many issues we will need to address before getting a much stable version. These are some of the currently known issues with Requestr:

- `Internet Explorer 10` does not support document blob URLs, so using the `loadPage` method to load a document will need to be handle differently when setting `src` to an `iFrame`. Instead of setting `src` to the `iFrame`, target the `iFrame` and replace the `innerHTML` of the `documentElement` with the `html` provided in the `loadPage` callback.
- `Safari` does not support `IndexedDb` so a `WebSQL` polyfill was added, although there is a size limit of 5MB which will need to be improved for caching support.

If you encounter any issues, please report them here on Github, we will gladly take any feedback in an effort to improve Requestr. And as always, feel free to fork and send us a pull-request with any features, fixes, and/or improvements!


##License

Tradeshift provides its Requestr front-end application programming interface ("API") under a licensing model designed to meet the development and distribution needs of both commercial entities and open source projects. Entities who do not wish to distribute the source code for the Requestr front-end API under version 3 of the GNU General Public License (the "GPL") may enter into a commercial license agreement with Tradeshift. Please contact [jam@tradeshift.com](mailto:jam@tradeshift.com) for details. For developers of Free Open Source Software ("FOSS") applications under the GPL that want to combine and distribute those FOSS applications with the Requestr front-end API, Tradeshift’s open source software licensed under the GPL may be the best option.


##Credits

Requestr was developed at [Tradeshift](http://tradeshift.com) by José Antonio Márquez Russo ([@joseeight](https://twitter.com/joseeight)) with the help of Joakim Recht ([@joakimrecht](https://twitter.com/joakimrecht)), Joseph McCarthy ([@jmccarthy14](https://twitter.com/jmccarthy14)), and many other awesome [Tradeshifters](https://github.com/Tradeshift?tab=members).
