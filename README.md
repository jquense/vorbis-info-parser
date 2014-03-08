Vorbis Bit Stream Metadata parser
=====================================

A simple streaming parser for retrieving  metadata from a [vorbis](http://xiph.org/vorbis/doc/Vorbis_I_spec.html) stream.
Nor generally useful by itself as vorbis streams tend to be nested inside other audio formats, such as OGG or FLAC files.
More then likely you want one of those higher level parsers ([OGG parser](https://github.com/theporchrat/ogg-info-parser/) and
                                                              [FLAC parser](https://github.com/theporchrat/flac-parser/))

### Install

    npm install vorbis-parser

### Options

The Vorbis parser takes one options `framingBit -> bool` which tells the parser whether the headers contain a framing bit
 at the end of them (flac comments do not).

 There is also a static method `VorbisParser.parsePicture(data -> Buffer)` which will return an object of parsed image data

    {
        mime: 'image/png',
        desc: 'a description field'
        data: Buffer<01, 03, 01, etc>
        info: {
            w: 300,
            h: 500
            depth:  int,
            colors: int
        }
    }

### Use
The parser is simply a stream in objectMode, so you can pipe and binary data into it and it will spit out tag objects.

    var Vorbis = require('vorbis-parser')
      , stream = getVorbisStreamData()

    var parser = stream.pipe(new Vorbis());

    parser.on('data', function(tag){
        console.log(tag.type)  // => 'bitRateNominal'
        console.log(tag.value) // => 128000
    })
