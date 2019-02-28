
const 
    LZX_MIN_MATCH = 2,
    LZX_NUM_CHARS = 256,
    LZX_BLOCKTYPE_INVALID = 0,
    LZX_BLOCKTYPE_VERBATIM = 1,
    LZX_BLOCKTYPE_ALIGNED = 2,
    LZX_BLOCKTYPE_UNCOMPRESSED = 3,
    LZX_PRETREE_NUM_ELEMENTS = 20,
    LZX_ALIGNED_NUM_ELEMENTS = 8,
    LZX_NUM_PRIMARY_LENGTHS = 7,
    LZX_NUM_SECONDARY_LENGTHS = 249,
    LZX_PRETREE_MAXSYMBOLS = LZX_PRETREE_NUM_ELEMENTS,
    LZX_PRETREE_TABLEBITS = 6,
    LZX_MAINTREE_MAXSYMBOLS = LZX_NUM_CHARS + 50 * 8,
    LZX_MAINTREE_TABLEBITS = 12,
    LZX_LENGTH_MAXSYMBOLS = LZX_NUM_SECONDARY_LENGTHS + 1,
    LZX_LENGTH_TABLEBITS = 12,
    LZX_ALIGNED_MAXSYMBOLS = LZX_ALIGNED_NUM_ELEMENTS,
    LZX_ALIGNED_TABLEBITS = 7,
    LZX_LENTABLE_SAFETY = 64;

const extraBits = [
    0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6,
    7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14,
    15, 15, 16, 16, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17, 17,
    17, 17, 17
];

const positionBase = [
    0, 1, 2, 3, 4, 6, 8, 12,
    16, 24, 32, 48, 64, 96, 128, 192,
    256, 384, 512, 768, 1024, 1536, 2048, 3072,
    4096, 6144, 8192, 12288, 16384, 24576, 32768, 49152,
    65536, 98304, 131072, 196608, 262144, 393216, 524288, 655360,
    786432, 917504, 1048576, 1179648, 1310720, 1441792, 1572864, 1703936,
    1835008, 1966080, 2097152
];

const preTreeTable = new Array((1 << LZX_PRETREE_TABLEBITS) + (LZX_PRETREE_MAXSYMBOLS << 1));

const preTreeLen = new Array(LZX_PRETREE_MAXSYMBOLS + LZX_LENTABLE_SAFETY);

const mainTreeTable = new Array((1 << LZX_MAINTREE_TABLEBITS) + (LZX_MAINTREE_MAXSYMBOLS << 1));

const mainTreeLen = new Array(LZX_MAINTREE_MAXSYMBOLS + LZX_LENTABLE_SAFETY);

const lengthTable = new Array((1 << LZX_LENGTH_TABLEBITS) + (LZX_LENGTH_MAXSYMBOLS << 1));

const lengthLen = new Array(LZX_LENGTH_MAXSYMBOLS + LZX_LENTABLE_SAFETY);

const alignedTable = new Array((1 << LZX_ALIGNED_TABLEBITS) + (LZX_ALIGNED_MAXSYMBOLS << 1));

const alignedLen = new Array(LZX_ALIGNED_MAXSYMBOLS + LZX_LENTABLE_SAFETY);

var window = [];        // the actual decoding window
var windowSize;     // window size (32Kb through 2Mb)
var positionInWindow;     // current offset within the window
var R0;
var R1;
var R2;      // for the LRU offset system
var numMainTreeElements;   // number of main tree elements
var isHeaderRead; // have we started decoding at all yet?
var blockType;      // type of this block
var blockLength;    // uncompressed length of this block
var remainingInBlock; // uncompressed bytes still left to decode
var numFramesRead;     // the number of CFDATA blocks processed
var intelFileSize;  // magic header value used for transform
var intelCurPos;    // current offset in transform space
var intelStarted;   // have we seen any translatable data yet?
    
