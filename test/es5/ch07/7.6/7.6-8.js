/// Copyright (c) 2012 Ecma International.  All rights reserved. 
/// Ecma International makes this code available under the terms and conditions set
/// forth on http://hg.ecmascript.org/tests/test262/raw-file/tip/LICENSE (the 
/// "Use Terms").   Any redistribution of this code must retain the above 
/// copyright and this notice and otherwise comply with the Use Terms.
/**
 * @path ch07/7.6/7.6-8.js
 * @description 7.6 - SyntaxError expected: reserved words used as Identifier Names in UTF8: do (do)
 */


function testcase() {
            try {
                eval("var \u0064\u006f = 123;");  
                return false;
            } catch (e) {
                return e instanceof SyntaxError;  
            }
    }
runTestCase(testcase);
