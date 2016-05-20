var inherits = require('util').inherits
  , Tokenizr = require('stream-tokenizr')
  , binary = require('./binaryHelpers')
  , assign = require('lodash/assign')
  , pick = require('lodash/pick');


module.exports = VorbisParser;

inherits(VorbisParser, Tokenizr);

function VorbisParser(opts){
    if ( !(this instanceof VorbisParser) )
        return new VorbisParser();

    opts = assign({}, opts || {}, { objectMode: true })

    Tokenizr.call(this, opts)

    this.framingBit = typeof opts.framingBit !== 'boolean'
        ? true
        : opts.framingBit

    this.loop(function(end){
        this.readUInt8('headerType')
            .isEqual(new Buffer('vorbis', 'utf8'), 'not a valid vorbis Stream')
            .tap(function(tok){
                var headerType = tok.headerType;

                if ( headerType === HEADER_TYPES.INFO )
                    this.parseInfoHeader()
                else if ( headerType === HEADER_TYPES.COMMENT ) //comments
                    this.parseVorbisComments()
                else{
                    this.push(null)
                    return end();
                }
            })
            .flush()
    })

}

VorbisParser.prototype.parseInfoHeader = function(){
    this.readUInt32LE('version')
        .readUInt8('channels')
        .readUInt32LE('sampleRate')
        .readUInt32LE('bitRateMax')
        .readUInt32LE('bitRateNominal')
        .readUInt32LE('bitRateMin')
        .tap(function(tok){
            var self = this;
            var fields = pick(tok, 'version', 'channels', 'sampleRate', 'bitRateMax','bitRateNominal', 'bitRateMin' )

            Object.keys(fields).forEach(function(key) {
              self.push({ type: key, value: fields[key] })
            })

            this.framingBit
                ? this.skip(2)
                : this.skip(1);
        })
}

//i'd like to once again thank taglib for guidance on parsing these correctly...
VorbisParser.prototype.parseVorbisComments = function(){
    var self = this
      , i = 0;

    this.readUInt32LE('vendorLen')
        .readString('vendorLen', 'utf8', 'venderStr')
        .readUInt32LE('commentCount')
        .loop(function(end, tok){
            i++

            this.readUInt32LE('cLen')
                .readString('cLen', 'utf8', function(str){
                    var idx   = str.indexOf('=')
                      , value = str.slice(idx + 1);

                    str = str.slice(0, idx)

                    value = str === 'METADATA_BLOCK_PICTURE'
                        ? VorbisParser.parsePicture(new Buffer(value, 'base64'))
                        : value;

                    self.push({
                        type:  str,
                        value: value
                    })
                })

            if ( i >= tok.commentCount)
                return end();
        })
        .tap(function(){
            if ( this.framingBit ) this.skip(1)

            this.readCommentHeader = true;
        });
}

VorbisParser.parsePicture = function(buf){
    var pos = 0
    var type = buf.readUInt32BE(0)
    var mimeLength, mime, descLength, desc, dim, dataLength;

    type = buf.readUInt32BE(0)

    mimeLength = buf.readUInt32BE( 4 )

    mime = binary.decodeString(buf, 'ascii', 8 , 8 + mimeLength )

    pos += 8 + mimeLength

    descLength = buf.readUInt32BE( pos );

    pos += 4

    desc = binary.decodeString(buf, 'utf8',  pos, pos + descLength )

    pos += descLength
    dim = {
        w: buf.readUInt32BE(pos),
        h: buf.readUInt32BE(pos + 4),
        depth:  buf.readUInt32BE(pos + 8),
        colors: buf.readUInt32BE(pos + 12)
    }
    pos += 16;

    dataLength = buf.readUInt32BE(pos)

    pos += 4;

    return {
        mime: mime,
        desc: desc,
        data: buf.slice(pos,  pos + dataLength ),
        info: dim
    }
}

var HEADER_TYPES = {
        INFO:    0x1,
        COMMENT: 0x3,
        SETUP:   0x5
    }