function LZXInflator(iWindow) {
    // LZX supports window sizes of 2^15 (32Kb) through 2^21 (2Mb)
    // if a previously allocated window is big enough, keep it
    if (iWindow < 15 || iWindow > 21)  return;

    windowSize = 1 << iWindow;

    // allocate associated window
    window = new Array(windowSize);

    // calculate required position slots
    var positionSlots;
    if (iWindow == 20) {
        positionSlots = 42;
    } else if (iWindow == 21) {
        positionSlots = 50;
    } else {
        positionSlots = iWindow << 1;
    }

    numMainTreeElements = LZX_NUM_CHARS + (positionSlots << 3);

    // initialize other state
    reset();
}

/**
 * reset an LZX stream.
 */
function reset() {
    R0 = 1;
    R1 = 1;
    R2 = 1;
    isHeaderRead = false;
    numFramesRead = 0;
    remainingInBlock = 0;
    blockType = LZX_BLOCKTYPE_INVALID;
    intelCurPos = 0;
    intelStarted = false;
    positionInWindow = 0;

    /* initialise tables to 0 (because deltas will be applied to them) */
    for (var i = 0; i < LZX_MAINTREE_MAXSYMBOLS + LZX_LENTABLE_SAFETY; i++) {
        mainTreeLen[i] = 0;
    }
    for (var i = 0; i < LZX_LENGTH_MAXSYMBOLS + LZX_LENTABLE_SAFETY; i++) {
        lengthLen[i] = 0;
    }
}

function makeAlignedDecodeTable() {
    return makeDecodeTable(alignedTable, alignedLen, LZX_ALIGNED_TABLEBITS, LZX_ALIGNED_MAXSYMBOLS);
}

function makeMainTreeDecodeTable() {
    return makeDecodeTable(mainTreeTable, mainTreeLen, LZX_MAINTREE_TABLEBITS, LZX_MAINTREE_MAXSYMBOLS);
}

function makeLengthDecodeTable() {
    return makeDecodeTable(lengthTable, lengthLen, LZX_LENGTH_TABLEBITS, LZX_LENGTH_MAXSYMBOLS);
}

function makePreTreeDecodeTable() {
    return makeDecodeTable(preTreeTable, preTreeLen, LZX_PRETREE_TABLEBITS, LZX_PRETREE_MAXSYMBOLS);
}

function makeDecodeTable(table, length, nBits, nSymbols) {
    var tableMask = 1 << nBits;
    var bitMask = tableMask >>> 1; // don't do 0 length codes
    var nextSymbol = bitMask; // base of allocation for long codes

    // fill entries for codes short enough for a direct mapping
    var pos = 0; // the current position in the decode table
    var bitNum = 1;
    while (bitNum <= nBits) {
        for (var sym = 0; sym < nSymbols; sym++) {
            if (length[sym] == bitNum) {
                var leaf = pos;

                if ((pos += bitMask) > tableMask) {
                    return 1; // table overrun
                }

                // fill all possible lookups of this symbol with the symbol itself
                var fill = bitMask;
                while (fill-- > 0) {
                    table[leaf++] = sym;
                }
            }
        }
        bitMask >>>= 1;
        bitNum++;
    }

    // if there are any codes longer than nBits
    if (pos != tableMask) {
        // clear the remainder of the table
        for (var sym = pos; sym < tableMask; sym++) {
            table[sym] = 0;
        }

        // give ourselves room for codes to grow by up to 16 more bits
        pos <<= 16;
        tableMask <<= 16;
        bitMask = 1 << 15;

        while (bitNum <= 16) {
            for (var sym = 0; sym < nSymbols; sym++) {
                if (length[sym] == bitNum) {
                    var leaf = pos >>> 16;
                    for (var fill = 0; fill < bitNum - nBits; fill++) {
                        // if this path hasn't been taken yet, 'allocate' two entries
                        if (table[leaf] == 0) {
                            table[nextSymbol << 1] = 0;
                            table[(nextSymbol << 1) + 1] = 0;
                            table[leaf] = nextSymbol++;
                        }
                        // follow the path and select either left or right for next bit
                        leaf = table[leaf] << 1;
                        if (((pos >>> (15 - fill)) & 1) != 0) {
                            leaf++;
                        }
                    }
                    table[leaf] = sym;

                    if ((pos += bitMask) > tableMask) {
                        return 1; // table overflow
                    }
                }
            }
            bitMask >>>= 1;
            bitNum++;
        }
    }

    // full table?
    if (pos == tableMask) {
        return 0;
    }

    // either erroneous table, or all elements are 0 - let's find out.
    for (var sym = 0; sym < nSymbols; sym++) {
        if (length[sym] != 0) {
            return 1;
        }
    }
    return 0;
}

