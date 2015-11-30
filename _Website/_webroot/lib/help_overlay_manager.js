/*########################################################*/
/*-------------- HelpOverlayManager --------------------*/
/*
requires:
-jQuery

dependencies:
-
*/

(function($)
{
  $(document).ready(function() {
      $('[data-js-class="HelpOverlayManager"]').helpOverlayManager();
  });

  // constructor
  function HelpOverlayManager(root, conf)
  {
    // Private vars ------------------------------------------------------------------
    var $root = $(root),
        _root = $root[0],
        _self = this,
        _classId = 'HelpOverlayManager',
  
        _resizeTestDelay = 100,
        $overlayTarget, //multiple elements, uses total width and max height of elements for positioning
        _forceBottom = false, //if set to true with data param (data-force-bottom="true") the positioned element will keep the bottom attribute as set in the CSS
        
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

       if ($root.attr('data-overlay-target') == '.body') {
        $opts.showDebugInfo = true;
       }

       _forceBottom = $root.attr('data-force-bottom') || false;
       _trace('_forceBottom: ' + _forceBottom);

      $overlayTarget = $($root.attr('data-overlay-target'));
      if ($overlayTarget.length > 0) {
        positionMe();
        $(window).on('resize', $.throttle( $.proxy(positionMe, this), _resizeTestDelay));
      } else {
        _trace('no data-overlay-target/applicable elements');
      }

    };

    function positionMe() {
      // var targetTopBuffer = parseInt($overlayTarget.css('marginTop')) + parseInt($overlayTarget.css('paddingTop')) + parseInt($overlayTarget.css('borderTopWidth'));

      // var targetLeftBuffer = parseInt($overlayTarget.css('marginLeft')) + parseInt($overlayTarget.css('paddingLeft')) + parseInt($overlayTarget.css('borderLeftWidth'));
      // _trace('targetTopBuffer: ' + targetTopBuffer);
      // _trace('targetLeftBuffer: ' + targetLeftBuffer);

      var targetPos = $overlayTarget.eq(0).position();
      // targetPos.top -= targetTopBuffer;
      // targetPos.left -= targetLeftBuffer;

      var targetWidth = 0;
      var targetHeight = 0;
      $overlayTarget.each(function(){
        var $this = $(this);
        targetWidth += $this.outerWidth(true);
        targetHeight = Math.max($this.outerHeight(true), targetHeight);
      });

      _trace('targetPos...');
      _trace(targetPos, false);
      _trace('targetWidth: ' + targetWidth);
      _trace('targetHeight: ' + targetHeight);

      var cssProps = {
        top: targetPos.top + 'px',
        left: targetPos.left + 'px',
        width: targetWidth + 'px'
      };

      if (!_forceBottom) {
        cssProps['height'] = targetHeight + 'px';
      }

      $root.css(cssProps);
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
  $.fn.helpOverlayManager = function(conf) {
    var opts = {}; //defaults
    $.extend(opts, conf);

    this.each(function() {
        var $instance = new HelpOverlayManager(this, opts);
        $(this).data('helpOverlayManager', $instance);
    });

    return this;
  };
})(jQuery);