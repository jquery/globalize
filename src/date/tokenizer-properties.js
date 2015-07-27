define([
	"./month-names",
	"./pattern-re",
	"../common/create-error/unsupported-feature",
	"../number/symbol",
	"../gdate/calendar-for-locale"
], function( dateMonthNames, datePatternRe, createErrorUnsupportedFeature,
	numberSymbol, gdateCalendarForLocale ) {

/**
 * tokenizerProperties( pattern, cldr )
 *
 * @pattern [String] raw pattern.
 *
 * @cldr [Cldr instance].
 *
 * Return Object with data that will be used by tokenizer.
 */
return function( pattern, cldr ) {
	var properties = {
			pattern: pattern,
			timeSeparator: numberSymbol( "timeSeparator", cldr ),
			calendar: gdateCalendarForLocale( cldr )
		},
		widths = [ "abbreviated", "wide", "narrow" ];

	function populateProperties( path, value ) {

		// The `dates` and `calendars` trim's purpose is to reduce properties' key size only.
		properties[ path.replace( /^.*\/dates\//, "" ).replace( /calendars\//, "" ) ] = value;
	}

	cldr.on( "get", populateProperties );

	pattern.match( datePatternRe ).forEach(function( current ) {
		var chr, key, length;

		chr = current.charAt( 0 ),
		length = current.length;

		if ( chr === "Z" && length < 5 ) {
				chr = "O";
				length = 4;
		}

		switch ( chr ) {

			// Era
			case "G":
				cldr.main([
					"dates/calendars",
					properties.calendar,
					"eras",
					length <= 3 ? "eraAbbr" : ( length === 4 ? "eraNames" : "eraNarrow" )
				]);
				break;

			// Year
			case "u": // Extended year. Need to be implemented.
			case "U": // Cyclic year name. Need to be implemented.
				throw createErrorUnsupportedFeature({
					feature: "year pattern `" + chr + "`"
				});

			// Quarter
			case "Q":
			case "q":
				if ( length > 2 ) {
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"quarters",
						chr === "Q" ? "format" : "stand-alone",
						widths[ length - 3 ]
					]);
				}
				break;

			// Month
			case "M":
			case "L":
				// number l=1:{1,2}, l=2:{2}.
				// lookup l=3...
				if ( length > 2 ) {
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"months",
						chr === "M" ? "format" : "stand-alone",
						widths[ length - 3 ]
					]);
					// Augment the month names with the leap month names
					key = [
						properties.calendar,
						"months",
						chr === "M" ? "format" : "stand-alone",
						widths[ length - 3 ]
					].join( "/" );
					properties[key] = dateMonthNames (
						properties[key],
						chr,
						length,
						properties.calendar,
						cldr
					);
				} else {
					// record the possible expansiond for numeric months
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"monthPatterns/numeric/all"
					]);
				}
				break;

			// Day
			case "g":
				// Modified Julian day. Need to be implemented.
				throw createErrorUnsupportedFeature({
					feature: "Julian day pattern `g`"
				});

			// Week day
			case "e":
			case "c":
				// lookup for length >=3.
				if ( length <= 2 ) {
					break;
				}

			/* falls through */
			case "E":
				if ( length === 6 ) {
					// Note: if short day names are not explicitly specified, abbreviated day
					// names are used instead http://www.unicode.org/reports/tr35/tr35-dates.html#months_days_quarters_eras
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						"short"
					]) || cldr.main([
						"dates/calendars",
						properties.calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						"abbreviated"
					]);
				} else {
					cldr.main([
						"dates/calendars",
						properties.calendar,
						"days",
						[ chr === "c" ? "stand-alone" : "format" ],
						widths[ length < 3 ? 0 : length - 3 ]
					]);
				}
				break;

			// Period (AM or PM)
			case "a":
				cldr.main([
					"dates/calendars",
					properties.calendar,
					"dayPeriods/format/wide"
				]);
				break;

			// Zone
			case "z":
			case "O":
				cldr.main( "dates/timeZoneNames/gmtFormat" );
				cldr.main( "dates/timeZoneNames/gmtZeroFormat" );
				cldr.main( "dates/timeZoneNames/hourFormat" );
				break;

			case "v":
			case "V":
				throw createErrorUnsupportedFeature({
					feature: "timezone pattern `" + chr + "`"
				});
		}
	});

	cldr.off( "get", populateProperties );

	return properties;
};

});
