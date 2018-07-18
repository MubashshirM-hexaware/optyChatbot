define([], function () {return {
name: 'searchBox',
templates: {
	searchBoxHeaderView: {"v":1,"t":[{"t":7,"e":"div","a":{"class":["search-box ",{"t":2,"r":"viewName"}," ",{"t":2,"r":"searchStyle"}," ",{"t":4,"r":"isFocused","f":["focused"]}," ",{"t":4,"r":"isError","f":["error"]}]},"f":[{"t":7,"e":"div","a":{"class":"mobile-search-overlay"},"v":{"tap":"hideMobileSearch"}}," ",{"t":7,"e":"span","a":{"class":"ico ico-cross btn-close"},"v":{"click":"hideMobileSearch"}}," ",{"x":{"r":["inputName","searchResultsURL"],"s":"{placeholder:\"Search\",name:_0,actionUrl:_1,method:\"GET\"}"},"f":[{"t":8,"r":"searchForm"}],"t":4,"n":53}," ",{"t":7,"e":"span","a":{"class":"ico ico-search mobile-search-trigger"},"v":{"click":"showMobileSearch"}}]}]},
	searchBoxLargeView: {"v":1,"t":[{"t":7,"e":"div","a":{"class":"row"},"f":[{"t":7,"e":"div","a":{"class":"column large-12 medium-12 small-12"},"f":[{"t":7,"e":"div","a":{"class":["search-box ",{"t":2,"r":"viewName"}," ",{"t":2,"r":"searchStyle"}," ",{"t":4,"r":"isFocused","f":["focused"]}," ",{"t":4,"r":"isError","f":["error"]}]},"f":[{"x":{"r":["searchResultsURL"],"s":"{placeholder:\"How can we help you?\",name:\"question\",actionUrl:_0,method:\"POST\",customContent:\"true\",closeAutoSuggestion:false}"},"f":[{"t":8,"r":"searchForm"}],"t":4,"n":53}]}]}]}]}
},
widget: define('searchBox', [
	'underscore',
	'BaseWidget',
	'searchUtils',
	'RedmarineUXComponents',
], function(_, BaseWidget, searchUtils) {

	var Widget = function(options) {

		var $header = $('header.header-only'),
			searchUrl = '',
			view,
			typeaheadOption = false,
			inputName,
			customContent = false;

		if (options.data.data && options.data.data.answerPage) {
			searchUrl = options.data.data.answerPage;
			if (searchUrl.match(/^[/][^/]/)) {
			
				searchUrl = 'https://' + window.location.host + searchUrl;
			}
			typeaheadOption = true;
			inputName = 'query';
		} else if (options.data.controllerModel && options.data.controllerModel.urlMap) {
			searchUrl = options.data.controllerModel.urlMap.answerPageURL;
			inputName = 'question';
			customContent = true;
		}

		_.extend(options.data, {
			searchResultsURL: searchUrl,
			searchValue: options.data.data ? options.data.data.query : '' || '',
			isFocused: false,
			isError: false,
			showMobileSearch: false,
			searchStyle: 'pc-search',
			autoSuggest: true,
			typeaheadOption: typeaheadOption,
			inputName: inputName,
			customContent: customContent
		});

		_.extend(options, {
			computed: {
				autoCompleteURL: function() {
					var suggestionUrl;

					if (options.data.controllerModel && options.data.controllerModel.urlMap) {
						suggestionUrl = [];
						var irSuggestUrl = options.data.controllerModel.urlMap.irSuggestUrl,
							queryParameter = irSuggestUrl.match(/&(\w+)=$/)[1],
							communitySuggestUrl = options.data.controllerModel.urlMap.communitySuggestUrl;
						irSuggestUrl = irSuggestUrl.replace('&' + queryParameter + '=', '');
						if (irSuggestUrl) {
							suggestionUrl.push({
								'href': irSuggestUrl,
								'queryParameter': queryParameter,
								'responseKeyPath': '',
								'responseTitleField': 'value',
								'responseType': 'jsonp'
							});
						}
						if (communitySuggestUrl) {
							suggestionUrl.push({
								'title': options.data.controllerModel.urlMap.communitySuggestionTitle,
								'responseTitleField': 'title',
								'responseKeyPath': '',
								'queryParameter': 'query',
								'href': communitySuggestUrl
							});
						}
					} else {
						suggestionUrl = options.data.readUrl || '';
					}
					return suggestionUrl;
				}
			},
			analytics: function (type) {
				var searchValue = this.get('searchValue'),
					preSearchValue = this.get('preSearchValue');
								if(type === 'preSearch') {
					if (window.SiteSearchRequest) {
						window.SiteSearchRequest(searchValue);
					}
					if (window.SiteSearchPreResultClick) {
						window.SiteSearchPreResultClick(preSearchValue, searchValue);
					}
				} else if (window.SiteSearchRequest) {
					window.SiteSearchRequest(searchValue);
				}
			}
		});

		this.ractive = new BaseWidget(options);
		view = this.ractive.get('viewName');

		var closeSearch = function() {
			this.ractive.set({
				isFocused: false,
				isError: false
			}).then(function() {
				hideSuggestions();
			});
		}.bind(this);

		var hideSuggestions = function() {
			this.ractive.findComponent('ux-autocomplete').set('result', []);
		}.bind(this);

	
	
	
		if (view === 'searchBoxHeaderView') {
			$(document).on('click', function(e) {
				var target = $(e.target);
				if (this.ractive.get('isFocused') &&
					!target.hasClass(view) &&
					(target.parents('.' + view).length === 0 ||
						target.hasClass('mobile-search-overlay'))
				) {
					closeSearch();
				}
			}.bind(this));

			this.ractive.on('ux-autocomplete.onPopulated', function() {
			
				if (!this.ractive.get('isFocused')) {
					hideSuggestions();
				}
			}.bind(this));
		}

		this.ractive.on('ux-autocomplete.onFocus', function() {
			this.ractive.set('isFocused', true);
		}.bind(this));

		this.ractive.on('ux-autocomplete.onSelect', function() {
			this.ractive.analytics('preSearch');
		}.bind(this));

		this.ractive.on('ux-autocomplete.onSelect', searchUtils.onSelectOfAutosuggestValue.bind(this));

		this.ractive.on('ux-autocomplete.onPopulated', searchUtils.updateAutoSuggestUrls.bind(this));

		this.ractive.on('ux-autocomplete.onEnter', function() {
			this.ractive.fire('doSearch');
		}.bind(this));

		this.ractive.on('ux-autocomplete.newUserInput', function(event) {
			if (event.node.value.length >= 1) {
				this.ractive.set('isError', false);
				this.ractive.set('preSearchValue', event.node.value);
			}
		}.bind(this));

	
		this.ractive.on('doSearch onQuery', function() {
		
			if (this.ractive.get('searchValue').length < 1) {
				this.ractive.set('isError', true);
				if (this.ractive.get('viewName') === 'searchBoxHeaderView') {
					window.alert('Please enter at least one search keyword.');
				}
				return false;
			}
			this.ractive.findComponent('ux-autocomplete').set('suggestions', []);
			this.ractive.analytics();
			if (this.ractive.get('data.answerPage')) {
				this.ractive.find('form').submit();
			} else {
				searchUtils.ajaxSubmitSupportSearch(this.ractive);
			}
		}.bind(this));

		this.ractive.on('showMobileSearch', function() {
			if (this.ractive.get('showMobileSearch')) {
				this.ractive.fire('doSearch');
			} else {
				this.ractive.set({
					showMobileSearch: true,
					isFocused: true
				}).then(function() {
					$(this.ractive.el.parentElement).addClass('mobile-search');
					this.ractive.set('searchStyle', 'mobile');
					$header.addClass('forward');
				}.bind(this));
			}
		}.bind(this));

		this.ractive.on('hideMobileSearch', function() {
			this.ractive.set('showMobileSearch', false).then(function() {
				removeMobileStyles();
				closeSearch();
			}.bind(this));
		}.bind(this));

		var removeMobileStyles = function () {
			$(this.ractive.el.parentElement).removeClass('mobile-search');
			this.ractive.set('searchStyle', 'pc-search');
			$header.removeClass('forward');
		}.bind(this);

				$('html').on('click', function(event) {
			if (view === 'searchBoxLargeView') {
				hideSuggestions();
			}
		});
	};

	Widget.prototype = {
		actions: {
			'newQuery': ['updateSearchTerm'],
			'searchedQuery': ['updateSearchTerm']
		},

		updateSearchTerm: function(query) {
			this.ractive.findComponent('ux-autocomplete').set('suggestions', []);
			this.ractive.set('searchValue', query);
		}
	};

	return {
		initRactiveWidget: function(options) {
			return new Widget(options);
		}
	};

})
}});