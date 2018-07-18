define(['underscore'], function (_) {

	return {

		brandsList: [
			{
				name: 'Apple',
				friendlyName: 'Apple'
			},
			{
				name: 'Bberry',
				friendlyName: 'Blackberry'
			},
			{
				name: 'HTC',
				friendlyName: 'HTC'
			},
			{
				name: 'Huawei',
				friendlyName: 'Huawei'
			},
			{
				name: 'LG',
				friendlyName: 'LG'
			},
			{
				name: 'Motorola',
				friendlyName: 'Motorola'
			},
			{
				name: 'Nokia',
				friendlyName: 'Nokia'
			},
			{
				name: 'Samsung',
				friendlyName: 'Samsung'
			},
			{
				name: 'Sony',
				friendlyName: 'Sony'
			}
		],

		constants: {
			PLANSELECTOR: {
				RECONTRACT: 'RECONTRACT',
				PREPAY_TO_POSTPAY: 'PREPAY_TO_POSTPAY',
				CONTRACT: 'CONTRACT'
			},
			BYTECONVERSIONMATRIX : {
				FIXED: {
					gb: 1048576000,
					mb: 1048576,
					kb: 1024
				},
				DEFAULT: {
					gb: 1073741824,
					mb: 1048576,
					kb: 1024
				}
			},
			COMMUNITY_FEED: {
				TYPE: {
					SIMPLE: 'simple',
					EXPANDED: 'expanded',
					INTERACTIVE: 'interactive'
				}
			},
			SQTOOL: {
				TARGET: 'div[data-controller = "SqToolController"]'
			},
			CHARGE_TYPE: {
				UPFRONT: 'ONETIME',
				MONTHLY: 'MONTHLY'
			},
			OFFLINE_ORDER_STATUS: 'onlineOfflineOrder',
			BUNDLE: {
				BROADBAND: 'broadband',
				TELEPHONY: 'telephony',
				ENTERTAINMENT: 'fetchTv',
				TERMS: 'terms',
				SETUP: 'setup',
				DISCOUNTS: 'discounts',
				TECHNOLOGY: {
					DEFAULT: 'default',
					OWB: 'OWB',
					FBB: 'FBB',
					FTTN: 'FTTN',
					FTTB: 'FTTB',
					UDSL: 'UDSL',
					LAU: 'LAU',
					LAUP: 'LAUP'
				},
				GROUP_TYPE: {
					SPEEDPACKS: 'speedPack',
					FETCHTV: 'fetchTv',
					CHANNEL_SUBSCRIPTION: 'channelSubscription',
					EPL: 'epl',
					STARTUP: 'startUp',
					SETUP: 'setup',
					DELIVERY_FEE: 'deliveryFee',
					NEW_NUMBER: 'newNumber',
					DISCOUNTS: 'discounts',
					DEV_CHARGES: 'devCharges',
					CND: 'CND',
					LISTEDUNLISTED: 'listedUnlisted'
				}
			},
			RELOCATION: {
				TRACKING_FORM_SUCCESS: 'Step5Sccs',
				TRACKING_FORM_ERROR: 'Step5Fail'
			},
			REWARDS: {
				REWARDS_USER: 'RewardsUser',
				PWD_MIN_LENGTH: 8,
				PWD_MAX_LENGTH: 15
			},
			PRODUCT_TYPE: {
				HWBB: 'HWBB'
			},
			CALLTOACTION: {
				CHECK_AVAILABILITY: 'CHECK_AVAILABILITY',
				BUY_NOW: 'BUY_NOW',
				NOT_AVAILABLE: 'NOT_AVAILABLE'
			},
			KEYS: {
				ENTER: 13,
				TAB: 9,
				ESCAPE: 27,
				SPACE: 32,
				LEFT_ARROW: 37,
				RIGHT_ARROW: 39,
				DOWN_ARROW: 40,
				UP_ARROW: 38
			},
			FOCUSABLE_ELEMENTS: [
				'a[href]',
				'input:not([disabled])',
				'select:not([disabled])',
				'textarea:not([disabled])',
				'button:not([disabled])',
				'*[tabindex=0]:visible',
				'iframe'
			],
			MAXNTDPORTS: 4
		},

		contractLength: {
			defaultContractlength: 24
		}

	};

});
