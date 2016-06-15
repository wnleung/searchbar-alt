/* Load demo image into canvas */
Caman(".canvas-working>img", function () {
  this.render();
});
Caman(".canvas-original>img", function () {
  this.render();
});


/* Features */

var features = [{
	'name': 'Curves',
	'desc': 'Lighten the blacks and decrease shadows in your photo',
	'keywords': ['fade', 'curve'],
}, {
	'name': 'Brightness',
	'desc': 'Expand the highlights in your photo',
	'keywords': ['fade'],
}, {
	'name': 'Contrast',
	'desc': 'Increase contrast to make your photo less flat',
	'keywords': ['fade'],
}];

var Feature = Backbone.Model.extend({
	initialize: function () {
		// console.log('model working');
	}
});

// create a feature view
var FeatureView = Backbone.View.extend({
	// model: ...
	tagName: 'li',
	template: _.template($('#feature-view').html()),
	// hover over a feature and show preview
	events: {
		'mouseenter': 'previewFeature',
		'mouseleave': 'resetCanvas',
		'click': 'openControls'
	},
	previewFeature: function (){
		$('.canvas-original').show();
		var featureName = this.model.get('name').toLowerCase();

		switch (featureName){
			case 'curves':
				Caman(".canvas-working>canvas", function () {
					this.curves('rgb', [0, 0], [100, 120], [180, 240], [255, 255]).render();
				});
				break;
			case 'brightness':
				Caman(".canvas-working>canvas", function () {
					this.brightness(20).render();
				});
				break;
			case 'contrast':
				Caman(".canvas-working>canvas", function () {
					this.contrast(-20).render();
				});
				break;
			default:
				break;
		}
	},
	resetCanvas: function (){
		Caman(".canvas-working>canvas", function () {
			this.reset();
		});
		$('.canvas-original').hide();
	},
	openControls: function (){
		filteredWorkflows.reset();
		filteredFeatures.reset();
		this.resetCanvas();
		
		$controls.find('.control').hide();
		$controls.show();
		
		var featureName = this.model.get('name').toLowerCase();

		switch (featureName){
			case 'brightness':
			console.log($controls.find('.control-brightness').length);
				$controls.find('.control-brightness').show();
				break;
			case 'contrast':
				$controls.find('.control-contrast').show();
				break;
			default:
				break;
		}
	},
	render: function () {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

// create a total collection
var FeatureCollection = Backbone.Collection.extend({
	model: Feature
});
var featureDb = new FeatureCollection();
featureDb.add(features);

// create a filtered collection
var filteredFeatures = new FeatureCollection();
var currentFeatures = new FeatureCollection();





/* Workflows */

var workflows = [{
	// 'wid': 1,
	'name': 'Vintage Effect',
	'desc': 'Add vintage effect to your photo',
	'keywords': ['fade'],
	'instruction': 'Curves + Levels + Color Adjustment',
	'step-number': 3,
	'features': [0,1,2]
}];

var Workflow = Backbone.Model.extend({
	initialize: function(){
		// console.log(workflow model working);
	}
});

var WorkFlowCollection = Backbone.Collection.extend({
	model: Workflow
});

var workflowDb = new WorkFlowCollection();
workflowDb.add(workflows);

var filteredWorkflows = new WorkFlowCollection();

var WorkflowView = Backbone.View.extend({
	template: _.template($('#workflow-view').html()),
	tagName: 'li',
	events: {
		'click .grab-tools': 'grabTools'
	},
	grabTools: function (){
		var tools = this.model.get('features');
		currentFeatures.reset();
		$.each(tools, function(i){
			currentFeatures.add(features[i]);
		});
		filteredWorkflows.reset();
		filteredFeatures.reset();
	},
	render: function(){
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

var WorkflowSearchResultsView = Backbone.View.extend({
	template: _.template($('#workflow-search-results-view').html()),
	initialize: function(){
		this.listenTo(this.collection, 'reset', this.render);
	},
	render: function(){
		this.$el.html(this.template());

		var $ul = this.$('ul');
		this.collection.each(function(model){
			var workflowView = new WorkflowView({'model': model});
			$ul.append(workflowView.render().el);
		});
		return this;
	}
});

// create a search results view and bind the filtered collection to it
var FeatureSearchResultsView = Backbone.View.extend({
	template: _.template($('#feature-search-results-view').html()),
	// in that view, listen to the changes in the filtered collection
	initialize: function() {
		this.listenTo(this.collection, 'reset', this.render);
	},
	render: function() {
		this.$el.html(this.template());

		var $ul = this.$('ul');
		this.collection.each(function(model) {
			var featureView = new FeatureView({'model': model});
			$ul.append(featureView.render().el);
		});
		return this;
	}
});

// create a search bar view
var SearchBarView = Backbone.View.extend({
	template: _.template($('#search-bar-view').html()),
	events: {
		// in that view, add event for input on keyup, add callback func
		'keyup input': 'update',
		'click button': 'clear',
	},
	render: function () {
		this.$el.html(this.template());
		return this;
	},
	clear: function (){
		filteredWorkflows.reset();
		filteredFeatures.reset();
		this.$('input').val('');
		this.$('button').hide();
	},
	update: function (){
		$clear = this.$('button');
		if ((this.$('input').val()) !== ''){
			$clear.show();
		} else{
			$clear.hide();
		}
		$controls.hide();
		currentFeatures.reset();
		this.updateFilteredWorkFlows();
		this.updateFilteredFeatures();
	},
	updateFilteredFeatures: function (e) {
		// in callback func, update filtered collection
		var searchPhrases = this.$('input').val().toLowerCase().split(' '),
			filteredAll = [];

		$.each(searchPhrases, function(index, searchPhrase) {
			if (stopWords.indexOf(searchPhrase) === -1){
				filtered = featureDb.filter(function(model){
					var keywords = model.get('keywords'),
						name = model.get('name').toLowerCase(),
						found = false;

					if (searchPhrase !== '' && name.indexOf(searchPhrase) !== -1){
						return true;
					}

					if (searchPhrase !== ''){
						$.each(keywords, function(index, elem){
						 if (elem.toLowerCase().indexOf(searchPhrase) !== -1){
								found = true;
								return false;
							 } else{
								return true;
							 }
						});
					}

					return found;
				});
				filteredAll = filteredAll.concat(filtered);
			}
		});
			
		filteredFeatures.reset(filteredAll);
	},
	updateFilteredWorkFlows: function (e) {
		// in callback func, update filtered collection
		var searchPhrases = this.$('input').val().toLowerCase().split(' '),
			filteredAll = [];

		$.each(searchPhrases, function(index, searchPhrase) {
			if (stopWords.indexOf(searchPhrase) === -1){
				filtered = workflowDb.filter(function(model){
					var keywords = model.get('keywords'),
						name = model.get('name').toLowerCase(),
						found = false;

					if (searchPhrase !== '' && name.indexOf(searchPhrase) !== -1){
						return true;
					}

					if (searchPhrase !== ''){
						$.each(keywords, function(index, elem){
						 if (elem.toLowerCase().indexOf(searchPhrase) !== -1){
								found = true;
								return false;
							 } else{
								return true;
							 }
						});
					}

					return found;
				});
				filteredAll = filteredAll.concat(filtered);
			}
		});

		filteredWorkflows.reset(filteredAll);
	}
});


// create a grab tools view
// listen to reset of the current tools collection
var GrabToolsView = Backbone.View.extend({
	template: _.template($('#grab-tools-view').html()),
	initialize: function(){
		this.listenTo(this.collection, 'reset', this.clearTools);
		this.listenTo(this.collection, 'add', this.addTool);
	},
	events:{
		'click li': 'openControls'
	},
	clearTools: function(){
		this.$('ul').empty();
	},
	addTool: function(feature){
		this.$('ul').append('<li>' + feature.get('name') + '</li>');
	},
	openControls: function (e){
		var featureName = $(e.target).html().toLowerCase();

		$controls.find('.control').hide();
		$controls.show();

		switch (featureName){
			case 'brightness':
				$controls.find('.control-brightness').show();
				break;
			case 'contrast':
				$controls.find('.control-contrast').show();
				break;
			default:
				break;
		}
	},
	render: function(){
		this.$el.html(this.template());
		return this;
	}
});


// create a control view for different features
var BrightnessControlView = Backbone.View.extend({
	template: _.template($('#brightness-control-view').html()),
	events: {
		'click button': 'close'
	},
	close: function (){
		$controls.hide();
	},
	render: function(){
		this.$el.html(this.template());
		var $brightness = this.$('span');
		this.$('#brightness-slider').slider({
			min: -100,
			value: 0,
			max: 100,
			stop: function( event, ui ) {
				$brightness.html(ui.value);
				Caman(".canvas-working>canvas", function () {
					this.reset();
					this.brightness(ui.value).render();
				});
			}
		});
		return this;
	}
});
var ContrastControlView = Backbone.View.extend({
	template: _.template($('#contrast-control-view').html()),
	events: {
		'click button': 'close'
	},
	close: function (){
		$controls.hide();
	},
	render: function(){
		this.$el.html(this.template());
		var $contrast = this.$('span');
		this.$('#contrast-slider').slider({
			min: -100,
			value: 0,
			max: 100,
			stop: function( event, ui ) {
				$contrast.html(ui.value);
				Caman(".canvas-working>canvas", function () {
					this.reset();
					this.contrast(ui.value).render();
				});
			}
		});
		return this;
	}
});

var stopWords = ['a','about','above','after','again','against','all','am','an','and','any','are','aren\'t','as','at','be','because','been','before','being','below','between','both','but','by','can\'t','cannot','could','couldn\'t','did','didn\'t','do','does','doesn\'t','doing','don\'t','down','during','each','few','for','from','further','had','hadn\'t','has','hasn\'t','have','haven\'t','having','he','he\'d','he\'ll','he\'s','her','here','here\'s','hers','herself','him','himself','his','how','how\'s','i','i\'d','i\'ll','i\'m','i\'ve','if','in','into','is','isn\'t','it','it\'s','its','itself','let\'s','me','more','most','mustn\'t','my','myself','no','nor','not','of','off','on','once','only','or','other','ought','our','ours','ourselves','out','over','own','same','shan\'t','she','she\'d','she\'ll','she\'s','should','shouldn\'t','so','some','such','than','that','that\'s','the','their','theirs','them','themselves','then','there','there\'s','these','they','they\'d','they\'ll','they\'re','they\'ve','this','those','through','to','too','under','until','up','very','was','wasn\'t','we','we\'d','we\'ll','we\'re','we\'ve','were','weren\'t','what','what\'s','when','when\'s','where','where\'s','which','while','who','who\'s','whom','why','why\'s','with','won\'t','would','wouldn\'t','you','you\'d','you\'ll','you\'re','you\'ve','your','yours','yourself','yourselves'];


// render views in html
var $search = $('.search'),
	$bar = $search.find('.bar'),
	$suggestions = $search.find('.suggestions'),
	$tools = $('.tools'),
	$controls = $('.controls');

var searchBarView = new SearchBarView({collection: filteredFeatures}),
	workflowSearchResultsView = new WorkflowSearchResultsView({collection: filteredWorkflows}),
	featureSearchResultsView = new FeatureSearchResultsView({collection: filteredFeatures}),
	grabToolsView = new GrabToolsView({collection: currentFeatures}),
	brightnessControlView = new BrightnessControlView(),
	contrastControlView = new ContrastControlView();

$bar.prepend(searchBarView.render().el);
$suggestions.append(workflowSearchResultsView.render().el);
$suggestions.append(featureSearchResultsView.render().el);
$tools.append(grabToolsView.render().el);
$controls.append(brightnessControlView.render().el);
$controls.append(contrastControlView.render().el);


// var featureView = new FeatureView({model: feature1});
// $('body').append(featureView.render().el);