function readLens(buffer, lens, first, last) {
    for (var x = 0; x < 20; x++) {
        var y = buffer.readBits(4) & 0xff;
        preTreeLen[x] = y;
    }

    if (0 != makePreTreeDecodeTable()) {
        return 1;
    }

    for (var x = first; x < last; ) {
        var z = readPreTreeHuffSym(buffer);
        if (z == 17) {
            var y = buffer.readBits(4) + 4;
            while (y-- != 0) {
                lens[x++] = 0;
            }
        } else if (z == 18) {
            var y = buffer.readBits(5) + 20;
            while (y-- != 0) {
                lens[x++] = 0;
            }
        } else if (z == 19) {
            var y = buffer.readBits(1) + 4;
            z = readPreTreeHuffSym(buffer);
            z = lens[x] - z;
            if (z < 0) {
                z += 17;
            }
            while (y-- != 0) {
                lens[x++] = (byte) z;
            }
        } else {
            z = lens[x] - z;
            if (z < 0) {
                z += 17;
            }
            lens[x++] = (byte) z;
        }
    }

    return 0;
}

function readHuffSym(BitReader bitReader, var[] table, byte[] lenTable,
        int tableBits, int maxSymbols) {

    bitReader.ensureBits(16);
    int temp = bitReader.peekBits(tableBits);
    int i = table[temp];
    if (i >= maxSymbols) {
        long j = 1L << (64 - tableBits);

        do {
            j >>>= 1;
            i <<= 1;
            i |= (((bitReader.bitBuffer & j) != 0) ? 1 : 0);
            if (j == 0) {
                return -1;
            }
        } while ((i = table[i]) >= maxSymbols);
    }

    int var = i;
    int j = lenTable[i];
    bitReader.removeBits(j);

    return var;
}

/**
 * Decompress a block of bytes.
 *
 * @param inBuf buffer holding the compressed data.
 * @param outLen length (in bytes) of the decompressed data.
 * @return byte buffer decompressed
 */
public ByteBuffer decompress(ByteBuffer inBuf, int outLen) {
    ByteBuffer outBuf = ByteBuffer.allocate(outLen);
    outBuf.order(ByteOrder.LITTLE_ENDIAN);
    BitReader bitReader = new BitReader(inBuf, true);

    // read header if necessary
    if (!isHeaderRead) {
        // The encoder may optionally perform a preprocessing stage
        // on all CFDATA input blocks (size <= 32K) which improves
        // compression on 32-bit Intel 80x86 code. The translation is
        // performed before the data is passed to the compressor,
        // and therefore an appropriate reverse translation must be
        // performed on the output of the decompressor.
        // https://msdn.microsoft.com/en-us/library/bb417343.aspx#enc_preproc
        int k = bitReader.readBits(1);
        if (k == 1) {
            int i = bitReader.readBits(16);
            int j = bitReader.readBits(16);
            intelFileSize = (i << 16) | j;
        } else {
            intelFileSize = 0;  // no encoder preprocessing
        }
        isHeaderRead = true;
    }

    // main decoding loop
    int totalNumToRead = outLen;
    while (totalNumToRead > 0) {
        if (remainingInBlock == 0) {
            if (0 != readBlockHeader(inBuf, bitReader)) {
                return null;
            }
        }

        int numToRead = Math.min(totalNumToRead, remainingInBlock);

        // apply 2^x-1 mask
        positionInWindow &= windowSize - 1;
        // runs can't straddle the window wraparound
        if ((positionInWindow + numToRead) > windowSize) {
            return null;
        }

        totalNumToRead -= numToRead;
        remainingInBlock -= numToRead;

        if (0 != decompressBlockContent(inBuf, bitReader, numToRead, blockType)) {
            return null;
        }
    }

    if (totalNumToRead != 0) {
        return null;
    }

    int start = ((positionInWindow == 0) ? windowSize : positionInWindow) - outLen;

    outBuf.mark();
    for (int num = 0; num < outLen; num++) {
        outBuf.put(window[start + num]);
    }
    outBuf.reset();

    if ((numFramesRead++ >= 32768) || intelFileSize == 0) {
        return outBuf;
    }

    if (outLen <= 6 || !intelStarted) {
        intelCurPos += outLen;
        return outBuf;
    }

    doIntelE8Decoding(outBuf);
    return outBuf;
}

