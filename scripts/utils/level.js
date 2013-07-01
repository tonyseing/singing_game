re.c('level')
  .defines({
    
    build:function(){
      if(re.hitmap){
        re.hitmap.dispose();
      }
      re.hitmap = re.e('hitmap');
      
      this.placeTiles();
      
      this.placeHero();
      
      //items requires hero to be defined first
      this.placeItems();
      
    },
    
    teardown:function(){
      //todo
    },
    
    placeTiles:function(){
      
      var map = this.layer.data.$;
      
      for(var y=0; y<map.length; y++){
        
        for(var x=0; x<map[0].length; x++){
          
          var v = map[y][x];
          
          if(v){
            v--;
            
            re.e('tile').attr({
              tileX:x,
              tileY:y,
              frame:v
            });
            
            //add to hitmap
            re.hitmap.automap(x, y, 1);
            
          }
          
        }
        
      }
      
    },
    
    placeItems:function(){
      
      var gid = this.tileset[2].firstgid;
      var items = this.objectgroup[1].object;
      
      for(var i in items){
        var it = items[i];
        
        var frame = items[i].gid - gid;
        
        re.e('t'+frame).attr({
          posX:it.x,
          posY:it.y - re.tile.sizeY,
          frame:frame
        });
        
      }
    },

    micController: function() {
      var audioContext = new webkitAudioContext();
      var isPlaying = false;
      var sourceNode = null;
      var analyser = null;
      var theBuffer = null;
      
      var detectorElem, 
      canvasElem,
      pitchElem,
      noteElem,
      detuneElem,
      detuneAmount;



      function convertToMono( input ) {
        var splitter = audioContext.createChannelSplitter(2);
        var merger = audioContext.createChannelMerger(2);

        input.connect( splitter );
        splitter.connect( merger, 0, 0 );
        splitter.connect( merger, 0, 1 );
        return merger;
      }

      function error() {
        alert('Stream generation failed.');
      }

      function getUserMedia(dictionary, callback) {
        try {
          navigator.webkitGetUserMedia(dictionary, callback, error);
        } catch (e) {
          console.log('webkitGetUserMedia threw exception :' + e);
        }
      }

      function gotStream(stream) {
        // Create an AudioNode from the stream.
        var mediaStreamSource = audioContext.createMediaStreamSource(stream);

        // Connect it to the destination.
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        convertToMono( mediaStreamSource ).connect( analyser );

        updatePitch();
      }

      function   getInput() {
        getUserMedia({audio:true}, gotStream);
      }



      var rafID = null;
      var tracks = null;
      var buflen = 1024;
      var buf = new Uint8Array( buflen );
      var MINVAL = 134;  // 128 == zero.  MINVAL is the "minimum detected signal" level.

      function findNextPositiveZeroCrossing( start ) {
        var i = Math.ceil( start );
        var last_zero = -1;
        // advance until we're zero or negative
        while (i<buflen && (buf[i] > 128 ) )
          i++;
        if (i>=buflen)
          return -1;

        // advance until we're above MINVAL, keeping track of last zero.
        while (i<buflen && ((t=buf[i]) < MINVAL )) {
          if (t >= 128) {
            if (last_zero == -1)
	      last_zero = i;
          } else
            last_zero = -1;
          i++;
        }

        // we may have jumped over MINVAL in one sample.
        if (last_zero == -1)
          last_zero = i;

        if (i==buflen)	// We didn't find any more positive zero crossings
          return -1;

        // The first sample might be a zero.  If so, return it.
        if (last_zero == 0)
          return 0;

        // Otherwise, the zero might be between two values, so we need to scale it.

        var t = ( 128 - buf[last_zero-1] ) / (buf[last_zero] - buf[last_zero-1]);
        return last_zero+t;
      }

      var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

      function noteFromPitch( frequency ) {
        var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
        
        return Math.round( noteNum ) + 69;
      }

      function frequencyFromNoteNumber( note ) {
        console.log("frequencyFromNoteNumber: " + (440 * Math.pow(2,(note-69)/12)));
        flyFromFrequency(440 * Math.pow(2,(note-69)/12));
        return 440 * Math.pow(2,(note-69)/12);
        
      }

      function  flyFromFrequency(frequency) {
        for (var i = 0, jumpLimit = frequency / 100; i < jumpLimit; i++) {
          hero.forceJump();
          console.log("flyFromFrequency() frequency: " + frequency)
        }
      }

      function centsOffFromPitch( frequency, note ) {

        return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
      }

      function updatePitch( time ) {
        var cycles = new Array;
        analyser.getByteTimeDomainData( buf );

        var i=0;
        // find the first point
        var last_zero = findNextPositiveZeroCrossing( 0 );

        var n=0;
        // keep finding points, adding cycle lengths to array
        while ( last_zero != -1) {
          var next_zero = findNextPositiveZeroCrossing( last_zero + 1 );
          if (next_zero > -1)
            cycles.push( next_zero - last_zero );
          last_zero = next_zero;

          n++;
          if (n>1000)
            break;
        }

        // 1?: average the array
        var num_cycles = cycles.length;
        var sum = 0;
        var pitch = 0;

        for (var i=0; i<num_cycles; i++) {
          sum += cycles[i];
        }

        if (num_cycles) {
          sum /= num_cycles;
          pitch = audioContext.sampleRate/sum;
        }

        // confidence = num_cycles / num_possible_cycles = num_cycles / (audioContext.sampleRate/)
        var confidence = (num_cycles ? ((num_cycles/(pitch * buflen / audioContext.sampleRate)) * 100) : 0);

        /*
          console.log( 
          "Cycles: " + num_cycles + 
          " - average length: " + sum + 
          " - pitch: " + pitch + "Hz " +
          " - note: " + noteFromPitch( pitch ) +
          " - confidence: " + confidence + "% "
          );
        */
        // possible other approach to confidence: sort the array, take the median; go through the array and compute the average deviation

        //detectorElem.className = (confidence>50)?"confident":"vague";
        // TODO: Paint confidence meter on canvasElem here.



        if (num_cycles !== 0) {
          var note =  noteFromPitch( pitch );
          
          var detune = centsOffFromPitch( pitch, note );

        }

        rafID = window.webkitRequestAnimationFrame( updatePitch );
      }

      getInput();

    },
    
    placeHero:function(){
      var pos = this.objectgroup[0].object;
      hero = re.e('hero').attr({
        posX:pos.x,
        posY:pos.y - re.tile.sizeY //tiled editor adds an extra tile to y
      });

      // initialize microphone
      this.micController(hero);
      
    }
    
  });
