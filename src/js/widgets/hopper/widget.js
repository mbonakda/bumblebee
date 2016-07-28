define([
  'js/widgets/list_of_things/widget',
  'marionette',
  'js/components/api_query',
  'js/components/api_targets',
  'js/components/api_request',
  'js/widgets/base/base_widget',
  'hbs!./templates/hopper_template',
  'bootstrap',
  'analytics'
], function(
  ListOfThingsWidget,
  Marionette,
  ApiQuery,
  ApiTargets,
  ApiRequest,
  BaseWidget,
  HopperTemplate,
  analytics
  ){
    
  var Model = Backbone.Model.extend({
    defaults : {
      msg: undefined
    }
  });

  var HopperView = Marionette.ItemView.extend({

    initialize : function(){
      this.listenTo(this.collection, "reset", this.render);
    },

    smallLoadingIcon : true,

    template : HopperTemplate,

    events : {
      "click .button-toggle" : "toggleList",
      "click a" : "emitAnalyticsEvent",
      "click a.page-control": "changePageWithButton",
      "keyup input.page-control": "tabOrEnterChangePageWithInput",
      "click .per-page": "changePerPage"
    },

    emitAnalyticsEvent : function(e){
      analytics('send', 'event', 'interaction', 'suggested-article-link-followed');
    },

    toggleList : function(){

      this.$(".additional-papers").toggleClass("hidden");
      if ( this.$(".additional-papers").hasClass("hidden")){
        this.$(".button-toggle").text("more");
      }
      else {
        this.$(".button-toggle").text("less");
      }
    },

    onRender : function(){
      this.$(".icon-help").popover({trigger: "hover"});
    },
    className : "hopper-widget" // s-recommender-widget"
  });


  var Hopper = ListOfThingsWidget.extend({

    initialize : function(){
      this.collection = new Backbone.Collection();
      this.view = new HopperView({collection : this.collection});
      this.model = new Model();
      BaseWidget.prototype.initialize.apply(this, arguments);
    },

    /* 
        defaultQueryArguments 
        copied from js/widgets/results/widget.js
    */

    defaultQueryArguments: {
    hl     : "true",
    "hl.fl": "title,abstract,body,ack",
    'hl.maxAnalyzedChars': '150000',
    'hl.requireFieldMatch': 'true',
    'hl.usePhraseHighlighter': 'true',
    fl     : 'title,abstract,bibcode,author,keyword,id,links_data,property,citation_count,[citations],pub,aff,email,volume,pubdate,doi',
    rows : 25,
    start : 0
    },

    activate: function (beehive) {
      this.setBeeHive(beehive);
      var pubsub = this.getPubSub();
      _.bindAll(this, ['processResponse', 'onRequest', 'updatePage']);
      pubsub.subscribe(pubsub.INVITING_REQUEST, this.onRequest);
      pubsub.subscribe(pubsub.DELIVERING_RESPONSE, this.processResponse);
      pubsub.subscribe(pubsub.USER_ANNOUNCEMENT, this.updatePage);
    },

    updatePage: function(event, data) {
      if (event == "changePageWithButton") { // || event == "tabOrEnterChangePageWithInput" || event == "changePerPage") {
        this.processResponse;
      }
    },
    
    //called in response to "inviting_request" (taken from js/widgets/facet/widget.js)
/*    dispatchRequest: function(apiQuery) {
      this.setCurrentQuery(apiQuery);
      this.store.dispatch(this.actions.reset_state());
      if (this.store.getState().config.openByDefault) {
        //this will also call _dispatchRequest since there is no data
        this.store.dispatch(this.actions.toggle_facet(undefined, true));
      }
    },
*/
/*    //called in response to "inviting_request"
    dispatchRequest: function(apiQuery) {
      var bibcode = apiQuery.get('q');
      if (bibcode.length > 0 && bibcode[0].indexOf('bibcode:') > -1) {
        bibcode = bibcode[0].replace('bibcode:', '');
        this.loadBibcodeData(bibcode);
      }
    },*/

    onRequest: function(apiQuery) {
      if (!(apiQuery instanceof ApiQuery) || !apiQuery.has('q'))
        throw new Error('You are kidding me!');
        var q = apiQuery.clone(); // we are bit parranoid, the queries arrive locked against changes
      q.unlock(); // so you have to create a copy and unlock it for modifications
      q.set('foo', this.model.get('name') || 'world');

      this.dispatchRequest(q); // calling out parent's method
    },
/*
    loadBibcodeData : function(bibcode){

      if (bibcode === this._bibcode){
        this.trigger('page-manager-event', 'widget-ready', {'isActive': true});
      }
      else {
        //clear the current collection
        this.collection.reset();
        this._bibcode = bibcode;
        var target = ApiTargets.RECOMMENDER + "/" + bibcode;
        var request =  new ApiRequest({
          target:target
        });
        this.getPubSub().publish(this.getPubSub().EXECUTE_REQUEST, request);
      }
    },
*/
    processResponse : function(data){
      
      data = data.toJSON();
      var d = data.response.docs;
      var bibs = new Array();
      for (var i = 0; i < d.length; i++) {
        var bib = {bibcode: ''};
        bib.bibcode = d[i].bibcode;
        bibs.push(bib);
      };
      var car = [{author: bibs, bibcode:"white", title:"white"}];
      this.collection.reset(bibs);

      this.trigger('page-manager-event', 'widget-ready', {'isActive': true});

/*      data = data.toJSON();
      if (data.recommendations){
        this.collection.reset(data.recommendations);
        //right now this is being ignored by the toc widget
        this.trigger('page-manager-event', 'widget-ready', {'isActive': true});
      }*/
    },

      /*
      * takes an apiQuery, gets bibcodes, then requests them from
      * the export endpoint
      */
/*
    initiateQueryBasedRequest : function(apiQuery){
    var self = this;

    // collect bibcodes of the query
    this._executeApiRequest(apiQuery)
      .done(function(apiResponse) {
        // export documents by their ids
        var ids = _.map(apiResponse.get('response.docs'), function(d) {return d.bibcode});
        //tell model how many bibcodes we're planning on showing
        self.model.set("current", ids.length);
        //this will get the exports and register a callback to put them in the model
        self._getExports(self.model.get('format') || 'bibtex', ids)
          });
    },
*/
  });

  return Hopper;
});
