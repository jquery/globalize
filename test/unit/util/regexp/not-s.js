define([
    "src/util/regexp/not-s",
], function( regexpNotS ) {

    QUnit.module( "Util regexp ^S" );

    [
        {
            symbol: "௹",
            category: "Sc"
        },
        {
            symbol: "꜏",
            category: "Sk"
        },
        {
            symbol: "∇",
            category: "Sm"
        },
        {
            symbol: "❤",
            category: "So"
        }
    ].forEach(function( c ) {
        QUnit.test("it should NOT match category " + c.category, function( assert ) {
            assert.notOk(regexpNotS.test(c.symbol));
        });
    });

    [
        {
            symbol: "𒐖",
            category: "Nl"
        },
        {
            symbol: "א",
            category: "Lo"
        },
        {
            symbol: "\u2028",
            category: "Zl"
        },
        {
            symbol: "\u2029",
            category: "Zp"
        },
        {
            symbol: "\u2003",
            category: "Zs"
        }
    ].forEach(function( c ) {
        QUnit.test("it should match category " + c.category, function( assert ) {
            assert.ok(regexpNotS.test(c.symbol));
        });
    });
});