private int readBlockHeader(ByteBuffer inBuf, BitReader bitReader) {
    if (blockType == LZX_BLOCKTYPE_UNCOMPRESSED) {
        if ((blockLength & 1) != 0) {
            inBuf.get(); // realign bitstream to word
        }
        bitReader.init(inBuf, true);
    }

    blockType = bitReader.readBits(3);

    int i = bitReader.readBits(16);
    int j = bitReader.readBits(8);
    remainingInBlock = blockLength = (i << 8) | j;

    switch (blockType) {
        case LZX_BLOCKTYPE_ALIGNED:
            for (i = 0; i < 8; i++) {
                j = bitReader.readBits(3) & 0xff;
                alignedLen[i] = (byte) j;
            }
            if (0 != makeAlignedDecodeTable()) {
                return 1;
            }

            // rest of aligned header is same as verbatim
            // NO break

        case LZX_BLOCKTYPE_VERBATIM:
            if (0 != readLens(bitReader, mainTreeLen, 0, 256) ||
                    0 != readLens(bitReader, mainTreeLen, 256, numMainTreeElements) ||
                    0 != makeMainTreeDecodeTable()) {
                return 1;
            }

            if (mainTreeLen[0xE8] != 0) {
                intelStarted = true;
            }

            if (0 != readLens(bitReader, lengthLen, 0, LZX_NUM_SECONDARY_LENGTHS) ||
                    0 != makeLengthDecodeTable()) {
                return 1;
            }
            break;

        case LZX_BLOCKTYPE_UNCOMPRESSED:
            intelStarted = true; // because we can't assume otherwise
            // get up to 16 pad bits into the buffer
            bitReader.ensureBits(16);
            if (bitReader.bitsBuffered > 16) {
                // and align the bitstream
                inBuf.position(inBuf.position() - 2);
            }
            inBuf.order(ByteOrder.LITTLE_ENDIAN);
            R0 = inBuf.getInt();
            R1 = inBuf.getInt();
            R2 = inBuf.getInt();
            break;
        default:
            // System.out.println("block type " + blockType);
            return 1;
    }

    return 0;
}

private int readMainTreeHuffSym(BitReader bitReader) {
    return readHuffSym(bitReader, mainTreeTable, mainTreeLen,
            LZX_MAINTREE_TABLEBITS, LZX_MAINTREE_MAXSYMBOLS);
}

private int readAlignedHuffSym(BitReader bitReader) {
    return readHuffSym(bitReader, alignedTable, alignedLen,
            LZX_ALIGNED_TABLEBITS, LZX_ALIGNED_MAXSYMBOLS);
}

private int readLengthHuffSym(BitReader bitReader) {
    return readHuffSym(bitReader, lengthTable, lengthLen,
            LZX_LENGTH_TABLEBITS, LZX_LENGTH_MAXSYMBOLS);
}

private int readPreTreeHuffSym(BitReader bitReader) {
    return readHuffSym(bitReader, preTreeTable, preTreeLen,
            LZX_PRETREE_TABLEBITS, LZX_PRETREE_MAXSYMBOLS);
}

