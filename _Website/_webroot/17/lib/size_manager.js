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

       //if ($root.attr('data-sm-parent') == '.video-block') {
       // $opts.showDebugInfo = true;
       //}

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

      $sizeBuddy.css('height', '');

      var bodyHeight = $('body').height();
      var parentOffset = $displayParent.offset();
      var contentHeight = 0;
      var totalSpacingPadding = 0;
      _trace('---------- root: ' + $root.attr('class') + ' ----------');
      $displayParent.children().not($root).each(function () {
        var $this = $(this);
        _trace('HEY - ' + this.className);
        if ($this.find('.aspect-holder').length > 0) {
          var aspectHeight = $this.find('.aspect-holder').height();

          _trace(' -- aspect-holder found with height: ' + aspectHeight + ', resized $this from old height:' + $this.height() );
          $this.height(aspectHeight);
        }
        var myHeight = $this.outerHeight();
        var spacingPadding = $this.outerHeight(true) - $this.height();
        contentHeight += myHeight;
        totalSpacingPadding += spacingPadding;
        _trace(' -- myHeight: ' + myHeight);
        _trace(' -- spacingPadding: ' + spacingPadding);
        _trace(' -- contentHeight: ' + contentHeight);
      });
      // var parentHeight = $displayParent.outerHeight();

      var buddySpacingPadding = $sizeBuddy.outerHeight(true) - $sizeBuddy.height();
      totalSpacingPadding -= buddySpacingPadding; //not sure why, but the buddy's padding is counted twice and must be subtracted from the total padding adjustment

      var myTopBottomBuffer = $root.outerHeight(true) - $root.height(); //total of margin, borders and padding
      // var bottomPadding = parseInt( $root.css('marginTop') ) * 2;

      var availHeight = bodyHeight - (parentOffset.top + contentHeight + myTopBottomBuffer + totalSpacingPadding);

      _trace('------ totals ------');
      _trace(' -- buddySpacingPadding: ' + buddySpacingPadding);
      _trace(' -- bodyHeight - : ' + bodyHeight);
      _trace(' -- (parentOffset.top: ' + parentOffset.top);
      _trace(' -- + contentHeight: ' + contentHeight);
      _trace(' -- + myTopBottomBuffer: ' + myTopBottomBuffer);
      _trace(' -- + totalSpacingPadding): ' + totalSpacingPadding);
      _trace(' -- =availHeight: ' + availHeight);

      if (availHeight < _minHeight) {
        _trace(' -- forcing _minHeight and scaling down $sizeBuddy; _minHeight: ' + _minHeight);
        var diff = availHeight - _minHeight;
        var targetHeight = $sizeBuddy.height() - Math.abs(diff);
        $sizeBuddy.height(targetHeight);
        $root.show().height(_minHeight);
      } else {
        $root.show().height(availHeight);
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