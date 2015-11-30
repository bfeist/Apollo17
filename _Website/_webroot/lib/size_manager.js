/*########################################################*/
/*-------------- SizeManager --------------------*/
/*
requires:
-jQuery

dependencies:
-
*/

(function($)
{
	$(document).ready(function() {
		$('[data-js-class="SizeManager"]').sizeManager();
	});

	// constructor
	function SizeManager(root, conf)
	{
		// Private vars ------------------------------------------------------------------
		var $root = $(root),
			_root = $root[0],
			_self = this,
			_classId = 'SizeManager',

      _resizeTestDelay = 100,
      _minHeight,
      _buddyMaxHeight,
      $displayParent,
      $sizeBuddy,

			$opts = {
				showDebugInfo: false
			};
		$.extend($opts, conf);

		// Public methods ------------------------------------------------------------------
		$.extend(_self, {
			func: function(){

			}
		});

		// Private methods -----------------------------------------------------------------
		function init() {
        _trace('init');

         if ($root.attr('data-sm-parent') == '.video-block') {
          $opts.showDebugInfo = true;
         }

        $displayParent = $($root.attr('data-sm-parent'));
        $sizeBuddy = $($root.attr('data-sm-buddy'));
        _minHeight = parseInt($root.attr('data-sm-min-height'));

        //if there are any aspect-holder images in our parent wait for them to load
        var $aspectHolders = $displayParent.find('.aspect-holder');
        if ($aspectHolders.length > 0) {
          _trace('waiting for images');
          $displayParent.waitForImages(function() {
            positionMe();
          });
        } else {
          positionMe();
        }

        $(window).on('resize', $.throttle( $.proxy(positionMe, this), _resizeTestDelay));
		};

    function positionMe() {
      $root.hide();
      $displayParent.siblings().css('display', 'none');

      //$sizeBuddy.removeAttr('style');
      $sizeBuddy.css('height', '');

      var bodyHeight = $('body').height();
      var parentOffset = $displayParent.offset();
      var contentHeight = 0;
      $displayParent.children().not($root).each(function () {
        var $this = $(this);
        _trace('HEY - ' + this.className);
        var myHeight;
        if ($this.find('.aspect-holder').length > 0) {
          myHeight = $this.find('.aspect-holder').height();
          $this.height(myHeight);
          _trace('-- aspect-holder found, resized this to same height as aspect holder');
        } else {
          myHeight = $this.outerHeight(true);
        }
        contentHeight += myHeight;
        _trace(' -- myHeight: ' + myHeight);
        _trace(' -- contentHeight: ' + contentHeight);
      });
      // var parentHeight = $displayParent.outerHeight();

      var myTopBottomBuffer = $root.outerHeight(true) - $root.height(); //total of margin, borders and padding
      // var bottomPadding = parseInt( $root.css('marginTop') ) * 2;

      var availHeight = bodyHeight - (parentOffset.top + contentHeight + myTopBottomBuffer);

      _trace('bodyHeight: ' + bodyHeight);
      _trace('parentOffset.top: ' + parentOffset.top);
      _trace('contentHeight: ' + contentHeight);
      _trace('myTopBottomBuffer: ' + myTopBottomBuffer);
      _trace('availHeight: ' + availHeight);


      if (availHeight < _minHeight) {
        _trace('forcing _minHeight and scaling down $sizeBuddy; _minHeight: ' + _minHeight);
        var diff = availHeight - _minHeight;
        var targetHeight = $sizeBuddy.height() - Math.abs(diff);
        $sizeBuddy.height(targetHeight);
        $root.show().height(_minHeight - myTopBottomBuffer);
      } else {
      _trace(' erg - availHeight: ' + availHeight);
        $root.show().height(availHeight - myTopBottomBuffer);
      }

      $displayParent.siblings().css('display', '');
    };

		function _trace(str, withId) {
			withId = withId == false ? false : true;
			if ($opts.showDebugInfo == true) {
				try {
					if (withId == true) {
						str = _classId + ': ' + str;
					}
					console.log(str);
				} catch(e) {
					// no console no log
				}
			}
		};

		init();
	};

	// jQuery plugin implementation
	$.fn.sizeManager = function(conf) {
		var opts = {}; //defaults
		$.extend(opts, conf);

		this.each(function() {
			var $instance = new SizeManager(this, opts);
			$(this).data('sizeManager', $instance);
		});

		return this;
	};
})(jQuery);