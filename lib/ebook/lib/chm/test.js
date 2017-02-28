/*0x49 0x54 0x53 0x46
03 00 00 00
60 00 00 00
01 00 00 00
34 7B FA F9
04 08 00 00
10 FD 01 7C AA 7B D0 11 9E 0C 00 A0 C9 22 E6 EC  
11 FD 01 7C AA 7B D0 11 9E 0C 00 A0 C9 22 E6 EC  */

var Struct = require("./struct");
var fs = require("fs");
var stream = new Struct(fs.readFileSync("test.chm"));
var Magic = stream.read(4).toString();
var version = stream.read(4).valueOf('<i');
var HEAD_length = stream.read(4).valueOf('<i');
var unKnow1 = stream.read(4).valueOf('<i');
var HEAD_TIME = stream.read(4).valueOf('i');
var HEAD_LANG = stream.read(4).buffer.reverse();
var HEAD_GUID = stream.read(16).buffer;
console.log(Magic,version,HEAD_length,unKnow1,HEAD_TIME,HEAD_LANG,HEAD_GUID)