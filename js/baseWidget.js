define([
	'jquery',
	'underscore',
	'Ractive',
	'ractive-events-keys',
	'RedmarinePartials',
	'RedmarineTransition',
	'RedmarineDecorator',
	'simulant',
	'underscoreString',
	'Equalizer',
	'ConfigStrings',
	'bowser'
], function ($, _, Ractive, RactiveEventsKeys, partials, transitions, decorators, simulant, str,
	Equalizer, ConfigStrings, bowser) {

	/**
	 * Helper function to bind foundation and our plugins (using standard event name "jsContentLoaded").
	 */
	function bindExternalJavaScript(el) {

		// Bind foundation to new DOM.
		if (typeof $.fn.foundation !== 'undefined') {
			$(el).foundation();
		}

		// Generic trigger for our plugins etc, which use a standard event name.
		$(el).trigger('jsContentLoaded');
		// Need to trigger for dropdown update
		$(el).find('select').trigger('change', true);

	}

	Ractive.events.space = RactiveEventsKeys.space;
	Ractive.events.enter = RactiveEventsKeys.enter;

	// define an equalizer for reuse
	var equalizer = new Equalizer();

	// Defaults, used by both BaseWidget and Components.

	Ractive.defaults.scrollToWidgetTop = function (el, speed) {
		speed = speed || 500;
		$('html, body').animate({
			scrollTop: $(el).offset().top
		}, speed);
	};

	// implementing components here for now, so all the widgets can share it
	// this should be moved to the separate components bundle

	var TabsArea = Ractive.extend({

		template: partials.TabsArea,

		components: {
			TabsLink: Ractive.extend({template: partials.TabsLink}),
			TabsPane: Ractive.extend({
				template: partials.TabsPane,
				oncomplete: function () {
					bindExternalJavaScript(this.el);
				},
				onchange: function () {
					_.defer(function(text) {
						bindExternalJavaScript(this.el);
					});

				}
			})
		},

		onrender: function () {

			this.on('TabsLink.clicked', function (event) {

				// Prevent '#' showing up on URLs for example.
				event.original.preventDefault();

				_.forEach(this.findAllComponents('TabsLink'), function (pane) {
						pane.set(
							'active',
							_.isEqual(pane._guid, event.component._guid)
						);
					});

				var tabsPanePromises = [];

				_.forEach(this.findAllComponents('TabsPane'), function (pane) {
						// @see http://docs.ractivejs.org/latest/ractive-set
						tabsPanePromises.push(pane.set(
							'active',
							_.isEqual(pane.data.id, event.context.targetPaneId)
						));
					});

				// Wait for all tabs to finish rendering.
				$.when.apply($, tabsPanePromises).done(function () {
					bindExternalJavaScript(this.el);
				}.bind(this));

				return false;

            });

        }

    });

	var uxCarouselSelector = Ractive.extend({
		template: partials.uxCarouselSelector,

		oncomplete: function () {
			var self = this;

			var options = this.get('datamodel.options');

			// start the carousel on the page with the selected option
			_.each(options, function(option, index) {
				if (option.selected) {
					self.set('startingIndex', index);
					return;
				}
			});

			bindExternalJavaScript(this.el);

			// recalculate the heights in this component
			setTimeout(
				function() {
					equalizer.defaultHeight = '100%';
					$.when(self.set('equalizerHeights',
							equalizer.reset(self.el, self.get('equalizerHeights'))))
						.done(function () {
							self.set('equalizerHeights',
								equalizer.equalize(self.el, self.get('equalizerHeights')));
						});
				}, 0);
		},

		onrender: function () {
			this.on('*.doSelectCarouselItem doSelectCarouselItem', function (event) {

				// Prevent '#' showing up on URLs for example.
				event.original.preventDefault();
				var self = this,
					options = event.context.options;

				// reset the selection
				_.each(options, function(occurrence) {
					if (self.get(occurrence.keypath)) {
						self.set(occurrence.keypath, false);
						return false;
					}
				});
				self.set(event.context.option.keypath, true);
			});
		}
	});

	var uxNestedButtonsGroup = Ractive.extend({
		template: partials.uxNestedButtonsGroup,
		components: {
			uxNestedButtonsItem: Ractive.extend({
				template: partials.uxNestedButtonsItem
			})
		},

		toTheLeft: function(groupOfItems, itemIndex, firstIndex, lastIndex) {
			do {
				itemIndex -= 1;
			} while(itemIndex >= firstIndex && groupOfItems[itemIndex].data.datamodel.disabled);
			if (itemIndex < firstIndex) {
				itemIndex = lastIndex;
			}
			return itemIndex;
		},

		toTheRight: function(groupOfItems, itemIndex, firstIndex, lastIndex) {
			do {
				itemIndex += 1;
			} while(itemIndex <= lastIndex && groupOfItems[itemIndex].data.datamodel.disabled);
			if (itemIndex > lastIndex) {
				itemIndex = firstIndex;
			}
			return itemIndex;
		},

		events: {
			leftarrow: RactiveEventsKeys.leftarrow,
			rightarrow: RactiveEventsKeys.rightarrow,
			downarrow: RactiveEventsKeys.downarrow,
			uparrow: RactiveEventsKeys.uparrow
		},

		oncomplete: function () {
			bindExternalJavaScript(this.el);
		},

		onrender: function () {
			var self = this;

			this.on('uxNestedButtonsItem.selectNestedButton', function (event) {

				event.original.preventDefault();

				self.fire(this.data.datamodel.fireEvent, event);

				return false;

			});

			this.on('uxNestedButtonsItem.navigateNestedButtons', function (event) {

				event.original.preventDefault();

				var groupOfItems = this.findAllComponents('uxNestedButtonsItem'),
					itemIndex = event.context.position;

				// need to calculate first and last index here in case disabled attributed changed
				var firstIndex = self.toTheRight(groupOfItems, -1, 0, groupOfItems.length -1),
					lastIndex = self.toTheLeft(groupOfItems, groupOfItems.length, 0, groupOfItems.length -1);

				if (event.original.keyCode === ConfigStrings.constants.KEYS.LEFT_ARROW ||
					event.original.keyCode === ConfigStrings.constants.KEYS.UP_ARROW) {
					itemIndex = self.toTheLeft(groupOfItems, itemIndex, firstIndex, lastIndex);
				} else if (event.original.keyCode === ConfigStrings.constants.KEYS.RIGHT_ARROW ||
					event.original.keyCode === ConfigStrings.constants.KEYS.DOWN_ARROW) {
					itemIndex = self.toTheRight(groupOfItems, itemIndex, firstIndex, lastIndex);
				}

				groupOfItems[itemIndex].find('li').focus();

				return false;

			});

		}

	});

	// step accordion component
	var uxStepAccordion = Ractive.extend({
		template: partials.uxStepAccordionContainer,

		onrender: function () {
			var self = this;

			// next button click event
			this.on('*.stepAccordionNextButton stepAccordionNextButton', function(event) {

				event.original.preventDefault();

				var context = event.context.stepAccordionConfig.context,
					keypath = event.context.stepAccordionConfig.keypath;

				if (context.sections[context.activeSection].error) {
					if (event.context.stepAccordionConfig.fireErrorEvent) {
						self.fire(event.context.stepAccordionConfig.fireErrorEvent, event);
					}
					return;
				}

				context.sections[context.activeSection].active = false;

				// ensure the maximum allowed section index is stored - could result in all sections closed
				if (context.activeSection >= context.maximumAllowedSyncSection) {
					context.maximumAllowedSyncSection = context.activeSection + 1;
				}

				if (context.activeSection < context.sections.length) {

					// get next section or should there be no next section then close the current one
					context.activeSection += 1;

					// if we have previously been in a later section and are returning to the flow
					if (context.activeSection < context.maximumAllowedSyncSection) {
						context.activeSection = context.maximumAllowedSyncSection;
					}

					if (context.activeSection  < context.sections.length) {
						context.sections[context.activeSection].active = true;
						context.sections[context.activeSection].editable = true;
					}

				}

				this.set(keypath + '.context', context);

				return false;
			});

			// functions of the link in an editable section title
			this.on('*.stepAccordionShowContent stepAccordionShowContent', function (event) {

				event.original.preventDefault();

				var context = event.context.stepAccordionConfig.context,
					keypath = event.context.stepAccordionConfig.keypath;

				context.previousSection = context.activeSection;
				if (context.previousSection < context.sections.length) {
					context.sections[context.previousSection].active = false;
				}
				context.activeSection = event.index.index;
				context.sections[context.activeSection].active = true;

				this.set(keypath + '.context', context);

				return false;
			});
		}
	});

	var uxRelatedContent = Ractive.extend({
		template: partials.uxRelatedContent
	});

	var uxSwitch = Ractive.extend({
		template: partials.uxSwitch,

		onrender: function () {

			// toggle switch
			this.on('*.toggleSwitch toggleSwitch', function(event) {
				var disabled = this.get('datamodel.datamodel.disabled');
				if (!disabled){
					event.original.preventDefault();
					this.toggle(event.context.keypath);
				}
			});
		}

	});

	var uxExtendedCheckbox = Ractive.extend({
		template: partials.uxExtendedCheckbox
	});

	var uxEllipsis = Ractive.extend({
		template: partials.uxEllipsis,

		reRenderContent: function() {
			var content = $(this.el).find('.ellipsisContent').html(),
				$small = $(this.el).find('.ellipsis.show-for-small'),
				$large = $(this.el).find('.ellipsis.show-for-medium-up');

			// if the last character of the string is a comma then remove it and ensure all commas have a space after
			content = content.trim().replace(/,$/, '').replace(/,[ ]*/g, ',').split(',').join(', ');

			// add the 3 to make space for the ellipsis
			var length = $small.data('length');
			if (content.length > length + 3) {
				$small.html(content.substring(0, length) + '&hellip;');
			} else {
				$small.html(content);
			}
			length = $large.data('length');
			if (content.length > length + 3) {
				$large.html(content.substring(0, length) + '&hellip;');
			} else {
				$large.html(content);
			}
		},
		onchange: function() {
			_.defer(function () {
				this.reRenderContent();
			}.bind(this));
		},
		onrender: function () {
			this.reRenderContent();			
		}

	});

	/**
	 * Use QAS to optionally autocomplete an address.
	 * TODO Consider what to do with the "value" token.
	 * TODO Needs to be WCAG accessible.
	 */
	var uxAddressAutoComplete = Ractive.extend({

		template: partials.uxAutoComplete,

		data: {
			// This uses the "new" autocomplete endpoint, same as SQTool.
			// According to Julien there's no clear direction on using old/new endpoints.
			// This autocomplete is more accurate.
			url: '/ServiceAddressAutoComplete/qassearch',
			delay: 500,
			minChars: 3,
			selectedIndex: 0,
			options: []
		},

		events: {
			uparrow: RactiveEventsKeys.uparrow,
			downarrow: RactiveEventsKeys.downarrow,
			enter: RactiveEventsKeys.enter,
			space: RactiveEventsKeys.space
		},

		onrender: function () {

			var promise;
			var delayedSearch;

			var inputElement = this.find('input');
			var acElement = this.find('.autocomplete-suggestive-text');

			// Will work for touch events also.
			$('html').on('click', function (event) {

				if (this.get('options').length === 0) {
					// Not showing the autocomplete UI, ignore.
					return;
				}

				if ($.contains(acElement, event.target)) {
					// Click was inside the ac, ignore.
					return;
				}

				// Clearing the options hides the UI.
				this.set('options', []).then(function () {
					this.scrollToWidgetTop(inputElement.parentNode, 'fast');
				}.bind(this));

			}.bind(this));

			this.on('newUserInput', function (event) {

				clearTimeout(delayedSearch);

				if (event.node.value.length < this.get('minChars')) {
					return;
				}

				// Down, Up, Enter = skip. Every other key (e.g. backspace), allow to trigger.
				// FIXME If using RactiveEventsKeys, why can't I exclude them from keyup? keypress not good enough.
				if (_.includes([ 40, 38, 13 ], event.original.which)) {
					return;
				}

				// Add a small delay to avoid making XHR until User's input pauses.
				delayedSearch = setTimeout(function () {

					// Abort existing request and start a new one.
					if (promise) {
						promise.abort();
					}

					promise = $.ajax({
						url: this.get('url'),
						data: {
							DataId: 'AUG',
							UserInput: event.node.value
						},
						dataType: 'json'
					});

					promise.done(function (response) {

						// Always get rid of the zero-eth item "Use entered address: 1 lyon"
						response.shift();
						this.set('options', response).then(function () {
							this.scrollToWidgetTop(acElement, 'fast');
						}.bind(this));

					}.bind(this));

					promise.fail(function () {
						// (Almost) silently fail.
						console.error('uxAddressAutoComplete: Cannot reach QAS endpoint.');
					});

				}.bind(this), this.get('delay'));

			});

			this.on('selectOption', function (event) {

				this.set({
					// Set the field value.
					value: event.context.name,
					token: event.context.value,
					// Clear out the current options.
					options: []
				}).then(function () {
					this.scrollToWidgetTop(inputElement.parentNode, 'fast');
				}.bind(this));

				return false;

			});

			// For keyboard driven UI.
			this.on('selectCurrentOption', function (event) {
				var currentIndex = this.get('selectedIndex');

				this.set({
					value: this.get('options')[currentIndex].name,
					token: this.get('options')[currentIndex].value,
					options: []
				}).then(function () {
					this.scrollToWidgetTop(inputElement.parentNode, 'fast');
				}.bind(this));
			});

			this.on('nextOption', function (event) {

				var selectedIndex = this.get('selectedIndex');

				if ((selectedIndex + 1) === this.get('options').length) {
					// Past the post - go no further!
					return;
				}

				this.set('selectedIndex', selectedIndex + 1).then(function () {
					// FIXME Move focus instead (accessibility).
					// var selectedElement = this.find('.selected');
					// this.scrollToWidgetTop(selectedElement, 'fast');
				}.bind(this));

			});

			this.on('prevOption', function (event) {

				var selectedIndex = this.get('selectedIndex');

				if (selectedIndex === 0) {
					// Past the post - go no further!
					return;
				}

				this.set('selectedIndex', selectedIndex - 1).then(function () {
					// FIXME Move focus instead (accessibility).
					// var selectedElement = this.find('.selected');
					// this.scrollToWidgetTop(selectedElement, 'fast');
				}.bind(this));

			});

		}

	});

    var Modal = Ractive.extend({
    	template: partials.Modal,

		data: {
			showCloseIcon: true
		},
		
    	onrender: function () {
			var self = this;

			this.on('doCloseModal', function () {
				this.set('displayState', false);
			});

			/*
			 * when the display state change ensure the keypress event is setup and focus is given correctly
			 */
			this.observe('displayState', function () {
				if (!self.get('displayState')) {
					window.removeEventListener( 'keydown', self.modalKeydownHandler, false );
					var requestElement = self.get('modalRequestElement');
					if (requestElement) {
						$(requestElement).focus();
					}
					return;
				}

				// ensure the modal content is rendered
				_.defer(function () {
					// only one modal visible at a time
					var modalElements = $(self.el).find('.modal:visible')
						.find(ConfigStrings.constants.FOCUSABLE_ELEMENTS.join(', ')).filter(':visible');
					if (modalElements.length > 1) {
						// if the modal window has focusable elements inside the modal window
						modalElements.eq(1).focus();
					} else if (modalElements.length > 0) {
						// otherwise focus on the close icon which always exists
						modalElements.eq(0).focus();
					}
					// trap keydown events (with tabs) until modal is hidden
					window.addEventListener( 'keydown', self.modalKeydowHandler = function(event) {
						if (event.keyCode === ConfigStrings.constants.KEYS.ESCAPE) {
							self.set('displayState', false);
							return true;
						}
						if (event.keyCode !== ConfigStrings.constants.KEYS.TAB) {
							return true;
						}
						// check current target is one of the modal elements (currently visible)
						var modalElements = $(self.el).find('.modal:visible')
							.find(ConfigStrings.constants.FOCUSABLE_ELEMENTS.join(', ')).filter(':visible');
						var currentIndex = modalElements.index(event.target);
						if (currentIndex > -1) {
							var lastModalElementIndex = modalElements.length - 1;
							if (event.shiftKey) {
								if (currentIndex === 0) {
									modalElements.eq(lastModalElementIndex).focus();
								} else {
									modalElements.eq(currentIndex - 1).focus();
								}
							} else {
								if (currentIndex === lastModalElementIndex) {
									modalElements.eq(0).focus();
								} else {
									modalElements.eq(currentIndex + 1).focus();
								}
							}
							event.preventDefault();
							return false;
						}
						return true;
					}, false );
				});
			});

			this.on('teardown', function () {
				window.removeEventListener( 'keydown', self.keydownHandler, false );
			});
		}
    });

    return Ractive.extend({

		// TODO What about calling

    	// FIXME This breaks Zombie, but we need to understand exactly what's going on here.
    	// @see directDebit_account_lvl_already_setup.json is what caused this initially.
        // debug: true,

        components: {
            TabsArea: TabsArea,
            Modal: Modal,
			uxNestedButtonsGroup: uxNestedButtonsGroup,
			uxCarouselSelector: uxCarouselSelector,
			uxStepAccordion: uxStepAccordion,
			uxRelatedContent: uxRelatedContent,
			uxSwitch: uxSwitch,
			uxExtendedCheckbox: uxExtendedCheckbox,
			uxEllipsis: uxEllipsis,
			uxAddressAutoComplete: uxAddressAutoComplete,
			rcontainer: Ractive.extend({template: partials.TabsPane}),
            rcheckbox: Ractive.extend({template: partials.rcheckbox})
        },

		transitions: transitions,

		decorators: decorators,

		// Include for all widgets.
		events: {
			uparrow: RactiveEventsKeys.uparrow,
			downarrow: RactiveEventsKeys.downarrow,
			enter: RactiveEventsKeys.enter,
			space: RactiveEventsKeys.space
		},

		toggleContainer: function (event, targetId) {
			event.original.preventDefault();
			_(this.findAllComponents('rcontainer'))
					.filter(function (container) {
						return container.data.id === targetId;
					})
					.value()
					.pop()
					.toggle('active');
		},

		reloadPage: function (event) {
			event.original.preventDefault();
			window.location.reload();
		},


		toggleCheckbox: function (event) {
			event.original.preventDefault();
			event.component.toggle('checked');
			this.toggle(event.context.toggleKeypath);
			if (event.context.errorKeypath) {
				this.set(event.context.errorKeypath, !this.get(event.context.toggleKeypath));
			}
		},

		/**
		 * Used when emulating radios using OSG html (label, span, etc).
		 *
		 * Optionally converts data-value="true|false" to boolean.
		 * These "Radios" can be "true|false" boolean strings, or else they can be any old string.
		 *
		 * @param event Ractive wrapped event.
		 * @param keypath String representing the keypath to change.
		 */
		toggleRadioButton: function (event, keypath) {

			event.original.preventDefault();

			// TODO Move to utility function?
			var newValue = event.node.dataset.value.trim();
			newValue = 'true' === newValue ? true : newValue;
			newValue = 'false' === newValue ? false : newValue;

			this.set(keypath, newValue);

		},

		toggleKeypath: function (event, keypaths) {

			// FIXME foundation.forms.js needs further investigation because it's causing both radio buttons to be
			// visually marked as "checked". For now, we bypass the issue by stopping the event bubbling from reaching
			// foundation forms in the first place!

			event.original.preventDefault();

			_.forEach(keypaths.split(','), function (keypath) {
				this.toggle(keypath);
			}, this);

		},

		onconfig: function () {

			this.on('toggleContainer', this.toggleContainer);
			this.on('*.toggleContainer', this.toggleContainer);

			this.on('reloadPage', this.reloadPage);
			this.on('*.reloadPage', this.reloadPage);

			this.on('toggleCheckbox', this.toggleCheckbox);
			this.on('*.toggleCheckbox', this.toggleCheckbox);

			this.on('doToggleKeypath', this.toggleKeypath);
			this.on('*.doToggleKeypath', this.toggleKeypath);

			this.on('doToggleRadioButton', this.toggleRadioButton);
			this.on('*.doToggleRadioButton', this.toggleRadioButton);

		},

		// add the current browser related class to <html> tag
		// this helps in specific browser related CSS customization
		addBrowserClasses: function() {
			var browsers = [
				'ios',
				'iphone',
				'ipad',
				'android',
				'chrome',
				'safari',
				'firefox',
				'opera',
				'msie',
				'msedge',
				'phantom',
				'mobile',
				'tablet'
			];

			var browsersList = _.filter(browsers, function(browser) {
				return bowser[browser];
			}).join(' ');

			$('html').addClass(browsersList);
		},

		onrender: function() {
			this.addBrowserClasses();
		},

		oca: {

			/**
			 * Compact object by removing falsey properties. Important for filtering.
			 * @param object POJO.
			 * @return {Object} Compacted object.
			 */
			compactObject: function (object) {
				_.forEach(object, function(v, k) {
					if (!v) {
						delete object[k];
					}
				});
				return object;
			},

			bindExternalJavaScript: function(el) {
				bindExternalJavaScript(el);
			},

			// Hack for now to get parent. Waiting merge of change for ractive to suppport this
			// https://github.com/ractivejs/ractive/pull/1580
			keyPathGetParent: function(keypath) {
				var splitKeypath = keypath.split('.');
				splitKeypath.pop();
				return splitKeypath.join('.');
			},

			sync: function (params) {

				var self = this;

				var dfr = $.Deferred();

				params.widget.set('inProgress', true);

				var fallBackType = (params.data) ? 'POST' : 'GET';

				var options = {
					data : (params.data) ? params.data : null,
					type : (params.type) ? params.type : fallBackType
				};

				var handleSuccess = function (response) {

					var dfr = this.dfr,
						widget = this.widget,
						helpers = this.helpers;

					var pool = [
						widget.reset(response),
						widget.set('inProgress', false),
						widget.set('helpers', helpers)
					];

					$.when.apply($, pool).done(function () {
						dfr.resolve(response);
					}).fail(function () {
						dfr.reject(response);
					});

				};

				var handleFailure = function (res) {

					var dfr = this.dfr,
						widget = this.widget,
						helpers = this.helpers,
						parseJSON = this.parseJSON;

					var resData = res;

					if (resData.responseText) {
						resData = parseJSON(resData.responseText);
					}

					if (widget && widget.validation) {
						var errors = widget.validation.findValidationErrorsInResponse(resData).value();
						if (errors) {
							dfr.reject(errors);
						}
					}

					var dataModelUpdatePromise = (resData.viewName) ?
						widget.reset(resData) : widget.set(resData);

					var pool = [
						dataModelUpdatePromise,
						widget.set('inProgress', false),
						widget.set('helpers', helpers)
					];

					$.when.apply($, pool).then(function () {
						// We reject promise here deliberately
						// as we are inside fail callback already
						// so consumers down the pipe can use fail callback
						// Better idea ?
						dfr.reject(resData);
					});

				};

				var context = {
					dfr : dfr,
					widget : params.widget,
					helpers: params.widget.data.helpers,
					parseJSON : self.parseJSON
				};

				var boundHandleSuccess = _.bind(handleSuccess, context);
				var boundHandleFailure = _.bind(handleFailure, context);

				return this.query(params.url, options)
					.done(boundHandleSuccess)
					.fail(boundHandleFailure);

			},

			query: function (url, params) {

				if (!url) {
					throw new Error('url not found');
				}

				// FIXME: This is only required for the working with local test mocks
				// this logic should be moved outside of the framework to the server side

				var unwrapIfMocked = function (response) {
					// this is to work with the local mocks, they have different structure.
					var result = response;
					if (response._data) {
						result = response._data.serviceDataLis || response._data;
						return ;
					}
					return result;
				};


				var handleSessionTimeout = function (data, textStatus, jqXHR, success) {
					var dfr = $.Deferred();

					var resolveWith = (success) ? data : jqXHR;

					var getResponseHeader = jqXHR.getResponseHeader || data.getResponseHeader;

					if (!getResponseHeader) {
						dfr.resolve(jqXHR);
					}

					var redirectUrl = getResponseHeader('SESSION_TIMEOUT_REDIRECT_URL');

					if (redirectUrl) {
						window.location.replace(redirectUrl);
						dfr.reject(jqXHR);
					} else {
						dfr.resolve(resolveWith);
					}

					return dfr.promise();
				};


				var postProcess = function (response) {
					// chaining post processing functions with _.map, nice and easy
					return _([response])
							.map(unwrapIfMocked)
							.value()
							.pop();
				};

				var requestParams = _.extend({
					url: url,
					cache: false,
					dataType: 'json postProcess',
					isOkStatus: function (res) {
						return res.status === 'ok' || res.status === 'success' ||
							res.status === 'inprogress' || res.status === 200;
					},
					converters: {
						// do custom post processing if needed
						'json postProcess': postProcess
					}
				}, params);


				return $.ajax(requestParams)
						// Pav 2Mar15
						// Success and fail callbacks in .fail method have different signatures
						// see http://api.jquery.com/jquery.ajax/
						// below is to solve it
						.then(function (data, textStatus, jqXHR) {
							return handleSessionTimeout(data, textStatus, jqXHR, true);
						}, function (jqXHR, textStatus, errorThrown) {
							return handleSessionTimeout(errorThrown, textStatus, jqXHR);
						})
						.then(function (res) {

							var dfr = $.Deferred();

							if (requestParams.isOkStatus(res)) {
								dfr.resolve(res);
							} else {
								dfr.reject(res);
							}

							return dfr.promise();
						});

			},

			parseJSON: function (jsonString) {
				try {
					// http://stackoverflow.com/a/20392392
					var o = JSON.parse(jsonString);
					if (o && typeof o === 'object' && o !== null) {
						return o;
					}
				}
				catch (e) {
					console.error(e, jsonString);
					throw new Error('Failed to parse JSON');
				}
				return false;
			},

			/**
			 * Ractive re-write of the once jQuery plugin.
			 * Clicks elements on a page based on the hash passed to the page.
			 * @param widget Ractive instance
			 * @param options Plugin options
			 */
			clickByHashValue: function (widget, options) {

				var self = this;

				options = _.extend({
					selector: '[data-filter-name]',
					specValueKey: 'data-filter-target-spec-value',
					hash: window.location.hash,
					bSplitHash: true
				}, options || {});

				// Trim the initial String.
				var hash = str.trim(options.hash);

				// Don't bother with executing if no hash.
				if (hash.length === 0) {
					return;
				}

				var hashValues = options.bSplitHash ? hash.substr(1).split('-') : hash.substr(1).split();

				hashValues = _.map(hashValues, function (value) {
					return value.toLowerCase();
				});

				var elements = widget.findAll(options.selector);

				if (elements.length) {
					self.clickByAttribute(elements, options.specValueKey, hashValues);

					// Lets check if any new elements have been rendered after the first round of clicks.
					// If so reapply the hash clicks.
					_.defer(function (self, widget, elements) {
						var newElements = widget.findAll(options.selector);
						if (newElements.length > elements.length) {
							self.clickByAttribute(newElements, options.specValueKey, hashValues);
						}
					}, self, widget, elements);
				}

			},

			clickByAttribute: function (elements, attribute, attributeList) {
				if (!elements.length) {
					return;
				}

				_.forEach(elements, function (element) {
					var attr = element.getAttribute(attribute).toLowerCase();
					if (_.indexOf(attributeList, attr) !== -1) {
						// Wait til stack has cleared to execute event.
						// If this is called on render, this will allow ractive
						// to pick up the event
						_.defer(function (element) {
							// Fire a click event on the node.
							simulant.fire(element, 'click');
						}, element);
					}
				});
			},

			/**
			 * This could inevitably exhaust the stack if the element is nested far away from
			 * the parent you are trying to reach
			 * @param node
			 * @param selector
			 * @returns {*}
			 */
			findClosestParent: function (node, selector) {
				if (!node.parentNode) {
					return false;
			}

				var parent = node.parentNode;
				var matchFunction;
				if ('matchesSelector' in parent) {
					matchFunction = 'matchesSelector';
				} else if ('matches' in parent) {
					matchFunction = 'matches';
		}

				if (matchFunction) {
					if (parent[matchFunction](selector)) {
						return parent;
					} else {
						return this.findClosestParent(node.parentNode, selector);
					}
				} else {
					// Neither matches or matchesSelector are available. Probably IE8.
					// Fallback
					return $(node).parents(selector);
				}

			}
		}
	});

});
