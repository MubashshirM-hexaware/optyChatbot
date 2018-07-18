define(['jquery', 'underscoreWithMixins', 'Ractive', 'ractive-events-keys', 'RedmarineUXComponentTemplates', 'RedmarinePartials', 'RactiveTap'
	], function($, _, Ractive, RactiveEventsKeys, RedmarineUXTemplates, RedmarinePartials) {
	 var BaseComponent;
	(function() {

	BaseComponent = Ractive.extend({
		isolated: true,
		paths: {
			base: '/opfiles/ys/redmarine'
		},
		partials: RedmarinePartials,
		loadStyles: function(component) {
			var i,
				url,
				stylesCount,
				existingStyles = document.getElementsByTagName('link');

			// TODO: this path should link to compiled css files folder
			url = this.paths.base + '/components/' + component + '/' + component + '.css';

			for (i = 0, stylesCount = existingStyles.length; i < stylesCount; i++) {
				var curStyle = existingStyles[i];
				if (curStyle.getAttribute('rel') === 'stylesheet' && curStyle.getAttribute('href') === url) {
					break;
				}
			}

			if (i === stylesCount) { // stylesheet is not included yet, so add it
				var customStyles = document.createElement('link');
				customStyles.setAttribute('rel', 'stylesheet');
				customStyles.setAttribute('href', url);
				document.getElementsByTagName('head')[0].appendChild(customStyles);
			}
		},
		onconstruct: function() {
			this.loadStyles(this.data.component);
		}
	});


})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

// Add component to Global Ractive object
Ractive.components['ux-accordion'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxaccordionUxaccordion,

	events: {
		uparrow: RactiveEventsKeys.uparrow,
		downarrow: RactiveEventsKeys.downarrow,
		enter: RactiveEventsKeys.enter,
		space: RactiveEventsKeys.space
	},

	// any default data
	data: {
		component: 'ux-accordion',
		fireOnInitialSelection: true,
		isActive: function(index) {
			return index === this.get('activeIndex');
		}
	},

	// add you behavious here
	onrender: function() {
		// select an item
		this.on('select', function(event) {
			var activeIndex = this.get('activeIndex'),
				newIndex = parseInt(event.keypath.split('.').pop());
			if (activeIndex === newIndex) {
				newIndex = -1;
			}

			this.set('activeIndex', newIndex).then(function() {
				if (newIndex > -1) {
					this.fire('onSelect', this.get('items.' + this.get('activeIndex')));
				}
			}.bind(this));

			return false;
		}.bind(this));
	},

	oncomplete: function() {
		if (this.get('fireOnInitialSelection')) {
			var item = this.get('items.' + this.get('activeIndex'));
			this.fire('onSelect', item);
		}
	}
});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent, RactiveEventsKeys */
// Add it to Global Ractive object
Ractive.components['ux-autocomplete'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxautocompleteUxautocomplete,

	data: {
		delay: 500,
		minChars: 3,
		selectedIndex: -1,
		queryParameter: 'query',
		responseKeyPath: null,
		responseTitleField: 'title',
		responseType: "json",
		allowScrolling: true,
		limit: 0,
		url: '#',
		component: 'ux-autocomplete',
		multipleSources: false,
		closeAutoSuggestion: true
	},

	events: {
		uparrow: RactiveEventsKeys.uparrow,
		downarrow: RactiveEventsKeys.downarrow,
		rightarrow: RactiveEventsKeys.rightarrow,
		enter: RactiveEventsKeys.enter,
		space: RactiveEventsKeys.space
	},

	computed: {
		typeahead: function() {
			var suggestions = this.get('suggestions'),
				userInput   = this.get('userInput'),
				typeahead   = '',
				titleField  = this.get('responseTitleField'),
				inputRegex  = new RegExp('^' + userInput, 'i');
			if (suggestions) {
				typeahead = userInput + _.result(_.find(suggestions, function(item) {
					if (item[titleField].match(inputRegex)) {
						return item[titleField];
					}
				}), titleField).replace(inputRegex, '');
			}
			return typeahead;
		},

		sources: function() {
			var source = this.get('source');
			return (typeof source === 'string') ? [{href: source}] : source;
		},

		multipleSources: function() {
			return this.get('sources').length > 1;
		},

		options: function() {
			var result = this.get('result'),
				options = [];
			_.each(result, function(group) {
				if (group.options) {
					options = options.concat(group.options);
				}
			});
			return options;
		}
	},

	onrender: function() {

		var promises = [],
			delayedSearch,
			inputElement = this.find('input'),
			acElement = this.find('.autocomplete-suggestive-text'),
			sources = this.get('sources'),
			closeAutoSuggestion = this.get('closeAutoSuggestion');

		// helper function to clear results
		this.clearResults = function () {
			if (closeAutoSuggestion) {
				return this.set('result', []).then(function () {
					this.fire('resultsCleared');
				}.bind(this));	
			} else {
				var deferred = $.Deferred();
				deferred.resolve();
				return deferred.promise();
			}
		}.bind(this);

		// Will work for touch events also.
		$('html').on('click', function(event) {

			if (this.get('options').length === 0) {
				// Not showing the autocomplete UI, ignore.
				return;
			}

			if ($.contains(acElement, event.target)) {
				// Click was inside the ac, ignore.
				return;
			}

			// Clearing the options hides the UI.
			this.clearResults().then(function() {
				if (this.get('allowScrolling')) {
					this.scrollToWidgetTop(inputElement.parentNode, 'fast');
				}
			}.bind(this));

		}.bind(this));

		this.on('newUserInput', function(event) {

			clearTimeout(delayedSearch);

			this.set('userInput', event.node.value);

			if (event.node.value.length < this.get('minChars')) {
				this.clearResults();
				this.set('suggestions', []);
				return;
			}

			// Down, Up, Enter = skip. Every other key (e.g. backspace), allow to trigger.
			// FIXME If using RactiveEventsKeys, why can't I exclude them from keyup? keypress not good enough.
			if (_.includes([40, 38, 13], event.original.which)) {
				return;
			}

			// Add a small delay to avoid making XHR until User's input pauses.
			delayedSearch = setTimeout(function() {

				var userInput = event.node.value;

				// Abort existing request and start a new one.
				_.each(promises, function(promise) {
					promise.abort();
				});

				// reset the pointer for the new search
				this.set('selectedIndex', -1);

				_.each(sources, function(source, index){
					var param = source.queryParameter || this.get('queryParameter'),
						responseType = source.responseType || this.get('responseType');

					promises[index] = $.getJSON(source.href, param + '=' + userInput +
						(responseType === 'jsonp' ? '&callback=?' : ''));

				}.bind(this));

				this.set('ajax', promises);

				$.when.apply($, promises)
					.done(function() {

						var responses = this.get('multipleSources') ? arguments : [arguments],
							result = [],
							optionIndex = 0;

						_.each(responses, function(response, responseIndex) {

							var responseKeyPath = typeof(sources[responseIndex]['responseKeyPath']) === 'undefined'
									? this.get('responseKeyPath') : sources[responseIndex]['responseKeyPath'],
								titleField = typeof(sources[responseIndex]['responseTitleField']) === 'undefined'
									? this.get('responseTitleField') : sources[responseIndex]['responseTitleField'],
								limit = sources[responseIndex]['limit'] || this.get('limit'),
								suggestions;

							suggestions = responseKeyPath ? _.get(response, responseKeyPath) ||
								_.get(response[0], responseKeyPath) : response[0];

							// proceed only if there are valid suggestions
							if (!suggestions || _.isEmpty(suggestions)) {
								return;
							}

							// if limit is defined then show only that number of results
							if (limit > 0) {
								suggestions = suggestions.slice(0, limit);
							}
							this.set('suggestions', suggestions);

							// create another object from suggestions
							// to support the user defined title and url fields
							var userInputRegex = new RegExp('(' + userInput.replace(/\s+/g, '|') + ')', 'gi');
							suggestions = _.map(suggestions, function(item) {

								// highlight the entered value
								var title = item[titleField].replace(userInputRegex,
									function(str) {
										return '<span>' + str + '</span>';
									}
								);

								return {
									'title': title,
									'found': item[titleField],
									'groupIndex': responseIndex,
									'responseObject': item,
									'index': optionIndex++
								};
							});

							result.push({
								groupIndex: responseIndex,
								groupTitle: sources[responseIndex].title || '',
								options: suggestions
							});

						}.bind(this));

						// Always get rid of the zero-eth item "Use entered address: 1 lyon"
						// response.data.suggestions.shift();
						this.set('result', result).then(function() {
							this.fire('onPopulated', result);
							if (this.get('allowScrolling')) {
								this.scrollToWidgetTop(acElement.parentNode, 'fast');
							}
						}.bind(this));

					}.bind(this))
					.fail(function(e){
						if (e.statusText !== 'abort') {
							console.error('uxAutoComplete: Cannot fetch the suggestions due to the following error', e);
						}
						this.set('suggestions', []);
						this.clearResults();
					}.bind(this));

			}.bind(this), this.get('delay'));

		});

		this.on('completeText', function(event) {
			var inputValue         = event.node.value,
				caretPosition      = event.node.selectionStart;

			if (!inputValue) {
				return;
			}

			if (caretPosition >= inputValue.length) {
				if (this.get('typeaheadOption') && this.get('typeahead')) {
					this.set('value', this.get('typeahead'));
				}
			} else if (event.original instanceof KeyboardEvent) {
				event.node.selectionStart = caretPosition + 1;
			}

		}.bind(this));

		this.on('selectOption', function(event) {
			var selectedValue = event.context.found;

			this.clearResults().then(function () {
				this.set({
					// Set the field value.
					value: selectedValue,
					suggestions: []
				}).then(function() {
					if (this.get('allowScrolling')) {
						this.scrollToWidgetTop(inputElement.parentNode, 'fast');
					}

					// fire the select event in the parent event and pass the selected value
					this.fire('onSelect', selectedValue, event.context);
				}.bind(this));
			}.bind(this));



			return false;

		});

		// For keyboard driven UI.
		this.on('selectCurrentOption', function(event) {

			if (this.get('options').length === 0 ||
				this.get('selectedIndex') === -1) {
				this.fire('onEnter', event);
				return false;
			}

			var currentIndex = this.get('selectedIndex'),
				selectedValue = this.get('options')[currentIndex].found,
				selectedOption = this.get('options')[currentIndex];

			this.clearResults().then(function () {
				this.set({
					value: selectedValue,
					suggestions: []
				}).then(function() {
					if (this.get('allowScrolling')) {
						this.scrollToWidgetTop(inputElement.parentNode, 'fast');
					}

					// fire the select event in the parent event and pass the selected value
					this.fire('onSelect', selectedValue, selectedOption);
				}.bind(this));
			}.bind(this));


		});

		this.on('nextOption', function(event) {

			var selectedIndex = this.get('selectedIndex');

			if ((selectedIndex + 1) === this.get('options').length) {
				// Past the post - go no further!
				return;
			}

			this.set('selectedIndex', selectedIndex + 1).then(function() {
				// FIXME Move focus instead (accessibility).
				// var selectedElement = this.find('.selected');
				// this.scrollToWidgetTop(selectedElement, 'fast');
			}.bind(this));

		});

		this.on('prevOption', function(event) {

			var selectedIndex = this.get('selectedIndex');

			if (selectedIndex === 0) {
				// Past the post - go no further!
				return;
			}

			this.set('selectedIndex', selectedIndex - 1).then(function() {
				// FIXME Move focus instead (accessibility).
				// var selectedElement = this.find('.selected');
				// this.scrollToWidgetTop(selectedElement, 'fast');
			}.bind(this));

		});

		this.observe('showSuggestions', function(value) {
			if (!value) {
				this.clearResults();
				var ajaxs = this.get('ajax');
				_.each(ajaxs, function(ajax) {
					if (ajax.abort) {
						ajax.abort();
					}
				});
			}
		}.bind(this));

	}

});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

