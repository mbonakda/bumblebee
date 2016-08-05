define([
  'js/components/api_targets',
  'js/components/api_request',
  'js/widgets/base/base_widget',
  'hbs!./templates/hopper_template',
  'bootstrap'
], function(
  ApiTargets,
  ApiRequest,
  BaseWidget,
  HopperTemplate
) {

  var HopperView = Marionette.ItemView.extend({

    initialize: function() {
      this.listenTo(this.collection, "reset", this.render);
    },

    template: HopperTemplate,

    events: {
      "click .button-toggle": "toggleList",
    },

    toggleList: function() {

      this.$(".additional-papers").toggleClass("hidden");
      if (this.$(".additional-papers").hasClass("hidden")) {
        this.$(".button-toggle").text("more");
      } else {
        this.$(".button-toggle").text("less");
      }
    },

    onRender: function() {
      this.$(".icon-help").popover({
        trigger: "hover"
      });
    },
    className: "hopper-widget" // s-recommender-widget"
  });

  var Hopper = BaseWidget.extend({

    initialize: function() {
      this.collection = new Backbone.Collection();
      this.view = new HopperView({
        collection: this.collection
      });
      BaseWidget.prototype.initialize.apply(this, arguments);
    },

    /*
        defaultQueryArguments
        copied from js/widgets/results/widget.js
    */
    defaultQueryArguments: {
      fl: 'title,abstract,bibcode,author,keyword,id,links_data,property,citation_count,[citations],pub,aff,email,volume,pubdate,doi',
      rows: 100,
      start: 0
    },

    activate: function(beehive) {
      this.setBeeHive(beehive);
      var pubsub = beehive.getService('PubSub');

      _.bindAll(this, ['clearCache', 'dispatchRequest', 'processResponse'])

      //reset _bibcodeCache every time there is a fresh query
      pubsub.subscribe(pubsub.START_SEARCH, this.clearCache);
      pubsub.subscribe(pubsub.INVITING_REQUEST, this.dispatchRequest);
      pubsub.subscribe(pubsub.DELIVERING_RESPONSE, this.processResponse);
    },

    _bibcodeCache: [],

    numRecords: 1000,

    clearCache: function() {
      this._bibcodeCache = [];
    },

    processResponse: function(response) {

      //add bibcodes as an array to _bibcodeCache
      [].push.apply(this._bibcodeCache, response.get('response.docs').map(function(d) {
        return d.bibcode;
      }));

      //if there are fewer bibcodes in bibcodeCache than the total # of results or the total 'numRecords',
      //(whichever is less)
      //make another round of requests, with the 'start' parameter increased to the next item
      if (this._bibcodeCache.length < _.min([this.numRecords, response.get('response.numFound')])) {

        var nextQuery = response.getApiQuery().clone();
        nextQuery.set('start', this._bibcodeCache.length);
        this.dispatchRequest(nextQuery);

      } else {
        /*
          all the bibcodes are selected, now send them to the api endpoint
         */

        function done(data) {
          this.collection.reset(data.keywords);
        }

        function fail() {
          console.error('query failed')
        }

        var request = new ApiRequest({
          target: 'http://localhost:5000/hopper',
          options: {
            type: 'GET',
            data: JSON.stringify(this._bibcodeCache),
            contentType: "application/json",
            done: done,
            fail: fail
          }
        });

        this.getBeeHive().getService("Api").request(request);

      }

    },

  });

  return Hopper;
});
