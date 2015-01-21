﻿import util = require("util");
import fs = require("fs");
import sh = require("execsync-ng");
import emitter = require("./emitter");
import glob = require("glob");
import vm = require("vm");


function RunProgram(src: string, ff: string, profile: boolean) {
    fs.writeFileSync(ff, src);
    var rc = sh.exec("\\bin\\luajit\\luajit " + (profile ? "-jp=a " : "") + ff);
    //console.log(rc.stdout);
    //console.log("Return Code", rc.code);
    return rc.stdout;
}

function ComparePrograms(fn: string, profile: boolean): any {
    console.log(" TRYING " + fn);
    //process.stdout.write(".");
    var js_stdout = "";
    var print = function (s) {
        js_stdout += s + "\r\n";
        // console.log(s);
    };
    //var print = console.log;
    var flua = fn.replace(".js", ".lua");
    var source = fs.readFileSync(fn).toString();
    var polyfills = fs.readFileSync("polyfills.js").toString();
    var luaRT = fs.readFileSync("runtime.lua").toString();
    var jsRT = fs.readFileSync("runtime.js").toString();
    var ns = /@negat[i]ve|ne[g]ative: (.*)/.exec(source);
    var hasEval = /eval\(/.exec(source);
    var hasWith = /with[ ]?\(/.exec(source);
    var hasTry = /finally( {|{)/.exec(source);
    var hasSwitch = /switch/.exec(source);
    var hasOther = /LU[A]_SKIP/.exec(source);
    var onlyStrict = /\"use strict\"/.exec(source);
    var hasGlobalDeleteTest = /Compound Assignment Operator calls PutValue\(lref, v\)/.exec(source);
    var weirdTests = /S15\.9\.3\.1_A5/.exec(source);
    var hasAnythingToDoWithDate = /Date(\.|\()/.exec(source);
    var hasIntl = /testIntl|\bIntl\b/.exec(source);
    var expectErrors = false;
    //var polyfillSrc = emitter.convertFile(polyfills, "polyfills.js", false);
    var jsVersionFailureDict = {};
    var isTmpFile = /\b__[^.]*\.js/.exec(fn);
    //    console.log("AfterPF");
    if (
        false
        //  || hasEval || hasWith
        //|| hasTry
        //|| hasSwitch
        || hasOther
        ||isTmpFile
    //  || weirdTests
    // || hasAnythingToDoWithDate
    //  || hasGlobalDeleteTest || hasIntl || onlyStrict
        ) {
        //console.log(" [SKIP]");
        return "skip";
    }
    if (ns) {
        expectErrors = true;
    }
    if (expectErrors) {
        try {
            var luasrc = emitter.convertFile(polyfills + source, fn, false);
            vm.runInNewContext(jsRT + source, { print: print }, fn);
            var lua_stdout = RunProgram(luaRT + luasrc, flua, profile);
            if (js_stdout.trim().length == 0 || lua_stdout.trim().length == 0) {
                console.log(" NEG FAIL! == " + fn);
                return false;
            } else {
                //console.log(" NEG OK");
                return true;
            }
        } catch (e) {
            //console.log(" [OK-]");
            return true;
        }
    } else {
        var luasrc = emitter.convertFile(polyfills + source, fn, false);
        if (/--\[\[/.exec(luasrc)) {
            console.log(" [FAIL] NO CODE GENERATED " + fn);
            //console.log("PARTIAL: ", luasrc);
            fs.writeFileSync(flua, luasrc);
    
            return "nocode";
        }
        var time1 = +new Date();
        try {
            vm.runInNewContext(jsRT + source, { print: print }, fn);
        } catch (e) {
            var jfs = e.toString();
            if (!(jfs in jsVersionFailureDict)) {
                console.log("JS version failure: ", jfs); // error shown only once
                jsVersionFailureDict[jfs] = true;
            }
            return "skip";
        }
        var time2 = +new Date();
        var lua_stdout = RunProgram(luaRT + luasrc, flua, profile);
        var time3 = +new Date();
        var t1 = js_stdout.trim().replace(/\r\n/g, '\n');
        var t2 = lua_stdout.trim().replace(/\r\n/g, '\n');

        if ((t1 || t2) && ((t1 != t2) || (/ERROR/.exec(t2)))) {
            if (/expected|outside a vararg|undefined label/.exec(lua_stdout)
                && !/table expected, got/.exec(lua_stdout)
                && !/value expected/.exec(lua_stdout)
                && !/undefined label '__Continue6'/.exec(lua_stdout) // continue from try
                && !/string expected, got/.exec(lua_stdout)
                && !/number expected, got/.exec(lua_stdout)) {
                console.log(" [SYNTAX] FAIL == " + fn);
                console.log("JS:", js_stdout);
                //console.log("\r\nLua SRC:", luasrc); // too much code to digest :(
                console.log("\r\nLua:", lua_stdout);
                return "nocode"; // generated invalid Lua code
            } else {
                console.log(" [RUNTIME] FAIL == " + fn);
                console.log("JS:", js_stdout);
                console.log("Lua:", lua_stdout);
                console.log("TIME JS: ", time2 - time1, " TIME LUA: ", time3 - time2);
                return false;
            }
        } else {
            //console.log(" [OK+]");
            console.log("TIME JS: ", time2 - time1, " TIME LUA: ", time3 - time2);
            return true;
        }
    }
}

var arg = process.argv[2];
var maxSyntaxErrors = 999999;
if (process.argv[3]) {
    maxSyntaxErrors = parseInt(process.argv[3]);
}
var prof = maxSyntaxErrors == -1;
var filenames = glob.sync(arg.replace("\\", "/"));
var total = filenames.length;
var passed = 0;
var failed = 0;
var skipped = 0;
var nocode = 0;
var start = +new Date();
filenames.forEach(function (fn) {
    var pass = ComparePrograms(fn, prof);
    if (prof) return;
    if (pass == "skip") { skipped++ }
    else if (pass == "nocode") {
        nocode++;
        if (nocode > maxSyntaxErrors) { // skip 1
            throw new Error("giving up");
        }
    }
    else if (pass) { passed++ } else { failed++ }
});
var end = +new Date();
console.log("Passed:", passed, "Failed:", failed, "Cannot Translate:", nocode, "Skipped:", skipped, "Total:", total, "Time: ", (end - start) * 0.001);