// Add component to Global Ractive object
Ractive.components['ux-joyride'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxjoyrideUxjoyride,

	events: {
		enter: RactiveEventsKeys.enter
	},

	// any default data
	data: {
		component: 'ux-joyride',
		isHidden: true,
		defaultNubTop: 28,
		maxMobileWidth: 500,
		styles: {
			top: '0px',
			left: '0px',
			width: 'auto'
		}
	},

	open: function() {
		var hasJoyride  = this.find('*[aria-haspopup]'),
			joyride  = this.find('.ux-joyride'),
			documentWidth = document.documentElement.offsetWidth,
			containerWidth = this.el.parentElement.offsetWidth,
			defaultNubTop = this.get('defaultNubTop'),
			stylesObject = {};

		if (documentWidth > this.get('maxMobileWidth')) {
			stylesObject.nubPosition = 'left';
			stylesObject.top = (- defaultNubTop) + 'px';
			stylesObject.left = (hasJoyride.offsetWidth + hasJoyride.offsetLeft + defaultNubTop) + 'px';
			stylesObject.joyrideNubTop = defaultNubTop + 'px';
			stylesObject.width = (containerWidth - joyride.offsetWidth - joyride.offsetLeft - defaultNubTop) + 'px';
		} else {
			stylesObject.nubPosition = 'top';
			stylesObject.top = defaultNubTop + 'px';
			stylesObject.left = '0px';
			stylesObject.joyrideNubTop = (- defaultNubTop) + 'px';
			stylesObject.width = (containerWidth - joyride.offsetLeft - 2) + 'px';
		}

		this.set('styles', stylesObject);

		this.set('isHidden', false);
		_.defer(function() {
			hasJoyride.focus();
		});

	},

	close: function() {
		var hasJoyride  = this.find('*[aria-haspopup]');

		hasJoyride.focus();
		this.set('isHidden', true);
	},

	// add you behaviors here
	onrender: function() {
		this.on('toggle', function(event) {
			event.original.preventDefault();

			// calculate the current positioning of the joyride
			if (this.get('isHidden')) {
				this.open();
			} else {
				this.close();
			}

			return false;
		});

		this.on('close', function(event) {
			event.original.preventDefault();

			this.close();

			return false;
		});
	}
});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

