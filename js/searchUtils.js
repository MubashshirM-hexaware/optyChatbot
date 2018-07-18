define([], function () {

	/*constructing string for canonical url*/
	function canonicalURL(value) {
		return value.replace('/','or').replace(/[^a-z0-9\s]/gi, '')
			.replace(/[_\s]/g, '-').replace('--','-').toLowerCase();
	}

	function urlConstruction(item, baseUrl) {

		var value = item.responseObject.value;

		return baseUrl + '/' + canonicalURL(value) + '?' +
			'answerId=' + encodeURIComponent(item.responseObject.secret) +
			'&question=' + encodeURIComponent(value) +
			'&typeId=8';

	}

	/**
	 * this is bound to current widget calling this function.
	 */
	function updateAutoSuggestUrls(items) {

		var results = _.map(items, function (item) {

			if (item.groupIndex === 0) {
				_.forEach(item.options, function(option) {
					var baseUrl = this.ractive.get('controllerModel.urlMap.answerPageURL');
					if (baseUrl) {
						option.url = urlConstruction(option, baseUrl);
					}
				}.bind(this));
			}
			else if (item.groupIndex === 1) {
				_.forEach(item.options, function(option) {
					option.url = option.responseObject.CANONICAL_URL || option.responseObject.DREREFERENCE || option.responseObject.reference;
				});
			}

			return item;

		}.bind(this));

		return this.ractive.set('autosuggestResult', results);
	}

	/**
		on select of autosuggest submit the form or update windows href
	*/
	function onSelectOfAutosuggestValue(selectedValue, item) {
		// prepare the URL for IR
		if (item.groupIndex === 0) {
			var baseUrl = this.ractive.get('controllerModel.urlMap.answerPageURL');
			if (baseUrl) {
				window.location.href = urlConstruction(item, baseUrl);
			}
			else {
				this.ractive.find('form').submit();
			}
		}
		else if (item.responseObject.CANONICAL_URL) {
			window.location.href = item.responseObject.CANONICAL_URL;
		}
		else {
			this.ractive.find('form').submit();
		}
	}

	// Exported API
	return {
		updateAutoSuggestUrls: updateAutoSuggestUrls,
		onSelectOfAutosuggestValue: onSelectOfAutosuggestValue,
		ajaxSubmitSupportSearch: function (ractive) {
			var ajax = ractive.oca.query(ractive.get('readUrl'), {
				dataType: 'json',
				data: {question: ractive.get('searchValue')}
			});
			ajax.done(function (data) {
				if (data.submitUrl) {
					window.location.href = data.submitUrl;
				} else {
					ractive.find('form').submit();
				}
			}).fail(function (err) {
				console.error(err);
			});
		}
	};

});