var chai = require('chai')
  , Parser = require('./vorbisParser');

chai.should()

describe('when parsing headers', function(){
    var parser, tags;

    beforeEach(function(){
        tags = {};
        parser = new Parser();
    })

    it('should parse the Info Header correctly', function(done){

        require('fs' ).createReadStream('./vorbis.ogg', { start: 28, end: 58 })
            .pipe(parser)

        parser
            .on('data', function(t){
                tags[t.type] = t.value;
            })
            .on('error', function(){
                tags.should.have.property('version' ).that.equals(0)
                tags.should.have.property('channels' ).that.equals(1)
                tags.should.have.property('bitRateMax' ).that.equals(0)
                tags.should.have.property('bitRateNominal' ).that.equals(80000)
                tags.should.have.property('bitRateMin' ).that.equals(0)
                done()
            })
    })

    it('should parse the Comment Header correctly', function(done){

        require('fs' ).createReadStream('./vorbis.ogg', { start: 232, end: 37522 })
            .pipe(parser)

        parser
            .on('data', function(t){
                tags[t.type] = t.value;
            })
            .on('error', function(){
                this.end()
            }).on('end', function(){
                tags.should.have.property('ALBUM' ).that.equals('my album')
                tags.should.have.property('ALBUM' ).that.equals('my album')
                tags.should.have.property('ARTIST' ).that.equals('an artist')
                tags.should.have.property('GENRE' ).that.equals('Christian Gangsta Rap')
                tags.should.have.property('TRACKNUMBER' ).that.equals('1')

                tags.should.have.property('METADATA_BLOCK_PICTURE' )
                tags.should.have.deep.property('METADATA_BLOCK_PICTURE.mime' ).that.equals('image/png')
                tags.should.have.deep.property('METADATA_BLOCK_PICTURE.desc' ).that.equals('')
                tags.should.have.deep.property('METADATA_BLOCK_PICTURE.info' )
                tags.should.have.deep.property('METADATA_BLOCK_PICTURE.data.length' ).that.equals(23867)
                done()
            })
    })
})


