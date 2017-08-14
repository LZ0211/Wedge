const zlib = require("zlib");
const Bin = require("../binary");
const Archiver = require("../archiver");

const CENTRAL_DIRECTORYD_HEADER_SIGNATURE = Buffer.from([0x50, 0x4B, 0x01, 0x02]);
const LOCAL_FILE_HEADER_SIGNATURE = Buffer.from([0x50,0x4B,0x03,0x04]);
const CENTRAL_DIRECTORYD_END_SIGNATURE = Buffer.from([0x50, 0x4B, 0x05, 0x06]);
const VERSION = Buffer.from([0x0a,0x00]);
const BIT_FLAG = Buffer.from([0x00,0x00]);
const COMPRESSION_METHOD = Buffer.from([0x00,0x08]);

function crc32(input, crc) {
    if (typeof input === "undefined" || !input.length) {
        return 0;
    }
    var table = [
        0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
        0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
        0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988,
        0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
        0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
        0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
        0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC,
        0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
        0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172,
        0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
        0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
        0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
        0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116,
        0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
        0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
        0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
        0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A,
        0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
        0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818,
        0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
        0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
        0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
        0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C,
        0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
        0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
        0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
        0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0,
        0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
        0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086,
        0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
        0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
        0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
        0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A,
        0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
        0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
        0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
        0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE,
        0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
        0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC,
        0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
        0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
        0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
        0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60,
        0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
        0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
        0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
        0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04,
        0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
        0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A,
        0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
        0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
        0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
        0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E,
        0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
        0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
        0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
        0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2,
        0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
        0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0,
        0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
        0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
        0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
        0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94,
        0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
    ];
    var isArray = typeof input !== "string";

    if (typeof(crc) == "undefined") {
        crc = 0;
    }
    var x = 0;
    var y = 0;
    var b = 0;

    crc = crc ^ (-1);
    for (var i = 0, iTop = input.length; i < iTop; i++) {
        b = isArray ? input[i] : input.charCodeAt(i);
        y = (crc ^ b) & 0xFF;
        x = table[y];
        crc = (crc >>> 8) ^ x;
    }

    return crc ^ (-1);
};

function dosTime(date){
    var dosTime = date.getHours();
    dosTime = dosTime << 6;
    dosTime = dosTime | date.getMinutes();
    dosTime = dosTime << 5;
    dosTime = dosTime | date.getSeconds() / 2;
    return dosTime;
}

function dosDate(date){
    var dosDate = date.getFullYear() - 1980;
    dosDate = dosDate << 4;
    dosDate = dosDate | (date.getMonth() + 1);
    dosDate = dosDate << 5;
    dosDate = dosDate | date.getDate();
    return dosDate;
}

function gerCRC32(input){
    var crc = Buffer.alloc(4);
    crc.writeInt32LE(crc32(input))
    return crc;
}

