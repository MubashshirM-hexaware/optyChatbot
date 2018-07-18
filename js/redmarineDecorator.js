define([], function () {

	/**
	 * Reference for writing Decorator Plugins in ractivejs
	 * http://docs.ractivejs.org/latest/writing-decorator-plugins
	 */

	/**
	 * Will set the height as defined from the template
	 */
	var heightDecorator = function ( node, height ) {
		if (!!height) {
			node.style.height = height;
		}
		return {
			teardown: function () {}
		};
	};

	/**
	 * Will set the width as defined from the template
	 */
	var widthDecorator = function ( node, width ) {
		if (!!width) {
			node.style.width = width;
		}
		return {
			teardown: function () {}
		};
	};

	/**
	 * Will set the margin as defined from the template
	 */
	var marginDecorator = function ( node, top, right, bottom, left ) {
		if (!!top && top !== 'auto') {
			node.style.marginTop = top;
		}
		if (!!right && right !== 'auto') {
			node.style.marginRight = right;
		}
		if (!!bottom && bottom !== 'auto') {
			node.style.marginBottom = bottom;
		}
		if (!!left && left !== 'auto') {
			node.style.marginLeft = left;
		}
		return {
			teardown: function () {}
		};
	};

	/**
	 * Will set the left position and width as defined from the template
	 * Is required to apply the two styles to sticky headers
	 */
	var leftAndWidthDecorator = function ( node, left, width ) {
		if (!!width) {
			node.style.width = width;
		}
		if (!!left) {
			node.style.left = left;
		}
		return {
			teardown: function () {}
		};
	};

	/**
	 * Has a dependency on the height set in the widget data
	 * Widget should have
	 *		data {
	 *			equalizerHeights: {
	 *				xxx: 'auto'
	 *			}
	 *		}
	 *
	 * Where xxx maps in the template as
	 * 	<div data-equalizer-listener="xxx" decorator="equalizer">
	 * This will only work the once as the ractive template does not identify when the heights are changed
	 */
	var equalizerDecorator = function ( node ) {
		if (this.data.equalizerHeights &&
			node.dataset.equalizerListener &&
			this.data.equalizerHeights[node.dataset.equalizerListener]) {
				node.style.height = this.data.equalizerHeights[node.dataset.equalizerListener];
		}
		return {
			teardown: function () {}
		};
	};

	return {
		equalizer: equalizerDecorator,
		height: heightDecorator,
		margin: marginDecorator,
		width: widthDecorator,
		leftAndWidth: leftAndWidthDecorator
	};
});
