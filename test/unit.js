require([
	"qunit",

	// util
	"./unit/util/object/invert",
	"./unit/util/regexp/escape",
	"./unit/util/regexp/not-s-and-z",
	"./unit/util/regexp/not-s",

	// core
	"./unit/core",
	"./unit/core/locale",

	// currency
	"./unit/currency/name-properties",
	"./unit/currency/symbol-properties",

	"./unit/currency/name-format",

	// date
	"./unit/date/expand-pattern/augment-format",
	"./unit/date/expand-pattern/compare-formats",
	"./unit/date/expand-pattern/get-best-match-pattern",
	"./unit/date/expand-pattern",
	"./unit/date/timezone-hour-format",

	"./unit/date/format-properties",
	"./unit/date/parse-properties",
	"./unit/date/tokenizer-properties",

	"./unit/date/format",
	"./unit/date/tokenizer",

	"./unit/date/parse",

	// number
	"./unit/number/pattern-properties",
	"./unit/number/format/integer-fraction-digits",
	"./unit/number/format/significant-digits",
	"./unit/number/format/grouping-separator",
	"./unit/number/format-properties",
	"./unit/number/format",
	"./unit/number/parse-properties",
	"./unit/number/parse",

	// relative time
	"./unit/relative-time/properties",
	"./unit/relative-time/format",

	/* unit */
	"./unit/unit/get",
	"./unit/unit/format"

], function() {
	QUnit.start();
}, function( error ) {
	QUnit.test( "requirejs load failure", function( assert ) {
		assert.ok( false, "requirejs failed to load: " + QUnit.dump.parse( error ) );
	});
	QUnit.start();
});
