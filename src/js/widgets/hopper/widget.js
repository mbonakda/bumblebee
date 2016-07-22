define([
  'marionette',
  'js/components/api_query',
  'js/components/api_targets',
  'js/components/api_request',
  'js/widgets/base/base_widget',
  'hbs!./templates/hopper_template',
  'bootstrap',
  'analytics'
], function(
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
//      this.model = new Model();
//      this.view = new View({model : this.model});
//      BaseWidget.prototype.initialize.apply(this, arguments);
    },

    smallLoadingIcon : true,

    template : HopperTemplate,

    events : {
      "click .button-toggle" : "toggleList",
      "click a" : "emitAnalyticsEvent"
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
    className : "hopper-widget s-recommender-widget"
  });


  var Hopper = BaseWidget.extend({

    initialize : function(){
      this.collection = new Backbone.Collection();
      this.view = new HopperView({collection : this.collection});
    },

    activate: function (beehive) {
      this.setBeeHive(beehive);
      var pubsub = this.getPubSub();
      _.bindAll(this, ['processResponse', 'dispatchRequest']);
      pubsub.subscribe(pubsub.INVITING_REQUEST, this.dispatchRequest);
      pubsub.subscribe(pubsub.DELIVERING_RESPONSE, this.processResponse);
    },

/*    //called in response to "inviting_request"
    dispatchRequest: function(apiQuery) {
      this.setCurrentQuery(apiQuery);
      this.store.dispatch(this.actions.reset_state());
      if (this.store.getState().config.openByDefault) {
        //this will also call _dispatchRequest since there is no data
        this.store.dispatch(this.actions.toggle_facet(undefined, true));
      }
    },*/

    //called in response to "inviting_request"
    dispatchRequest: function(apiQuery) {
      var bibcode = apiQuery.get('q');
      if (bibcode.length > 0 && bibcode[0].indexOf('bibcode:') > -1) {
        bibcode = bibcode[0].replace('bibcode:', '');
        this.loadBibcodeData(bibcode);
      }
    },

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

    processResponse : function(data){
      this.collection.set('msg', 'Hi, I am the Hopper widget.');
      data = data.toJSON();
      this.collection.reset(data.recommendations);
      this.trigger('page-manager-event', 'widget-ready', {'isActive': true});
      if (data.recommendations){
        this.collection.reset(data.recommendations);
        //right now this is being ignored by the toc widget
        this.trigger('page-manager-event', 'widget-ready', {'isActive': true});
      }
    }

  });

  return Hopper;
});
