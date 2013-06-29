re.c('hero')
.requires('hero.png tsprite update force animate body')
.defines({
  
  speed:40 * re.sys.stepSize,
  
  friX:0.75,
  friY:0.95,
  
  padX:6,
  
  bodyX:24,
  bodyY:24,
  
  jumpSpeed:90 * re.sys.stepSize,
  jump:false,
  ground:true,
  
  update:function(){
    
    //jump
    if(re.pressed('w')){
      this.forceJump();
    }
    
    //walk back and fourth
    if(re.pressed('a')){
      this.velX -= this.speed;
      this.scaleX = -1;
      
      if(!this.jump) this.animate('run');
    }
    
    if(re.pressed('d')){
      this.velX += this.speed;
      this.scaleX = 1;
      
      if(!this.jump) this.animate('run');
    }
    
    //switch back to idle animation if stopped moving
    if(this.isIdle(0.3)) this.animate('idle');
    
  },
  
  forceJump:function(){
    this.jump = true;
    this.velY -= this.jumpSpeed * 0.1;
    
    this.animate('jump');
  },
  
  jumpReset:function(x, y, tx, ty){
    //check if a hit happened on the y axis
    if(y){
      this.jump = false;
      this.ground = (ty >= this.posY);
    }
  }
  
})
.init(function(){
  // mic input
  // -----------------------------

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
      return 440 * Math.pow(2,(note-69)/12);
      
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

   
      var confidence = (num_cycles ? ((num_cycles/(pitch * buflen / audioContext.sampleRate)) * 100) : 0);

   
      if (num_cycles !== 0) {
        var note =  noteFromPitch( pitch );
        
        var detune = centsOffFromPitch( pitch, note );

      }

      rafID = window.webkitRequestAnimationFrame( updatePitch );
    }

    // initialize microphone
    getInput();


  // -----------------------------  



  //add animations
  this.animates = {
	  idle:[800, [0, 1], -1],
	  run:[800, [2, 3], 1],
	  jump:[500, [4, 5, 4], 1],
	  ladder:[500, [6, 7], -1]
	};
  
  this.on({
    update:this.update,
    aftermath:this.jumpReset
  });
  
});
