/*0x49 0x54 0x53 0x46
03 00 00 00
60 00 00 00
01 00 00 00
34 7B FA F9
04 08 00 00
10 FD 01 7C AA 7B D0 11 9E 0C 00 A0 C9 22 E6 EC  
11 FD 01 7C AA 7B D0 11 9E 0C 00 A0 C9 22 E6 EC  */

var Binary = require('../binary')
var fs = require("fs");

var bin = new Binary(fs.readFileSync("test.chm"));

function readHeader(bin){
    function readinitHeader(){
        bin.seek(0);
        return {
            siginature: bin.read(4).toString(),//4
            version: bin.readInt32LE(),//8
            length: bin.readInt32LE(),//12
            unknow1: bin.readInt32LE(),//16
            timestamp: bin.readInt32BE(),//20
            language: bin.read(4),//24
            guid1: bin.read(16),//40
            guid2: bin.read(16)//56
        }
    }

    function readHeaderTable(){
        bin.seek(56);
        return [
            {
                offset: bin.read(8).readInt32LE(),//64
                length: bin.read(8).readInt32LE()//72
            },
            {
                offset: bin.read(8).readInt32LE(),//80
                length: bin.read(8).readInt32LE()//88
            }
        ]
    }

    function readContentOffset(){
        bin.seek(88);
        return bin.read(8).readInt32LE();//96
    }

    return {
        initHeader: readinitHeader(),
        headerTable: readHeaderTable(),
        contentOffset: readContentOffset(),
    }
}

function readHeaderSection(bin){
    function readSection1(){
        bin.seek(96);
        return {
            unknow1: bin.read(4),//100
            unknow2: bin.read(4),//104
            size: bin.read(8).readInt32LE(),//112
            unknow3: bin.read(4),//116
            unknow4: bin.read(4)//120
        }
    }
    function readDirectoryheader(){
        bin.seek(120);
        return {
            siginature: bin.read(4).toString(),//124
            version: bin.readInt32LE(),//128
            length: bin.readInt32LE(),//132
            unknow1: bin.readInt32LE(),//136
            size: bin.readInt32LE(),//140
            density: bin.readInt32LE(),//144
            depth: bin.readInt32LE(),//148
            rootNum: bin.readInt32LE(),//152
            firstNum: bin.readInt32LE(),//156
            lastNum: bin.readInt32LE(),//160
            unknow2: bin.readInt32LE(),//164
            totalNum: bin.readInt32LE(),//168
            language: bin.read(4),//172
            guid: bin.read(16),//188
            size2: bin.readInt32LE(),//192
            unknow3: bin.readInt32LE(),//196
            unknow4: bin.readInt32LE(),//200
            unknow5: bin.readInt32LE(),//204
        }
    }
    function readListChunk(){
        return {
            siginature: bin.read(4).toString(),
            freeSpace: bin.readInt32LE(),
            zero: bin.readInt32LE(),
            previous: bin.readInt32LE(),
            next: bin.readInt32LE(),
        }
    }
    var header = readDirectoryheader();
    function readQuickrefArea(){
        var n = 1 + 1<<header.density;//5
        return [
            bin.readInt32LE(),
            bin.readInt32LE(),
            bin.readInt32LE(),
        ]
    }
    return {
        section0:readSection1(),
        section1:{
            header:readDirectoryheader(),
            list:readListChunk(),
            quickrefArea:readQuickrefArea()
        }
    }
}




console.log(readHeader(bin))
console.log(readHeaderSection(bin))