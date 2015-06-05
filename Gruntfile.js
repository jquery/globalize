module.exports = function( grunt ) {

	"use strict";

	var serverOptions = {},
		binPath = require( "chromedriver" ).path,
		rdefineEnd = /\}\);[^}\w]*$/,
		pkg = grunt.file.readJSON( "package.json" );

	serverOptions[ "Dwebdriver.chrome.driver=" + binPath ] = "";

	function camelCase( input ) {
		return input.toLowerCase().replace( /[-/](.)/g, function( match, group1 ) {
			return group1.toUpperCase();
		});
	}

	function mountFolder( connect, path ) {
		return connect.static( require( "path" ).resolve( path ) );
	}

	function replaceConsts( content ) {
		return content

			// Replace Version
			.replace( /@VERSION/g, pkg.version )

			// Replace Date yyyy-mm-ddThh:mmZ
			.replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );
	}

	grunt.initConfig({
		pkg: pkg,
		commitplease: {
			last50: {
				options: {
					committish: "-n 50"
				}
			}
		},
		connect: {
			options: {
				port: 9001,
				hostname: "localhost"
			},
			test: {
				options: {
					middleware: function( connect ) {
						return [
							mountFolder( connect, "." ),
							mountFolder( connect, "test" )
						];
					}
				}
			},
			keepalive: {
				options: {
					keepalive: true,
					middleware: function( connect ) {
						return [
							mountFolder( connect, "." )
						];
					}
				}
			}
		},
		intern: {
			options: {
				runType: "runner"
			},
			unitLocal: {
				options: {
					config: "test/intern-local",
					suites: [ "test/unit/all" ]
				}
			},
			functionalLocal: {
				options: {
					config: "test/intern-local",
					suites: [ "test/functional/all" ]
				}
			},
			unitCi: {
				options: {
					config: "test/intern",
					suites: [ "test/unit/all" ]
				}
			},
			functionalCi: {
				options: {
					config: "test/intern",
					suites: [ "test/functional/all" ]
				}
			}
		},
		jshint: {
			source: {
				src: [ "src/**/*.js", "!src/build/**" ],
				options: {
					jshintrc: "src/.jshintrc"
				}
			},
			grunt: {
				src: [ "Gruntfile.js" ],
				options: {
					jshintrc: ".jshintrc"
				}
			},
			test: {
				src: [ "test/*.js", "test/functional/**/*.js", "test/unit/**/*.js",
					"!test/config.js" ],
				options: {
					jshintrc: "test/.jshintrc"
				}
			},
			dist: {
				src: [ "dist/globalize*.js", "dist/globalize/*.js" ],
				options: {
					jshintrc: "src/.dist-jshintrc"
				}
			}
		},
		jscs: {
			source: [ "src/**/*.js", "!src/build/**" ],
			grunt: "Gruntfile.js",
			test: [ "test/*.js", "test/functional/**/*.js", "test/unit/**/*.js" ],
			dist: [ "dist/globalize*.js", "dist/globalize/*.js" ]
		},
		qunit: {
			functional: {
				options: {
					urls: [

						// Use es5-shim here due to .bind(), which is not present on phantomjs v1.9.
						// But, it should be on v2.x.
						"http://localhost:<%= connect.options.port %>/functional-es5-shim.html"
					]
				}
			},
			unit: {
				options: {
					urls: [ "http://localhost:<%= connect.options.port %>/unit.html" ]
				}
			}
		},
		requirejs: {
			options: {
				dir: "dist/.build",
				appDir: "src",
				baseUrl: ".",
				optimize: "none",
				paths: {
					cldr: "../external/cldrjs/dist/cldr",
					"make-plural": "../external/make-plural/make-plural",
					messageformat: "../external/messageformat/messageformat"
				},
				skipSemiColonInsertion: true,
				skipModuleInsertion: true,

				// Strip all definitions generated by requirejs.
				// Convert content as follows:
				// a) "Single return" means the module only contains a return statement that is
				//    converted to a var declaration.
				// b) "Module" means the define wrappers are removed, but content is untouched.
				//    Only for root id's (the ones in src, not in src's subpaths). Note there's no
				//    conditional code checking for this type.
				onBuildWrite: function( id, path, contents ) {
					var messageformat,
						name = camelCase( id.replace( /util\/|common\//, "" ) );

					// MakePlural
					if ( ( /make-plural/ ).test( id ) ) {
						return contents

							// Remove browserify wrappers.
							.replace( /^\(function\(f\){if\(typeof exports==="object"&&type.*/, "" )
							.replace( /},{}\]},{},\[1\]\)\(1\)[\s\S]*?$/, "" )

							// Remove browserify exports.
							.replace( /Object.defineProperty\(exports[\s\S]*?\n}\);/, "" )
							.replace( "exports['default'] = MakePlural;", "" )
							.replace( "module.exports = exports['default'];", "" )

							// Remove self-tests.
							.replace( /var Tests =[\s\S]*?\n}\)\(\);/, "" )
							.replace( "this.tests = new Tests(this);", "" )
							.replace( /this.fn.test =[\s\S]*?bind\(this\);/, "" )
							.replace( "this.tests.add(type, cat, examples);", "" )

							// Remove load method.
							.replace( /load: {[\s\S]*?\n        }/, "" )

							// Replace its wrapper into var assignment.
							.replace( /\(function \(global\) {/, [
								"var MakePlural;",
								"/* jshint ignore:start */",
								"MakePlural = (function() {"
							].join( "\n" ) )
							.replace( /if \(\(typeof module !== 'undefined'[\s\S]*/, [
								"return MakePlural;",
								"}());",
								"/* jshint ignore:end */"
							].join( "\n" ) )

							// Wrap everything into a var assignment.
							.replace( /^/, [
								"var MakePlural;",
								"/* jshint ignore:start */",
								"MakePlural = (function() {"
							].join( "\n" ) )
							.replace( /$/, [
								"return MakePlural;",
								"}());",
								"/* jshint ignore:end */"
							].join( "\n" ) );

					// messageformat
					} else if ( ( /messageformat/ ).test( id ) ) {
						return contents

							// Remove browserify wrappers.
							.replace( /^\(function\(f\){if\(typeof exports==="object"&&type.*/, "" )
							.replace( "},{}],2:[function(require,module,exports){", "" )
							.replace( /},{"\.\/messageformat-parser":1,"make-plural\/plural.*/, "" )
							.replace( /},{}\]},{},\[2\]\)\(2\)[\s\S]*?$/, "" )

							// Set `MessageFormat.plurals` and remove `make-plural/plurals`
							// completely. This is populated by Globalize on demand.
							.replace( /var _cp = \[[\s\S]*?$/, "" )
							.replace(
								"MessageFormat.plurals = require('make-plural/plurals')",
								"MessageFormat.plurals = {}"
							)

							// Set `MessageFormat._parse`
							.replace(
								"MessageFormat._parse = require('./messageformat-parser').parse;",
								""
							)
							.replace( /module\.exports = \(function\(\) {([\s\S]*?)\n}\)\(\);/, [
								"MessageFormat._parse = (function() {",
								"$1",
								"}()).parse;"
							].join( "\n" ) )

							// Remove unused code.
							.replace( /if \(!pluralFunc\) {\n[\s\S]*?\n  }/, "" )
							.replace( /if \(!locale\) {\n[\s\S]*?  }\n/, "this.lc = [locale];" )
							.replace( /(MessageFormat\.formatters) = {[\s\S]*?\n};/, "$1 = {};" )
							.replace( /MessageFormat\.prototype\.setIntlSupport[\s\S]*?\n};/, "" )

							// Wrap everything into a var assignment.
							.replace( "module.exports = MessageFormat;", "" )
							.replace( /^/, [
								"var MessageFormat;",
								"/* jshint ignore:start */",
								"MessageFormat = (function() {"
							].join( "\n" ) )
							.replace( /$/, [
								"return MessageFormat;",
								"}());",
								"/* jshint ignore:end */"
							].join( "\n" ) );

					// message-runtime
					} else if ( ( /message-runtime/ ).test( id ) ) {
						messageformat = require( "./external/messageformat/messageformat" );
						delete messageformat.prototype.runtime.fmt;
						delete messageformat.prototype.runtime.pluralFuncs;
						contents = contents.replace( "Globalize._messageFormat = {};", [
							"/* jshint ignore:start */",
							"Globalize._messageFormat = (function() {",
							messageformat.prototype.runtime.toString(),
							"return {number: number, plural: plural, select: select};",
							"}());",
							"/* jshint ignore:end */"
						].join( "\n" ) );
					}

					// 1, and 2: Remove define() wrap.
					// 3: Remove empty define()'s.
					contents = contents
						.replace( /define\([^{]*?{/, "" ) /* 1 */
						.replace( rdefineEnd, "" ) /* 2 */
						.replace( /define\(\[[^\]]+\]\)[\W\n]+$/, "" ); /* 3 */

					// Type a (single return)
					if ( ( /\// ).test( id ) ) {
						contents = contents
							.replace( /\nreturn/, "\nvar " + name + " =" );
					}

					return contents;
				}
			},
			bundle: {
				options: {
					modules: [
						{
							name: "globalize",
							include: [ "core" ],
							exclude: [ "cldr", "cldr/event" ],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-core.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.currency",
							include: [ "currency" ],
							exclude: [
								"cldr",
								"cldr/event",
								"cldr/supplemental",
								"./core",
								"./number"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-currency.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.date",
							include: [ "date" ],
							exclude: [
								"cldr",
								"cldr/event",
								"cldr/supplemental",
								"./core",
								"./number"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-date.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.message",
							include: [ "message" ],
							exclude: [ "cldr", "./core" ],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-message.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.number",
							include: [ "number" ],
							exclude: [
								"cldr",
								"cldr/event",
								"cldr/supplemental",
								"./core"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-number.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.plural",
							include: [ "plural" ],
							exclude: [
								"cldr",
								"cldr/event",
								"cldr/supplemental",
								"./core"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-plural.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.relative-time",
							include: [ "relative-time" ],
							exclude: [
								"cldr",
								"cldr/event",
								"cldr/supplemental",
								"./core",
								"./number",
								"./plural"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-relative-time.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize-runtime",
							include: [ "core-runtime" ],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-core-runtime.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.currency-runtime",
							include: [ "currency-runtime" ],
							exclude: [
								"./core-runtime",
								"./number-runtime"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-currency-runtime.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.date-runtime",
							include: [ "date-runtime" ],
							exclude: [
								"./core-runtime",
								"./number-runtime"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-date-runtime.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.message-runtime",
							include: [ "message-runtime" ],
							exclude: [ "./core-runtime" ],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-message-runtime.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.number-runtime",
							include: [ "number-runtime" ],
							exclude: [
								"./core-runtime"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-number-runtime.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.plural-runtime",
							include: [ "plural-runtime" ],
							exclude: [
								"./core-runtime"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-plural-runtime.js",
									endFile: "src/build/outro.js"
								}
							}
						},
						{
							name: "globalize.relative-time-runtime",
							include: [ "relative-time-runtime" ],
							exclude: [
								"./core-runtime",
								"./number-runtime",
								"./plural-runtime"
							],
							create: true,
							override: {
								wrap: {
									startFile: "src/build/intro-relative-time-runtime.js",
									endFile: "src/build/outro.js"
								}
							}
						}
					]
				}
			}
		},
		watch: {
			files: [ "src/*.js", "test/functional/**/*.js", "test/unit/**/*.js", "test/*.html" ],
			tasks: [ "default" ]
		},
		copy: {
			options: {
				processContent: function( content ) {

					// Remove leftover define created during rjs build
					content = content.replace( /define\(".*/, "" );

					// Embed VERSION and DATE
					return replaceConsts( content );
				}
			},
			coreAndRuntime: {
				expand: true,
				cwd: "dist/.build/",
				src: [ "globalize.js", "globalize-runtime.js" ],
				dest: "dist/"
			},
			modules: {
				expand: true,
				cwd: "dist/.build/",
				src: [ "globalize*.js", "!globalize.js", "!*runtime*.js" ],
				dest: "dist/globalize",
				rename: function( dest, src ) {
					return require( "path" ).join( dest, src.replace( /globalize\./, "" ) );
				}
			},
			runtimeModules: {
				expand: true,
				cwd: "dist/.build/",
				src: [ "globalize.*runtime.js" ],
				dest: "dist/globalize-runtime",
				rename: function( dest, src ) {
					return require( "path" ).join( dest, src.replace( /(globalize\.|-runtime)/g, "" ) );
				}
			},
			allInOneNode: {
				src: "src/build/node-main.js",
				dest: "dist/node-main.js"
			}
		},
		uglify: {
			options: {
				banner: replaceConsts( grunt.file.read( "src/build/intro.min.js" ) )
			},
			dist: {
				files: {
					"tmp/globalize.min.js": [ "dist/globalize.js" ],
					"tmp/globalize/currency.min.js": [ "dist/globalize/currency.js" ],
					"tmp/globalize/date.min.js": [ "dist/globalize/date.js" ],
					"tmp/globalize/number.min.js": [ "dist/globalize/number.js" ],
					"tmp/globalize/plural.min.js": [ "dist/globalize/plural.js" ],
					"tmp/globalize/message.min.js": [ "dist/globalize/message.js" ],
					"tmp/globalize/relative-time.min.js": [ "dist/globalize/relative-time.js" ],

					"tmp/globalize-runtime.min.js": [ "dist/globalize-runtime.js" ],
					"tmp/globalize-runtime/currency.min.js": [
						"dist/globalize-runtime/currency.js"
					],
					"tmp/globalize-runtime/date.min.js": [ "dist/globalize-runtime/date.js" ],
					"tmp/globalize-runtime/message.min.js": [ "dist/globalize-runtime/message.js" ],
					"tmp/globalize-runtime/number.min.js": [ "dist/globalize-runtime/number.js" ],
					"tmp/globalize-runtime/plural.min.js": [ "dist/globalize-runtime/plural.js" ],
					"tmp/globalize-runtime/relative-time.min.js": [
						"dist/globalize-runtime/relative-time.js"
					]
				}
			}
		},

		// TODO figure out how to specify exceptions for externals
		"compare_size": {
			files: [
				"tmp/globalize.min.js",
				"tmp/globalize/*min.js",
				"tmp/globalize-runtime.min.js",
				"tmp/globalize-runtime/*min.js"
			],
			options: {
				compress: {
					gz: function( fileContents ) {
						return require( "gzip-js" ).zip( fileContents, {}).length;
					}
				}
			}
		},
		clean: {
			dist: [
				"dist"
			]
		},
		checkDependencies: {
			bower: {
				options: {
					packageManager: "bower"
				}
			},
			npm: {
				options: {
					packageManager: "npm"
				}
			}
		},
		"start-selenium-server": {
			dev: {
				options: {
					downloadUrl: "https://selenium-release.storage.googleapis.com/2.45/" +
						"selenium-server-standalone-2.45.0.jar",
					downloadLocation: "node_modules/grunt-selenium-server/",
					serverOptions: serverOptions,
					systemProperties: {}
				}
			}
		},
		"stop-selenium-server": {
			dev: {}
		}
	});

	require( "matchdep" ).filterDev( [ "grunt-*", "intern" ] ).forEach( grunt.loadNpmTasks );

/*  grunt.registerTask( "test", function() {
		var args = [].slice.call( arguments );
		if ( !isConnectTestRunning ) {
			grunt.task.run( "checkDependencies" );
			grunt.task.run( "connect:test" );
			isConnectTestRunning = true;
		}
		grunt.task.run( [ "qunit" ].concat( args ).join( ":" ) );
	});

*/
	grunt.registerTask( "pre-unit", [
		"jshint:grunt",
		"jshint:source",
		"jshint:test",
		"jscs:grunt",
		"jscs:source",
		"start-selenium-server"
	]);

	grunt.registerTask( "pre-functional", [
		// TODO fix issues, enable
		//"jscs:test",
		"clean",
		"requirejs",
		"copy",
		"jshint:dist"
	]);

	grunt.registerTask( "post-functional", [
		// TODO fix issues, enable
		// "jscs:dist",
		"stop-selenium-server",
		"uglify",
		"compare_size",
		"commitplease"
	]);

	grunt.registerTask( "default", [
		"pre-unit",
		"intern:unitLocal",
		"pre-functional",
		"intern:functionalLocal",
		"post-functional"
	]);

	grunt.registerTask( "test-ci", [
		"pre-unit",
		"intern:unitCi",
		"pre-functional",
		"intern:functionalCi",
		"post-functional"
	]);

	grunt.registerTask( "test", [
		"pre-unit",
		"intern:unitLocal",
		"pre-functional",
		"intern:functionalLocal",
		"post-functional"
	]);
};