private int decompressBlockContent(ByteBuffer inBuf, BitReader bitReader,
        int this_run, int block_type) {
    if (block_type == LZX_BLOCKTYPE_UNCOMPRESSED) {
        for (int num = 0; num < this_run && inBuf.hasRemaining(); num++) {
            window[positionInWindow++] = inBuf.get();
        }
        return 0;
    } else if (block_type != LZX_BLOCKTYPE_VERBATIM && block_type != LZX_BLOCKTYPE_ALIGNED) {
        return 1;
    }

    while (this_run > 0) {
        int main_element = readMainTreeHuffSym(bitReader);
        if (main_element < LZX_NUM_CHARS) {
            // literal: 0 to LZX_NUM_CHARS -1
            window[positionInWindow++] = (byte) main_element;
            this_run--;
            continue;
        }

        // match: LZX_NUM_CHARS + ((match_offset<<3) | match_length (3bits))
        main_element -= LZX_NUM_CHARS;

        int match_length = main_element & LZX_NUM_PRIMARY_LENGTHS; // 3bits
        if (match_length == LZX_NUM_PRIMARY_LENGTHS) {
            int length_footer = readLengthHuffSym(bitReader);
            match_length += length_footer;
        }
        match_length += LZX_MIN_MATCH;

        int match_offset = main_element >> 3;
        if (match_offset > 2) {
            // not repeated offset
            if (block_type == LZX_BLOCKTYPE_VERBATIM) {
                if (match_offset != 3) {
                    int extra = extraBits[match_offset];
                    int verbatim_bits = bitReader.readBits(extra);
                    match_offset = positionBase[match_offset] - 2 + verbatim_bits;
                } else {
                    match_offset = 1;
                }

            } else { // block_type == LZX_BLOCKTYPE_ALIGNED
                int extra = extraBits[match_offset];
                match_offset = positionBase[match_offset] - 2;
                if (extra > 3) {
                    // verbatim and aligned bits
                    extra -= 3;
                    int verbatim_bits = bitReader.readBits(extra);
                    match_offset += (verbatim_bits << 3);
                    int aligned_bits = readAlignedHuffSym(bitReader);
                    match_offset += aligned_bits;
                } else if (extra == 3) {
                    // aligned bits only
                    int aligned_bits = readAlignedHuffSym(bitReader);
                    match_offset += aligned_bits;
                } else if (extra > 0) { // extra==1, extra==2
                    // verbatim bits only
                    int verbatim_bits = bitReader.readBits(extra);
                    match_offset += verbatim_bits;
                } else { // extra == 0
                    // ???
                    match_offset = 1;
                }
            }

            // update repeated offset LRU queue
            R2 = R1;
            R1 = R0;
            R0 = match_offset;

        } else if (match_offset == 0) {
            match_offset = R0;
        } else if (match_offset == 1) {
            match_offset = R1;
            R1 = R0;
            R0 = match_offset;
        } else { // match_offset == 2
            match_offset = R2;
            R2 = R0;
            R0 = match_offset;
        }

        int dest_offset = positionInWindow;
        int src_offset = dest_offset - match_offset;
        positionInWindow += match_length;
        if (positionInWindow > windowSize) {
            return -1;
        }
        this_run -= match_length;

        // copy any wrapped around source data
        while ((src_offset < 0) && (match_length-- > 0)) {
            window[dest_offset++] = window[src_offset + windowSize];
            src_offset++;
        }
        // copy match data - no worries about destination wraps
        while (match_length-- > 0) {
            window[dest_offset++] = window[src_offset++];
        }
    }
    return 0;
}

private void doIntelE8Decoding(ByteBuffer outBuf) {
    long curPos = intelCurPos;
    long fileSize = intelFileSize;

    outBuf.mark();
    while (outBuf.position() < outBuf.limit() - 10) {
        int b = outBuf.get() & 0xff;
        if (b != 0xe8) {
            curPos++;
            continue;
        }

        int markedOutBufPos = outBuf.position();

        // get UInt32
        int tmp = outBuf.getInt();
        long absoluteOffset = tmp & 0x00000000ffffffffL;

        if ((absoluteOffset >= -curPos) && (absoluteOffset < fileSize)) {
            long relativeOffset;
            if (absoluteOffset >= 0) {
                relativeOffset = absoluteOffset - curPos;
            } else {
                relativeOffset = absoluteOffset + fileSize;
            }
            outBuf.position(markedOutBufPos);
            outBuf.put((byte) (relativeOffset & 0xFF));
            outBuf.put((byte) ((relativeOffset >>> 8) & 0xFF));
            outBuf.put((byte) ((relativeOffset >>> 16) & 0xFF));
            outBuf.put((byte) ((relativeOffset >>> 24) & 0xFF));
        }
        curPos += 5;
    }
    outBuf.reset();
}
