var VUEPLAYER = function () {

  var currentPopperSongIndex2;
  var currentPopperSongIndex;
  var currentPopperSong;

  // Hiie rating popover on click
  $(document).mouseup(function (e) {
    if (!($(e.target).hasClass("pop-c"))) {
      $("#pop").css("visibility", "hidden");
      currentPopperSongIndex = false;
    }
  });


  // Template for playlist items
  Vue.component('playlist-item', {
    template: '\
      <div class="noselect playlist-item" v-bind:class="{ playing: (this.index == positionCache.val) }" >\
        <span class="drag-handle"><img src="/public/img/drag-handle.svg"></span><span v-on:click="goToSong($event)" class="song-area">{{ comtext }}</span>\
        <div class="song-button-box">\
          <span v-on:click="removeSong($event)" class="removeSong">X</span>\
          <span v-on:click="createPopper($event)" class="songDropdown pop-c">\
            {{ratingNumber}}<img class="star-small pop-c" src="/public/img/star.svg">\
          </span>\
        </div>\
      </div>',

    props: ['index', 'song'],

    // We need the positionCache to track the currently playing song
    data: function () {
      return {
        positionCache: MSTREAMPLAYER.positionCache,
      }
    },

    // Methods used by playlist item events
    methods: {
      // Go to a song on item click
      goToSong: function (event) {
        MSTREAMPLAYER.goToSongAtPosition(this.index);
      },
      // Remove song
      removeSong: function (event) {
        MSTREAMPLAYER.removeSongAtPosition(this.index, false);
      },
      createPopper: function (event) {
        if (currentPopperSongIndex === this.index) {
          currentPopperSongIndex = false;
          $("#pop").css("visibility", "hidden");
          return;
        }
        var ref = event.target;
        currentPopperSongIndex = this.index;
        currentPopperSongIndex2 = this.index;

        currentPopperSong = this.song;

        $('.my-rating').starRating('setRating', this.song.metadata.rating / 2)

        const pop = document.getElementById('pop');
        var popper = new Popper(ref, pop, {
          placement: 'bowrgwr', // Putting ibberish here gives us the behavioru we want.  It't not a bug, it's a feature
          onCreate: function (data) {
            $("#pop").css("visibility", "visible");
          },
          modifiers: {
            flip: {
              boundariesElement: 'scrollParent',
            },
            preventOverflow: {
              boundariesElement: 'scrollParent'
            }
          }
        });
      }
    },
    computed: {
      comtext: function () {
        var returnThis = this.song.filepath;

        if (this.song.metadata.title) {
          returnThis = this.song.metadata.title;
          if (this.song.metadata.artist) {
            returnThis = this.song.metadata.artist + ' - ' + returnThis;
          }
        }

        return returnThis;
      },
      ratingNumber: function () {
        if (!this.song.metadata.rating) {
          return '';
        }
        var returnThis = this.song.metadata.rating / 2;
        if (!Number.isInteger(returnThis)) {
          returnThis = returnThis.toFixed(1);
        }

        return returnThis;
      }
    }
  });

  // Code to update playlist
  var playlistElement = new Vue({
    el: '#playlist',
    data: {
      playlist: MSTREAMPLAYER.playlist,
    },
    methods: {
      // checkMove is called when a drag-and-drop action happens
      checkMove: function (event) {
        $("#pop").css("visibility", "hidden");
        MSTREAMPLAYER.resetPositionCache();
      }
    }
  });


  var jukeStats = false
  if (typeof JUKEBOX !== 'undefined') {
    jukeStats = JUKEBOX.stats
  }


  // TODO: Get volume from cookies
  var progressBar = new Vue({
    el: '#mstream-player',
    data: {
      playerStats: MSTREAMPLAYER.playerStats,
      playlist: MSTREAMPLAYER.playlist,
      positionCache: MSTREAMPLAYER.positionCache,
      met: MSTREAMPLAYER.playerStats.metadata,
      jukebox: jukeStats,
      curVol: 100, // Manage our own volume
      lastVol: 100
    },
    watch: {
      curVol: function () {
        // TODO: Convert to log scale before sening to mstream
        // position will be between 0 and 100
        // var minp = 0;
        // var maxp = 100;
        //
        // // The result should be between 100 an 10000000
        // var minv = Math.log(100);
        // var maxv = Math.log(10000000);
        //
        // // calculate adjustment factor
        // var scale = (maxv-minv) / (maxp-minp);
        //
        // var solution = Math.exp(minv + scale*(this.curVol-minp))
        MSTREAMPLAYER.changeVolume(parseInt(this.curVol));
      }
    },
    computed: {
      imgsrc: function () {
        return "/public/img/" + (this.playerStats.playing ? 'pause' : 'play') + "-white.svg";
      },
      volumeSrc: function () {
        return "/public/img/" + (this.playerStats.volume !== 0 ? 'volume' : 'volume-mute') + ".svg";
      },
      widthcss: function () {
        if (this.playerStats.duration === 0) {
          return "width:0";
        }

        var percentage = 100 - ((this.playerStats.currentTime / this.playerStats.duration) * 100);
        return "width:calc(100% - " + percentage + "%)";
      },

      showTime: function () {
        if (this.playerStats.duration === 0) {
          return '';
        }

        var curr = this.playerStats.duration - this.playerStats.currentTime;
        var minutes = Math.floor(curr / 60);
        var secondsToCalc = Math.floor(curr % 60) + '';
        var currentText = minutes + ':' + (secondsToCalc.length < 2 ? '0' + secondsToCalc : secondsToCalc);

        return currentText;
      },

      currentSongText: function () {
        // Call these vars so updates cahnge whenever they do
        var posit = this.positionCache.val;
        var plist = this.playlist;
        var playerStats = this.playerStats;
        var titleX = this.met.title;
        var metx = this.met;

        var currentSong = MSTREAMPLAYER.getCurrentSong();

        if (currentSong === false) {
          return '\u00A0\u00A0\u00A0Welcome To mStream!\u00A0\u00A0\u00A0';
        }

        // Get current song straight from the source
        var returnText = '';
        if (playerStats.metadata && titleX) {
          returnText = titleX;
          if (playerStats.metadata.artist) {
            returnText = playerStats.metadata.artist + ' - ' + returnText;
          }
        } else {
          // Use filepath instead
          var filepathArray = currentSong.filepath.split("/");
          returnText = filepathArray[filepathArray.length - 1]
        }

        return '\u00A0\u00A0\u00A0' + returnText + '\u00A0\u00A0\u00A0';
      }
    },
    methods: {
      toggleRepeat: function () {
        MSTREAMPLAYER.toggleRepeat();
      },
      toggleShuffle: function () {
        MSTREAMPLAYER.toggleShuffle();
      },
      toggleAutoDJ: function () {
        MSTREAMPLAYER.toggleAutoDJ();
      },
      fadeOverlay: function () {
        if ($('#main-overlay').is(':visible')) {
          $('#main-overlay').fadeOut("slow");
        } else {
          $('#main-overlay').fadeIn("slow");
        }
      },
      toggleVolume: function () {
        if (this.playerStats.volume === 0) {
          MSTREAMPLAYER.changeVolume(this.lastVol);
          this.curVol = this.lastVol;
        } else {
          this.lastVol = this.curVol;
          MSTREAMPLAYER.changeVolume(0);
          this.curVol = 0;
        }
      }
    }
  });


  var metadataPanel = new Vue({
    el: '#metadata-panel',
    data: {
      meta: MSTREAMPLAYER.playerStats.metadata
    },
    computed: {
      albumArtPath: function () {
        if (!this.meta['album-art']) {
          return '/public/img/default.png';
        }
        return '/album-art/' + this.meta['album-art'];
      }
    }
  });

  var mainOverlay = new Vue({
    el: '#main-overlay',
    data: {
      meta: MSTREAMPLAYER.playerStats.metadata
    },
    computed: {
      albumArtPath: function () {
        if (!this.meta['album-art']) {
          return '/public/img/default.png';
        }
        return '/album-art/' + this.meta['album-art'];
      }
    }
  });


  var metadataBox = new Vue({
    el: '#meta-box',
    data: {
      meta: MSTREAMPLAYER.playerStats.metadata
    },
    computed: {
      albumArtPath: function () {
        if (!this.meta['album-art']) {
          return '/public/img/default.png';
        }
        return '/album-art/' + this.meta['album-art'];
      }
    }
  });

  // Button Events
  document.getElementById("progress-bar").addEventListener("click", function (event) {
    var relativeClickPosition = event.clientX - this.getBoundingClientRect().left;
    var totalWidth = this.getBoundingClientRect().width;
    var percentage = (relativeClickPosition / totalWidth) * 100;
    // Set Player time
    MSTREAMPLAYER.seekByPercentage(percentage);
  });

  // Button Events
  document.getElementById("next-button").addEventListener("click", function () {
    MSTREAMPLAYER.nextSong();
  });
  document.getElementById("play-pause-button").addEventListener("click", function () {
    MSTREAMPLAYER.playPause();
  });
  document.getElementById("previous-button").addEventListener("click", function () {
    MSTREAMPLAYER.previousSong();
  });

  // This makes the title text scroll back and forth
  var scrollTimer;
  var scrollRight = true; //Track Scroll Direction
  function startTime(interval) {
    if (scrollTimer) { clearInterval(scrollTimer); }

    scrollTimer = setInterval(function () {
      // Get the max scroll distance
      var maxScrollLeft = document.getElementById('title-text').scrollWidth - document.getElementById('title-text').clientWidth;

      // Change the scroll direction if necessary
      // TODO: Pause for a second when these conditions are hit
      if (document.getElementById('title-text').scrollLeft > (maxScrollLeft - 1)) {
        scrollRight = false;
      }
      if (document.getElementById('title-text').scrollLeft === 0) {
        scrollRight = true;
      }

      // Do the scroll
      if (scrollRight === true) {
        document.getElementById('title-text').scrollLeft = document.getElementById('title-text').scrollLeft + 2;
      } else {
        document.getElementById('title-text').scrollLeft = document.getElementById('title-text').scrollLeft - 2;
      }
    }, interval);
  }
  startTime(50);


  // Change spacebar behviour to Play/PauseListen
  window.addEventListener("keydown", function (event) {
    // Use default behavior if user is in a form
    var element = event.target.tagName.toLowerCase();
    if (element == 'input' || element == 'textarea') {
      return;
    }

    // Check the key
    switch (event.keyCode) {
      case 32: //SpaceBar
        event.preventDefault();
        MSTREAMPLAYER.playPause();
        break;
    }
    return false;
  }, false);


  $(".my-rating").starRating({
    starSize: 22,
    disableAfterRate: false,
    useGradient: false,
    hoverColor: '#26477b',
    activeColor: '#6684b2',
    ratedColor: '#6684b2',
    callback: function (currentRating, $el) {
      MSTREAMPLAYER.editSongMetadata('rating', parseInt(currentRating * 2), currentPopperSongIndex2);

      // make a server call here
      MSTREAMAPI.rateSong(currentPopperSong.filepath, parseInt(currentRating * 2), function (res, err) {
      });
    }
  });

};
