define(['jquery'], function ($) {

	/**
	 * Reference for writing Transition Plugins in ractivejs
	 * http://docs.ractivejs.org/latest/writing-transition-plugins
	 * Overview of this plugin file.
	 * https://wiki.express.optus.com.au/x/sQ8wB
	 */

	return {
		/**
		 * slideToggle transition helper. Replaces the need for custom jQuery.
		 * e.g. <span intro-outro="slideToggle:{duration:'fast'}" />
		 * @param transition
		 * @param params
		 */
		slideToggle: function (transition, params) {

			var defaults = {
				duration: 400
			};

			params = transition.processParams(params, defaults);

			if (transition.isIntro) {
				$(transition.node)
					.hide()
					.slideDown(params.duration, function () {
						transition.complete();
					});
			} else {
				$(transition.node)
					.slideUp(params.duration, function () {
						transition.complete();
					});
			}

		}
	}
});
