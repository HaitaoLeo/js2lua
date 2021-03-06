/// Copyright (c) 2012 Ecma International.  All rights reserved. 
/// Ecma International makes this code available under the terms and conditions set
/// forth on http://hg.ecmascript.org/tests/test262/raw-file/tip/LICENSE (the 
/// "Use Terms").   Any redistribution of this code must retain the above 
/// copyright and this notice and otherwise comply with the Use Terms.
/**
 * @path ch15/15.2/15.2.3/15.2.3.6/15.2.3.6-3-136.js
 * @description Object.defineProperty - 'value' property in 'Attributes' is own accessor property without a get function  (8.10.5 step 5.a)
 */


function testcase() {
        var obj = {};

        var attr = {};
        Object.defineProperty(attr, "value", {
            set: function () { }
        });

        Object.defineProperty(obj, "property", attr);

        return obj.hasOwnProperty("property") && typeof (obj.property) === "undefined";
    }
runTestCase(testcase);