var PAGE_LINKS_LARGE = 10,
	PAGE_LINKS_SMALL = 3;

// Add component to Global Ractive object
Ractive.components['ux-pagination'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxpaginationUxpagination,

	// any default data
	data: {
		largeLinks: PAGE_LINKS_LARGE,
		smallLinks: PAGE_LINKS_SMALL,
		component  : 'ux-pagination'
	},

	pages: function(links) {
		var totalPages   = this.get('pageMax')    || 0,
			pageNumber   = this.get('pageNumber') || 0,
			half         = Math.ceil(links / 2),
			start        = 1,
			size         = links;

		if (pageNumber >= half) {
			start = pageNumber - half + 1;
		}
		if (start + links > totalPages) {
			start = totalPages - links + 1;
		}

		if (size > totalPages) {
			size = totalPages;
		}
		else if (start + size > totalPages) {
			start = totalPages - size + 1;
		}

		if (start < 1) {
			start = 1;
		}

		var pages = [];
		for (var i = start; i < start + size; i++) {
			var distance = 'far';
			if (i === pageNumber) {
				distance = 'current';
			}
			else if (Math.abs(i - pageNumber) === 1 || // page "i" is either side of current page
				// current page is last and page "i" is the 3rd last page
				(pageNumber === totalPages && i === totalPages - 2) ||
				// current page is the first and page "i" is page 3
				(pageNumber === 1 && i === 3)
			) {
				distance = 'near';
			}
			pages.push({
				number: i,
				next: i,
				class: '',
				current: 'page-' + i + (i === pageNumber ? ' current' : '')
			});
		}
		if (pageNumber !== 1) {
			pages.unshift({
				number: '&nbsp;',
				next  : pageNumber - 1,
				class : 'ico ico-arrow-left',
				current: 'page-previous'
			});
		}

		if (pageNumber < totalPages) {
			pages.push({
				number: '&nbsp;',
				next  : pageNumber + 1,
				class : 'ico ico-arrow-right',
				current: 'page-next'
			});
		}

		return pages;
	},

	onrender: function() {
		this.on('setPageNumber', function(event, page) {
			this.set('pageNumber', page)
				.then(function() {
					// refocus on the current page number after rendering
					$(this.find('.pagination-v2')).find('.current:visible').focus();
				}.bind(this));
		}.bind(this));
	},

	computed: {
		smallPages: function() {
			return this.pages(this.get('smallLinks'));
		},
		largePages: function() {
			return this.pages(this.get('largeLinks'));
		}
	}
});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

