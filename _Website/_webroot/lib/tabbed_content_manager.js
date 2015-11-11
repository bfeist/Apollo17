/*########################################################*/
/*-------------- TabbedContentManager --------------------*/
/*
requires:
-jQuery
-getQueryVars() function defined in global_scripts.js

dependencies:
-
*/

(function($)
{	
	$(document).ready(function() {
		$('[data-js-class="TabbedContentManager"]').tabbedContentManager();
	});
	
	// constructor
	function TabbedContentManager(root, conf)
	{	
		// Private vars ------------------------------------------------------------------
		var $root = $(root),
			_root = $root[0],
			_self = this,
			_classId = 'TabbedContentManager',

			$sections,
			
			$controls,
			$secondaryControls, //allow for additional elements to control the content; use data-tc-secondary="true" attribute with same data-tc-id value
			
			_contentId,
			_selectedIndex,
			
			$opts = {
				showDebugInfo: true
			};
		$.extend($opts, conf);

		// Public methods ------------------------------------------------------------------		
		$.extend(_self, {
			func: function(){
				
			}
		});

		// Private methods -----------------------------------------------------------------
		function init() {
			_contentId = $root.attr('data-tc-id');
			
			if (_contentId) {
				$controls = $root.find('a')
					.each(function(i) {
						$(this).data('index', i);
					})
					.on('click', onLinkClick);
				$secondaryControls = $('[data-tc-secondary][data-tc-id="' + _contentId + '"][data-tc-index]').on('click', $.proxy(onSecondaryLinkClick, this));
				
				$sections = $('[data-tc-target][data-tc-id="' + _contentId + '"]');
				
				setSelected();

				_trace('$sections: ' + $sections.length);
			} else {
				_trace('no data-tc-id attribute - not initializing');
			}
				
		};
		
		function onSecondaryLinkClick(evt) {
			_trace ('onSecondaryLinkClick;');
			setSelected(parseInt($(evt.currentTarget).attr('data-tc-index')));
			return false;
		};
		
		function onLinkClick(evt) {
			_trace ('onLinkClick;');
			setSelected(parseInt($(evt.currentTarget).data('index')));
			return false;
		};
		
		
		
		function setSelected(index) {
			_trace('setSelected; index: ' + index);
			if (index == undefined) {
				index = 0;
			}
			if (index != _selectedIndex) {
				_selectedIndex = index;
				$controls.removeClass('selected').eq(_selectedIndex).addClass('selected');
				
				$sections.hide()
					.eq(_selectedIndex).show();
			}
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
	$.fn.tabbedContentManager = function(conf) {
		var opts = {}; //defaults
		$.extend(opts, conf);
		
		this.each(function() {
			var $instance = new TabbedContentManager(this, opts);
			$(this).data('tabbedContentManager', $instance);
		});
		
		return this;
	};
})(jQuery);