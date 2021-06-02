define([
    "src/util/regexp/not-s-and-z",
], function( regexpNotSAndZ ) {

    QUnit.module( "Util regexp ^S&^Z" );

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
        QUnit.test("it should NOT match category " + c.category, function( assert ) {
            assert.notOk(regexpNotSAndZ.test(c.symbol));
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
        }
    ].forEach(function( c ) {
        QUnit.test("it should match category " + c.category, function( assert ) {
            assert.ok(regexpNotSAndZ.test(c.symbol));
        });
    });
});
