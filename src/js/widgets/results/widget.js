/**
 * Widget to display list of result hits - it allows to paginate through them
 * and display details
 *
 */

define([
    'underscore',
    'js/widgets/list_of_things/widget',
    'js/widgets/base/base_widget'
    ],

  function (_, ListOfThingsWidget, BaseWidget) {

    var ResultsWidget = ListOfThingsWidget.extend({

      activate: function (beehive) {

        _.bindAll(this, "dispatchInitialRequest", "processResponse");

        this.pubsub = beehive.Services.get('PubSub');

        //custom dispatchRequest function goes here
        this.pubsub.subscribe(this.pubsub.INVITING_REQUEST, this.dispatchInitialRequest);

        //custom handleResponse function goes here
        this.pubsub.subscribe(this.pubsub.DELIVERING_RESPONSE, this.processResponse);
      },


      dispatchInitialRequest  : function(){

        this.resetWidget();

        BaseWidget.prototype.dispatchRequest.apply(this, arguments)
      },

      //set "showDetails" to true
      showDetailsButton : true,

      //so that we show the toggle buttons
      mainResults  : true,


      defaultQueryArguments: function(){
        return {
          hl     : "true",
          "hl.fl": "title,abstract,body",
          fl     : 'title,abstract,bibcode,author,keyword,id,citation_count,pub,aff,email,volume,year',
          rows : 25
        }
      },

      processResponse: function (apiResponse) {

        this.setCurrentQuery(apiResponse.getApiQuery());

        var toSet = {"numFound":  apiResponse.get("response.numFound"),
          "currentQuery":this.getCurrentQuery()};

        var r =  this.getCurrentQuery().get("rows");
        var s = this.getCurrentQuery().get("start");
        if (r){

          r = $.isArray(r) ? r[0] : r;
          toSet.perPage = r;

        }

        if (s) {

          var perPage =  toSet.perPage || this.paginationModel.get("perPage");

          s = $.isArray(s) ? s[0] : s;

          //getPageVal comes from the pagination widget
          toSet.page= this.getPageVal(s, perPage);

        }

        var highlights = apiResponse.get("highlighting");

        var docs = apiResponse.get("response.docs")

        //any preprocessing before adding the resultsIndex is done here
        var docs = _.map(docs, function(d){
          d.identifier = d.bibcode;
          var h = {};

          if (_.keys(highlights).length) {

            h = (function () {

              var hl = highlights[d.id];
              var finalList = [];
              //adding abstract,title, etc highlights to one big list
              _.each(_.pairs(hl), function (pair) {
                finalList = finalList.concat(pair[1]);
              });
              finalList = finalList;

              return {
                "highlights": finalList
              }
            }());
          }

          if (h.highlights && h.highlights.length > 0)
            d['details'] = {highlights: h};

          return d;

        });

        docs = this.parseLinksData(docs);

        docs = this.addPaginationToDocs(docs, apiResponse);


        if (!this.paginationModel.get("numFound")) {

          //reset the pagination model with toSet values
          //has to happen right before collection changes
          this.paginationModel.set(toSet);

          this.collection.reset(docs, {
            parse: true
          });
        }
        else {
          //reset the pagination model with toSet values
          //has to happen right before collection changes
          this.paginationModel.set(toSet);

          //backbone ignores duplicate records because it has an idAttribute of "resultsIndex"
          this.collection.add(docs, {
            parse: true
          });

        }

        //let main collection know to reset visible collection

        this.collection.trigger("collection:augmented");

        //resolving the promises generated by "loadBibcodeData"
        if (this.deferredObject){
          this.deferredObject.resolve(this.paginationModel.get("numFound"))
        }
      }


    });

    return ResultsWidget;

  });