function Zip(){
    var localdirectory = {};
    var centraldirectory = {};
    var localoffset = 0;
    var centraloffset = 0;
    function generateDir(name){
        name = name.replace(/\/*$/g,'') + '/';
        name = Buffer.from(name);
        var now = new Date();
        var time = dosTime(now);
        var date = dosDate(now);
        var bin = new Bin(Buffer.alloc(30));
        bin.write(LOCAL_FILE_HEADER_SIGNATURE);//4
        bin.write(VERSION);//6
        bin.write(BIT_FLAG);//8
        bin.writeUInt16LE(0);//10
        bin.writeUInt16LE(time);//12
        bin.writeUInt16LE(date);//14
        bin.writeUInt32BE(0);//18
        bin.writeUInt32LE(0);//22
        bin.writeUInt32LE(0);//26
        bin.writeUInt16LE(name.length);//28
        bin.writeUInt16LE(0);//30
        bin.concat(name);

        var central = new Bin(Buffer.alloc(46));
        central.write(CENTRAL_DIRECTORYD_HEADER_SIGNATURE);//4
        central.writeInt16LE(20);//6
        central.writeInt16LE(10);//8
        central.writeInt16LE(0);//10
        central.writeInt16LE(0);//12
        central.writeUInt16LE(time);//14
        central.writeUInt16LE(date);//16
        central.writeInt32BE(0);//20
        central.writeInt32LE(0);//24
        central.writeInt32LE(0);//28
        central.writeInt16LE(name.length);//30
        central.writeInt16LE(0);//32
        central.writeInt16LE(0);//34
        central.writeInt16LE(0);//36
        central.writeInt16LE(0);//38
        central.writeInt32LE(16);//42
        central.writeInt32LE(localoffset);//46
        central.concat(name);

        localdirectory[name] = bin.rawBuffer;
        centraldirectory[name] = central.rawBuffer;
        localoffset += bin.length;
        centraloffset += central.length;
        //console.log(name.toString(),localoffset)
    }
    function generateFile(name,data,compress){
        name = Buffer.from(name);
        data = Buffer.from(data);
        var now = new Date();
        var time = dosTime(now);
        var date = dosDate(now);
        var compressedData = compress ? zlib.deflateRawSync(data) : data;
        var crc32 = gerCRC32(data);
        var bin = new Bin(Buffer.alloc(30));
        bin.write(LOCAL_FILE_HEADER_SIGNATURE);//4
        bin.write(VERSION);//6
        bin.write(BIT_FLAG);//8
        bin.writeInt16LE(compress ? 8 : 0);//10
        bin.writeUInt16LE(time);//12
        bin.writeUInt16LE(date);//14
        bin.write(crc32);//18
        bin.writeUInt32LE(compressedData.length);//22
        bin.writeUInt32LE(data.length);//26
        bin.writeInt16LE(name.length);//28
        bin.writeInt16LE(0);//30
        bin.concat(name);
        bin.concat(compressedData);

        var central = new Bin(Buffer.alloc(46));
        central.write(CENTRAL_DIRECTORYD_HEADER_SIGNATURE);//4
        central.writeInt16LE(20);//6
        central.write(VERSION);//8
        central.write(BIT_FLAG);//10
        central.writeInt16LE(compress ? 8 : 0);//12
        central.writeUInt16LE(time);//14
        central.writeUInt16LE(date);//16
        central.write(crc32);//20
        central.writeUInt32LE(compressedData.length);//24
        central.writeUInt32LE(data.length);//28
        central.writeInt16LE(name.length);//30
        central.writeInt16LE(0);//32
        central.writeInt16LE(0);//34
        central.writeInt16LE(0);//36
        central.writeInt16LE(0);//38
        central.writeInt32LE(0);//42
        central.writeInt32LE(localoffset);//46
        central.concat(name);

        localdirectory[name] = bin.rawBuffer;
        centraldirectory[name] = central.rawBuffer;
        localoffset += bin.length;
        centraloffset += central.length;
        //console.log(name.toString(),localoffset)
    }
    return {
        writeFile(filename,data,compressMethod){
            if(localdirectory[filename]){
                throw new Error("file "+filename+" has existed!");
            }
            var dirs = filename.split(/[\\\/]/);
            dirs.pop();
            if(dirs.length){
                this.mkdir(dirs.join('/'));
            }
            generateFile(filename,data,compressMethod);
        },
        mkdir(dirname){
            var name = dirname.replace(/\/*$/g,'') + '/';
            if(localdirectory[name]) return;
            var dirs = dirname.split(/[\\\/]/);
            dirs.pop();
            if(dirs.length){
                this.mkdir(dirs.join('/'));
            }
            generateDir(dirname);
        },
        decode(buffer){
            var bin = new Bin(buffer);
            function readHeader(){
                var header = {};
                header.signature = bin.read(4);
                header.version = bin.readInt16LE();
                header.bitFlag = bin.readInt16LE();
                header.compressionMethod = bin.readInt16LE();
                header.lastModificationTime = bin.readInt16LE();
                header.lastModificationDate = bin.readInt16LE();
                header.crc = bin.read(4);
                header.compressedSize = bin.readInt32LE();
                header.unCompressedSize = bin.readInt32LE();
                header.fileNameLength = bin.readInt16LE();
                header.extraFieldLength = bin.readInt16LE();
                header.fileName = bin.read(header.fileNameLength).toString();
                header.extraField = bin.read(header.extraFieldLength).toString();
                return header;
            }

            function readFileData(header){
                return bin.read(header.compressedSize);
            }

            function readDataDescriptor(header){
                var descriptor = {};
                if (header.bitFlag == 3){
                    descriptor.crc = bin.readInt32LE();
                    descriptor.compressedSize = bin.readInt32LE();
                    descriptor.unCompressedSize = bin.readInt32LE();
                }
                return descriptor;
            }

            function readCentralDirectory(){
                var central = {};
                central.signature = bin.read(4);
                central.version = bin.readInt16LE();
                central.extractVersion = bin.readInt16LE();
                central.bitFlag = bin.readInt16LE();
                central.compressionMethod = bin.readInt16LE();
                central.lastModificationTime = bin.readInt16LE();
                central.lastModificationDate = bin.readInt16LE();
                central.crc = bin.readInt32BE();
                central.compressedSize = bin.readInt32LE();
                central.unCompressedSize = bin.readInt32LE();
                central.fileNameLength = bin.readInt16LE();
                central.extraFieldLength = bin.readInt16LE();
                central.fileCommentLength = bin.readInt16LE();
                central.diskNumberstarts = bin.readInt16LE();
                central.internalFileAttributes = bin.readInt16LE();
                central.externalFileAttributes = bin.readInt32LE();
                central.relativeOffset = bin.readInt32LE();
                central.fileName = bin.read(central.fileNameLength).toString();
                central.extraField = bin.read(central.extraFieldLength).toString();
                central.fileComment = bin.read(central.fileCommentLength).toString();
                return central;
            }

            function readEOCD(){
                var ending = {};
                ending.signature = bin.read(4);
                ending.diskNumber = bin.readInt16LE();
                ending.diskNumberStarts = bin.readInt16LE();
                ending.diskcentralNumber  = bin.readInt16LE();
                ending.centralNumber = bin.readInt16LE();
                ending.centralSize = bin.readInt16LE();
                ending.centralOffset = bin.readInt32BE();
                ending.commentLength = bin.readInt16LE();
                ending.comment = bin.read(ending.commentLength).toString();
                return ending;
            }
            bin.seek(-22);
            var length = readEOCD().centralNumber;
            var header,fileData,dataDescriptor,archiver;
            bin.seek(0);
            archiver = new Archiver();
            for(var i=0;i<length;i++){
                header = readHeader();
                fileData = readFileData(header);
                dataDescriptor = readDataDescriptor(header);
                if(header.compressionMethod){
                    archiver.append(header.fileName,zlib.inflateRawSync(fileData));
                }else{
                    archiver.append(header.fileName,data);
                }
            }
            return archiver;

        },
        generate(){
            var buffers = [];
            for(var x in localdirectory){
                buffers.push(localdirectory[x]);
            }
            for(var x in centraldirectory){
                buffers.push(centraldirectory[x]);
            }
            var num = buffers.length/2;
            var bin = new Bin(Buffer.alloc(22));
            bin.write(CENTRAL_DIRECTORYD_END_SIGNATURE);//4
            bin.writeUInt16LE(0);//6
            bin.writeUInt16LE(0);//8
            bin.writeUInt16LE(num);//10
            bin.writeUInt16LE(num);//12
            bin.writeUInt32LE(centraloffset);//16
            bin.writeUInt32LE(localoffset);//20
            bin.writeUInt16LE(0);//22
            buffers.push(bin.rawBuffer);
            return Buffer.concat(buffers);
        }
    }
}

module.exports = Zip;
