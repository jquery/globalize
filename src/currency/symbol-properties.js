define([
	"./supplemental-override",
	"../number/numbering-system",
	"../util/regexp/not-s",
	"../util/regexp/not-s-and-z"
], function( currencySupplementalOverride, numberNumberingSystem, regexpNotS, regexpNotSAndZ ) {

/**
 * symbolProperties( currency, cldr )
 *
 * Return pattern replacing `¤` with the appropriate currency symbol literal.
 */
return function( currency, cldr, options ) {
	var currencySpacing, pattern, symbol, symbolEntries,
		regexp = {
			"[:digit:]": /\d/,
			"[:^S:]": regexpNotS,
			"[[:^S:]&[:^Z:]]": regexpNotSAndZ
		};

	if ( options.style === "code" ) {
		symbol = currency;
	} else {
		symbolEntries = [ "symbol" ];

		// If options.symbolForm === "narrow" was passed, prepend it.
		if ( options.symbolForm === "narrow" ) {
			symbolEntries.unshift( "symbol-alt-narrow" );
		}

		symbolEntries.some(function( symbolEntry ) {
			return symbol = cldr.main([
				"numbers/currencies",
				currency,
				symbolEntry
			]);
		});
	}

	currencySpacing = [ "beforeCurrency", "afterCurrency" ].map(function( position ) {
		return cldr.main([
			"numbers",
			"currencyFormats-numberSystem-" + numberNumberingSystem( cldr ),
			"currencySpacing",
			position
		]);
	});

	pattern = cldr.main([
		"numbers",
		"currencyFormats-numberSystem-" + numberNumberingSystem( cldr ),
		options.style === "accounting" ? "accounting" : "standard"
	]);

	pattern =

		// The number of decimal places and the rounding for each currency is not locale-specific.
		// Those values are overridden by Supplemental Currency Data.
		currencySupplementalOverride( currency, pattern, cldr )

		// Replace "¤" (\u00A4) with the appropriate symbol literal.
		.split( ";" ).map(function( pattern ) {

			return pattern.split( "\u00A4" ).map(function( part, i ) {
				var currencyMatch = regexp[ currencySpacing[ i ].currencyMatch ],
					surroundingMatch = regexp[ currencySpacing[ i ].surroundingMatch ],
					insertBetween = "";

				// For currencyMatch and surroundingMatch definitions, read [1].
				// When i === 0, beforeCurrency is being handled. Otherwise, afterCurrency.
				// 1: http://www.unicode.org/reports/tr35/tr35-numbers.html#Currencies
				currencyMatch = currencyMatch.test( symbol.charAt( i ? symbol.length - 1 : 0 ) );
				surroundingMatch = surroundingMatch.test(
					part.charAt( i ? 0 : part.length - 1 ).replace( /[#@,.]/g, "0" )
				);

				if ( currencyMatch && part && surroundingMatch ) {
					insertBetween = currencySpacing[ i ].insertBetween;
				}

				return ( i ? insertBetween : "" ) + part + ( i ? "" : insertBetween );
			}).join( "\u00A4" );
		}).join( ";" );

	return {
		pattern: pattern,
		symbol: symbol
	};
};

});
