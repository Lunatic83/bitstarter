#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var util = require('util');
var HTMLFILE_DEFAULT = "index_web.html";
var URL_DEFAULT = "url";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var assertUrl = function(inUrl) {
    var instr = inUrl.toString();
    var expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(expression);
    var t = instr;
    if (!t.match(regex) ){
      console.log("%s is not a url", instr);
      process.exit(1);
    }
  return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var downloadWebsite = function(inUrl) {
   var instr = inUrl.toString();
   var filename_tmp="webpage_tmp.txt";
   rest.get(instr).on('complete',  function(result, response) {
          if (result instanceof Error) {
              console.error('Error: ' + util.format(response.message));
              process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
          } else {
              console.error("Wrote %s in file name %s", instr, filename_tmp);
              fs.writeFileSync(filename_tmp, result);
              return filename_tmp;
          }
    });
}



var buildfn = function(outfile) {
    var response2file = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
        } else {
            console.error("Wrote %s", outfile);
            fs.writeFileSync(outfile, result);
            var checkJson = checkHtmlFile(program.file, program.checks);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        }
    };
    return response2file;
};


if(require.main == module) {

    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists),HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Url to website', clone(assertUrl),URL_DEFAULT)
        .parse(process.argv);

    if(program.url!='url'){
      var response2file = buildfn(program.file);
      rest.get(program.url).on('complete', response2file);      
    }else{
      var checkJson = checkHtmlFile(program.file, program.checks);
      var outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}