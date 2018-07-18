define(['underscore', 'jquery'], function (_, $) {

	/**
	 * Will set the equalizerHeights object to max height of a list of elements
	 * where these elements are selected using the equalizeHeights key to group the elements
	 *
	 * Note: new plugins must be configured in
	 *		/OnePortal-FrontEnd/vault/yellowSubmarine/opfiles/ys/javascripts/source/app/modulesConfig.js
	 */

	var Equalizer = function () {};

	Equalizer.prototype = {

		defaultHeight: 'auto',

		/**
		 * calculate the max height for all elements on the page with an equalizer height setup
		 */
		equalize: function (container, equalizeHeights, ractive) {

			_.each(equalizeHeights, function(index, key) {
				var listeners = $(container).find('[data-equalizer-listener="' + key + '"]');

				var setMaxHeight = function () {
					if (listeners.length > 0) {
						var max = _.max(listeners, function(listener) {
							return listener.clientHeight;
						});
						return equalizeHeights[key] = max.clientHeight + 'px';
					}
				};

				//if listners has image wait for them to load
				var images = $(listeners).find('img');
				if (images.length) {
					var counter = 0;
					_.each(images, function (image) {
						//if images are present and not already loaded
						if (!image.complete) {
							image.onload = function () {
								counter++;
								if (images.length === counter) {
									equalizeKeyHeights = setMaxHeight();
									if (ractive) {
										ractive.set('equalizerHeights.' + key, equalizeKeyHeights);
									}
								}
							};
						} else {
							setMaxHeight();
						}
					});
				} else {
					setMaxHeight();
				}
			});

			return equalizeHeights;
		},

		/**
		 * setup a default height for all elements on the page with data-equalizer-listener
		 */
		reset: function (container, equalizeHeights) {
			var self = this;
			var elements = $(container).find('[data-equalizer-listener]');
			_.each(elements, function(element) {
				equalizeHeights[$(element).attr('data-equalizer-listener')] = self.defaultHeight;
			});

			return equalizeHeights;
		}

	};

	return Equalizer;
});