// Add component to Global Ractive object
Ractive.components['ux-passwordstrength'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxpasswordstrengthUxpasswordstrength,

	// any default data
	data: {
		component: 'ux-passwordstrength',
		strengthCSS: '',
		meterValue: ''
	},

	/**
	* Existing My Account logic to calculate the password strength
	*/
	getPasswordStrength: function(password) {

		var self = this;

		var strength = 0,
			fNumber = false,
			fLower = false,
			fUpper = false,
			fPanctuation = false,
			numbers = '0123456789',
			lowercase = 'abcdefghijklmnopqrstuvwxyz',
			uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
			punctuation = '!.@$£#*()%~<>{}[]?\\\"+-^&';

		if (self.contains(password, numbers) > 0) {
			fNumber = true;
		}
		if (self.contains(password, lowercase) > 0) {
			fLower = true;
		}
		if (self.contains(password, uppercase) > 0) {
			fUpper = true;
		}
		if (self.contains(password, punctuation) > 0) {
			fPanctuation = true;
		}
		if (fNumber === true && (fLower === true || fUpper === true)) {
			strength += 1;
			if (fNumber === true && fLower === true && fUpper === true) {
				strength += 1;
				if (password.length >= 8) {
					strength += 1;
					if (fPanctuation === true) {
						strength += 1;
						if (password.length >= 10) {
							strength += 1;
						}
					}
				}
			}
		} else {
			strength = 0;
			//progState.className = pwd_strength_0;
		}
		return strength;
	},

	/**
	* Used by getPasswordStrength function
	*/
	contains: function(password, validChars) {

		var totalCount = 0,
			i,
			character;
		
		if(!_.isEmpty(password)) {
			for (i = 0; i < password.length; i += 1) {
				character = password.charAt(i);
				if (validChars.indexOf(character) > -1) {
					totalCount ++;
				}
			}
		} 

		return totalCount;
	},

	displaySeparators: function() {
		this.set({
			bar33: '',
			bar66: ''
		});
	},

	hideSeparators: function() {
		this.set({
			bar33: 'hide-bar',
			bar66: 'hide-bar'
		});
	},

	// add you behavious here
	onrender: function() {

		this.observe('password', function(newValue, oldValue) {
						
			var strength = this.getPasswordStrength(newValue);

			var comment = 'Weak';

			switch (strength) {
				case 3: comment = 'Medium';
					this.set('bar33','hide-bar');
					this.set('bar66','');
					break;
				case 4:
				case 5:
					comment = 'Strong';
					this.hideSeparators();
					break;
				default:
					comment = 'Weak';
					this.displaySeparators();
					break;
			}
			
			var strengthCSS = (!_.isEmpty(newValue) ? 's'+strength : '');
			this.set('strengthCSS', strengthCSS)
			this.set('meterValue', (!_.isEmpty(newValue) ? comment : '')); 
		});
	}

});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

// Add component to Global Ractive object
Ractive.components['ux-radiogroup'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxradiogroupUxradiogroup,

	events: {
		uparrow: RactiveEventsKeys.uparrow,
		downarrow: RactiveEventsKeys.downarrow,
		leftarrow: RactiveEventsKeys.leftarrow,
		rightarrow: RactiveEventsKeys.rightarrow,
		enter: RactiveEventsKeys.enter,
		space: RactiveEventsKeys.space
	},

	// any default data
	data: {
		component: 'ux-radiogroup'
	},

	toTheLeft: function(groupOfItems, itemIndex, firstIndex, lastIndex) {
		itemIndex -= 1;
		if (itemIndex < firstIndex) {
			itemIndex = lastIndex;
		}
		return itemIndex;
	},

	toTheRight: function(groupOfItems, itemIndex, firstIndex, lastIndex) {
		itemIndex += 1;
		if (itemIndex > lastIndex) {
			itemIndex = firstIndex;
		}
		return itemIndex;
	},

	navigate: function(event, left) {
		event.original.preventDefault();

		var groupOfItems = this.findAll('*[role="radio"]');

		var itemIndex = this.get('itemIndex');

		if (!itemIndex && itemIndex !== 0) {
			// first time focus on the selected or failing that the first element
			var selectedItem = this.find('*[aria-checked="true"]');
			if (selectedItem) {
				itemIndex = _.findIndex(groupOfItems, function(item) {
					return selectedItem === item;
				});
			} else {
				itemIndex = 0;
			}
		} else {
			// use the current position to control the tab
			var firstIndex = 0,
				lastIndex = groupOfItems.length - 1;
			if (left) {
				itemIndex = this.toTheLeft(groupOfItems, itemIndex, firstIndex, lastIndex);
			} else {
				itemIndex = this.toTheRight(groupOfItems, itemIndex, firstIndex, lastIndex);
			}
		}

		this.set('itemIndex', itemIndex);
		groupOfItems[itemIndex].focus();
	},

	onrender: function() {
		var self = this;

		this.on('navigateLeft', function (event) {
			self.navigate(event, true);
			return false;
		});

		this.on('navigateRight', function (event) {
			self.navigate(event, false);
			return false;
		});

		/*
		 * ensure the first arrow key press will go to the selected radio button
		 */
		this.on('focus', function (event) {
			this.set('itemIndex', null);
			return false;
		});

		/*
		 * set the item index
		 * if not disabled then fire the event defined in the context
		 * event.context.value should provide the information needed to process the event
		 */
		this.on('select', function (event) {
			event.original.preventDefault();

			this.set('itemIndex', event.context.itemIndex);

			if (!event.context.disabled && event.context.fireEvent) {
				self.fire(event.context.fireEvent, event);
			}
			return false;
		});
	}
});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

// Add component to Global Ractive object
Ractive.components['ux-rating'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxratingUxrating,

	// any default data
	data: {
		component: 'ux-rating',
		getStars: function(stars) {
			var name = (_.floor(stars * 2) * 5);
			return name < 10 ? '0' + name : name;
		},
		getTitle: function(stars) {
			return stars + ' out of 5 stars';
		}
	},

	computed: {
		starClass: function() {
			return this.get('getStars')(this.get('rating'));
		},
		title: function() {
			return this.get('getTitle')(this.get('rating'));
		}
	}

});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

var SEGMENT_WIDTH = 200;

// Add component to Global Ractive object
Ractive.components['ux-segmentationlist'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxsegmentationlistUxsegmentationlist,

	// any default data
	data: {
		component: 'ux-segmentationlist',
		items: [],
		startIndex: 0,
		selectedIndex: -1,
		fireOnInitialSelection: true,
		segmentWidth: SEGMENT_WIDTH,
		isSelected: function(index) {
			return this.get('selectedIndex') === index;
		}
	},

	computed: {

		totalItems: function() {
			return this.get('items').length;
		},

		sliderWidth: function() {

			var sliderWidth = this.get('componentWidth'),
				navWidth = this.get('navWidth');

			// deduct the navigation button (next/prev) width from the slider
			// if they are visible
			if (this.get('showNextNav')) {
				sliderWidth -= navWidth;
			}
			if (this.get('showPrevNav')) {
				sliderWidth -= navWidth;
			}

			return sliderWidth;
		},

		// calculate the no. of visible items
		// based on the viewport width
		visible: function() {
			var width = this.get('componentWidth'),
				segWidth = this.get('segmentWidth'),
				totalItems = this.get('totalItems'),
				segments = Math.floor(width / segWidth);

			segments = (segments >= totalItems) ? totalItems : segments;

			return segments;
		},

		itemWidth: function() {
			return this.get('sliderWidth') / this.get('visible');
		},

		showPrevNav: function() {
			return this.get('startIndex') > 0;
		},

		showNextNav: function() {
			return this.get('startIndex') + this.get('visible') < this.get('items').length;
		},

		slidePosition: function() {

			var startIndex = this.get('startIndex'),
				itemWidth = this.get('itemWidth'),
				navWidth = this.get('navWidth'),
				position = 0;

			if (startIndex > 0) {

				position = (-1) * itemWidth * startIndex;

				if (this.get('showPrevNav')) {
					position += navWidth;
				}
			}

			return position;
		},

		pointerPosition: function() {
			var $pointer = this.get('$component').find('.pointer'),
				btnNavWidth = this.get('$component').find('.btn-nav').outerWidth(),
				itemWidth = this.get('itemWidth'),
				startIndex = this.get('startIndex'),
				selectedIndex = this.get('selectedIndex'),
				pointerPosition;


			pointerPosition = ((selectedIndex + 1) * itemWidth) -
				(startIndex * itemWidth) -
				itemWidth / 2 -
				$pointer.outerWidth() / 2;

			if (this.get('showPrevNav')) {
				pointerPosition += btnNavWidth;
			}

			return pointerPosition;
		},

		hidePointer: function() {
			var selectedIndex = this.get('selectedIndex'),
				startIndex = this.get('startIndex'),
				visible = this.get('visible');

			// hide the pointer if it is out of slider
			if (selectedIndex < startIndex) {
				return true;
			}
			if (selectedIndex >= startIndex + visible) {
				return true;
			}
		}
	},

	// add you behavious here
	onrender: function() {

		// move to next
		this.on('next', function(event) {
			var totalItems = this.get('totalItems'),
				visible = this.get('visible'),
				newStartIndex = this.get('startIndex') + visible;

			if (newStartIndex > totalItems - visible) {
				newStartIndex = totalItems - visible;
			}

			this.set('startIndex', newStartIndex);
		}.bind(this));

		// move to previous
		this.on('prev', function(event) {
			var visible = this.get('visible'),
				newStartIndex = this.get('startIndex') - visible;

			if (newStartIndex < 0) {
				newStartIndex = 0;
			}

			this.set('startIndex', newStartIndex);
		}.bind(this));

		this.on('select', function(event) {
			event.original.preventDefault();
			var selectedIndex = this.get('selectedIndex'),
				newIndex = parseInt(event.keypath.split('.').pop());
			if (selectedIndex !== newIndex) {
				this.set('selectedIndex', newIndex).then(function() {
					this.fire('onSelect', this.get('items.' + newIndex));
				}.bind(this));
			}
		}.bind(this));

		// when the visible changes
		this.observe('visible', function(newVisible) {
			this.set('startIndex', 0);
		}.bind(this));

	},

	oncomplete: function() {

		this.set('$component', $('.' + this.get('component'))).then(function() {
			this.calcComponentWidth().then(function() {
				this.calcNavWidth();
			}.bind(this));
		}.bind(this))
		.then(function() {
			// check the widths
			this.calcComponentWidth().then(function() {
				this.calcNavWidth();
			}.bind(this));
		}.bind(this));

		// refresh the visible variable
		// to update the computed properties
		$(window).resize(function() {
			this.calcComponentWidth().then(function() {
				this.calcNavWidth();
				setTimeout(function() {
					this.calcNavWidth();
				}.bind(this), 100);
			}.bind(this));
		}.bind(this));


		if (this.get('fireOnInitialSelection')) {
			var item = this.get('items.' + this.get('selectedIndex'));
			this.fire('onSelect', item);
		}

		setTimeout(function() {
			this.calcComponentWidth().then(function() {
				this.calcNavWidth();
			}.bind(this));
		}.bind(this), 500);
	},

	calcComponentWidth: function() {
		return this.set('componentWidth', this.get('$component').outerWidth());
	},

	calcNavWidth: function() {
		this.set('navWidth', this.get('$component').find('.btn-nav:not(.hide)').outerWidth());
	}

});

})();
(function() {
/*global Ractive, RedmarineUXTemplates, BaseComponent */

Ractive.components['ux-simpleblock'] = BaseComponent.extend({

	template: RedmarineUXTemplates.uxsimpleblockUxsimpleblock,

	data: {
		component: 'ux-simpleblock',
		isActive: true,
		disableToggling: true,
		truncate: false,
		limit: 0
	},

	computed: {
		itemsList: function() {
			var items = this.get('items'),
				limit = this.get('limit');

			if (limit > 0) {
				items = items.slice(0, limit);
			}

			return items;
		}
	},
	onrender: function() {
		this.on('toggleBlock', function(event) {
			event.original.preventDefault();
			this.toggle('isActive');
		}.bind(this));
	}

});

})();

});
//# sourceMappingURL=components.js.map