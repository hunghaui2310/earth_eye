(function($) {
	$.fn.extend({
		bRandom: function(min, max) {
			return Math.round(Math.random() * (max - min) + min);
		},

		bToast: function(options, callback) {
			var defaults = {
				message: 'This is default message.',
				speed: 150,
				duration: 2500,
				boxPadding: '6px 12px',
				boxBorder: '0',
				boxCorner: '3px',
				boxOpacity: 0.7,
				bottomMargin: 50,
				textColor: '#fff',
				textSize: '0.9em',
				textWeight: 'bold',
				boxColor: '#283041',
				boxShadow: '0px 0px 3px 0px #6899eb',
				onBoxClose: function() {}
			};

			var opt = $.extend(defaults, options);

			return this.each(function() {
				var px = 'ui-bToast';
				var i = $('.'+ px).length;
				var id = px + '-' + i;

				$(this).append('<div id="'+ id +'" class="'+ px +'"></div>');
				$('#'+ id).bMaxZindex().css({
					opacity: opt.boxOpacity,
					position: 'absolute',
					backgroundColor: '#eee',
					textAlign: 'center',
					left: 0,
					right: 0,
					width: '100%',
					bottom: 0
				}).append('<div class="'+ px +'-box">'+ opt.message +'</div>');

				$('#'+ id +' .'+ px +'-box').css({
					opacity: 0,
					position: 'absolute',
					padding: opt.boxPadding,
					borderRadius: opt.boxCorner,
					border: opt.boxBorder,
					backgroundColor: opt.boxColor,
					fontSize: opt.textSize,
					fontWeight: opt.textWeight,
					color: opt.textColor,
					boxShadow: opt.boxShadow
				});

				var whs = $('#'+ id +' .'+ px +'-box').outerWidth() / 2;

				$('#'+ id +' .'+ px +'-box').css({
					width: $('#'+ id +' .'+ px +'-box').outerWidth() +'px',
					left: 'calc(50% - '+ whs +'px)',
					left: '-moz-calc(50% - '+ whs +'px)',
					left: '-webkit-calc(50% - '+ whs +'px)',
					marginTop: '-'+ (opt.bottomMargin + $('#'+ id +' .'+ px +'-box').outerHeight()) +'px',
					marginLeft: '-'+ (($('#'+ id +' .'+ px +'-box').outerWidth() + (opt.boxPadding*2)) / 2) +'px'
				});

				$('#'+ id +' .'+ px +'-box').animate({
					opacity: 1
				}, opt.speed, function() {
					$('#'+ id +' .'+ px +'-box').delay(opt.duration).animate({
						opacity: 0
					}, opt.speed, function() {
						$('#'+ id).remove();

						if(typeof opt.onBoxClose == 'function') {
							opt.onBoxClose.call();
						}
					});
				});
			});
		},

		bMaxZindex: function(options) {
			var defaults = {
				incNum: 1,
				groupElement: '*'
			};

			var opt = $.extend(defaults, options);

			var zmax = 0;
			$(opt.groupElement).each(function() {
				var c = parseFloat($(this).css('z-index'));
				zmax = c > zmax ? c : zmax;
			});

			return this.each(function() {
				zmax += opt.incNum;
				$(this).css('z-index', zmax);
			});
		},

		bModalBox: function(options) {
			var defaults = {
				boxID: '',
				boxColor: '#000',
				boxOpacity: 0.5,
				boxCloseColor: '#fff',
				boxCloseSize: '48px',
				boxWidth: '450px',
				useBoxClose: true,
				useBoxFixed: false,
				boxScrollTarget: '',
				useClickBoxClose: true,
				clickBoxCloseAction: function() {},
				useAnimation: true,
				duration: 300,
				boxContents: '',
				onBoxClose: function() {}
			};

			var opt = $.extend(defaults, options);

			return this.each(function() {
				var px = 'ui-bModalBox';
				var i = $('.'+ px).length;
				var id = (opt.boxID) ? opt.boxID : px + '-' + i;

				if($('#'+ id).length > 0) $('#'+ id).remove();

				$(this).append('<div id="'+ id +'" class="'+ px +'"></div>');

				var t = $('#'+ id);
				t.css({
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					opacity: opt.useAnimation ? 0 : 1
				}).bMaxZindex();

				t.append('<div class="'+ px +'-modal"></div>');
				t.find('.'+ px +'-modal').css({
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					opacity: opt.boxOpacity,
					background: opt.boxColor,
					zIndex: 1
				});

				if(opt.useBoxFixed) {
					t.css({ position: 'fixed' });

					if(!opt.boxScrollTarget) {
						t.css({
							overflowY: 'scroll',
							'-webkit-overflow-scrolling': 'touch'
						});
					}

					t.find('.'+ px +'-modal').css({
						position: 'fixed'
					});

					$('body').css({ overflow: 'hidden' });
				}

				if(opt.useClickBoxClose) {
					t.find('.'+ px +'-modal').css({ cursor: 'pointer' }).click(function() {
						if(typeof opt.clickBoxCloseAction === 'function') {
							opt.clickBoxCloseAction.call();
						}

						if(opt.useAnimation) {
							t.animate({ opacity: 0 }, opt.duration, function() { t.remove() });
						} else {
							t.remove();
						}
					});
				}

				if(opt.useAnimation) {
					t.animate({ opacity: 1 }, opt.duration);
				}

				t.on('remove', function() {
					$('body').css({ overflow: 'auto' });

					if(typeof opt.onBoxClose === 'function') {
						opt.onBoxClose.call();
					}
				});

				if(opt.useBoxClose) {
					t.append('<div class="'+ px +'-close"></div>');
					t.find('.'+ px +'-close').css({
						position: 'absolute',
						top: '20px',
						right: '20px',
						width: '30px',
						height: '30px',
						lineHeight: '30px',
						textAlign: 'center',
						cursor: 'pointer',
						color: opt.boxCloseColor,
						fontSize: opt.boxCloseSize,
						zIndex: 3
					}).html('×').click(function() {
						if(opt.useAnimation) {
							t.animate({ opacity: 0 }, opt.duration, function() { t.remove() });
						} else {
							t.remove();
						}
					});
				}

				t.append('<div class="'+ px +'-contents"></div>');
				t.find('.'+ px +'-contents').css({
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					width: opt.boxWidth,
					margin: '0 auto',
					zIndex: 2
				}).append('<div class="'+ px +'-wrapper">'+ opt.boxContents +'</div>');

				var ch = t.find('.'+ px +'-contents').height();
				var wh = t.find('.'+ px +'-wrapper').height();
				var nt = (ch / 2) - (wh / 2);

				t.find('.'+ px +'-wrapper').css({ paddingTop: nt +'px' });
			});
		},

		bDialog: function(options) {
			var defaults = {
				boxID: '',
				boxTitle: 'Default Title',
				boxWidth: '300px',
				boxHeight: 'auto',
				boxBorder: '0',
				boxColor: '#fff',
				boxTitleColor: '#edf1f4',
				boxTitleTextColor: '#515151',
				boxCorner: 0,
				boxContainment: 'document',
				cancelDraggable: '.swiper-container, input',
				useBoxDraggable: true,
				useContensDraggable: false,
				draggableObject: '.title',
				useBoxShadow: true,
				useBoxModal: false,
				useBoxFixed: false,
				useBoxResize: false,
				useBoxClose: true,
				useMiniCloseButton: false,
				boxModalColor: '#000',
				boxModalOpacity: 0.5,
				boxContents: '',
				boxOverContentShow: false,
				boxClose: function() {},
				boxPosition: {
					my: "center",
					at: "center",
					of: window,
					collision: "fit",
					// Ensure the titlebar is always visible
					using: function( pos ) {
						var topOffset = $( this ).css( pos ).offset().top;
						if ( topOffset < 0 ) {
							$( this ).css( "top", pos.top - topOffset );
						}
					}
				}
			};

			var opt = $.extend(defaults, options);

			return this.each(function() {
				var me = $(this);
				var px = 'ui-bDialog';
				var i = $('.'+ px).length;
				var id = (opt.boxID) ? opt.boxID : px + '-' + i;

				if($('#'+ id).length > 0) $('#'+ id +':ui-dialog').dialog('destroy');

				me.append('<div id="'+ id +'" title="'+ opt.boxTitle +'" class="'+ px +'"><div class="inbox"></div></div>');

				var t = $('#'+ id);
				t.find('.inbox').html(opt.boxContents);

				t.dialog({
					width: opt.boxWidth,
					height: opt.boxHeight,
					modal: opt.useBoxModal,
					resizable: opt.useBoxResize,
					draggable: opt.useBoxDraggable,
					position: opt.boxPosition,
					closeOnEscape: false
				});

				if(opt.useBoxModal) {
					t.parents('.ui-dialog').next('.ui-widget-overlay').bMaxZindex().css({
						background: opt.boxModalColor,
						opacity: opt.boxModalOpacity
					});
				}

				if(opt.useBoxFixed) {
					t.find('.inbox').css({
						position: 'fixed',
						top: t.closest('.ui-dialog').offset().top + 'px',
						left: t.closest('.ui-dialog').offset().left + 'px',
						width: t.closest('.ui-dialog').outerWidth() + 'px',
						margin: '0 auto',
						background: '#fff',
						overflowY: 'auto',
						'-webkit-overflow-scrolling': 'touch'
					});

					var bh = $('body').height(),
						ih = t.find('.inbox').outerHeight(),
						nb = (bh > ih) ? bh - (ih + t.closest('.ui-dialog').offset().top) : 0;

					t.find('.inbox').css({ bottom: nb + 'px' });

					$('body').css({ overflow: 'hidden' });

					t.on('remove', function() {
						$('body').css({ overflow: 'auto' });
					});
				}

				t.parents('.ui-dialog').css({
					padding: 0,
					border: opt.boxBorder,
					backgroundColor: opt.boxColor,
					borderRadius: opt.boxCorner + 'px',
					boxShadow: (opt.useBoxShadow) ? '0px 0px 3px 0px #6899eb' : ''
				}).bMaxZindex();

				if(!opt.useBoxDraggable && opt.useContensDraggable) {
					if(opt.draggableObject && t.find(opt.draggableObject).length > 0) {
						t.parents('.ui-dialog').draggable({ handle: opt.draggableObject, containment: opt.boxContainment });
						t.find(opt.draggableObject).css({ cursor: 'move' });
					} else t.parents('.ui-dialog').draggable({ containment: opt.boxContainment, cancel: opt.cancelDraggable });
				}

				t.parent().find('.ui-dialog-titlebar .ui-button').remove();

				if(opt.boxTitle == '') t.parent().find('.ui-dialog-titlebar').remove();
				else {
					t.parent().find('.ui-dialog-titlebar').css({
						fontSize: '14px',
						fontFamily: 'Roboto',
						fontWeight: 'normal',
						color: opt.boxTitleTextColor,
						background: 'none',
						backgroundColor: opt.boxTitleColor,
						padding: '6px 12px',
						textAlign: 'center',
						border: 0,
						borderRadius: 0,
						borderTopLeftRadius: (opt.boxCorner + 1) +'px',
						borderTopRightRadius: (opt.boxCorner + 1) +'px'
					});

					t.parent().find('.ui-dialog-titlebar .ui-dialog-title').css({
						float: 'initial',
						width: '100%'
					});
				}

				if(opt.useBoxClose) {
					t.parent().prepend('<button class="'+ ((opt.useMiniCloseButton)?'miniD':'d') +'ialogCloseButton"></button>');
					t.parent().find('.'+ ((opt.useMiniCloseButton)?'miniD':'d') +'ialogCloseButton').click(function() {
						$('#'+ id +':ui-dialog').dialog('destroy');
						$('#'+ id).remove();

						if(typeof opt.boxClose == 'function') {
							opt.boxClose.call();
						}
					});
					t.parent().find('.'+ ((opt.useMiniCloseButton)?'miniD':'d') +'ialogCloseButton').css('z-index', '10');
				}

				t.css({
					padding: 0,
					fontSize: '1em',
					position: 'relative',
					backgroundColor: opt.boxColor,
					overflow: opt.boxOverContentShow ? 'visible' : 'auto'
				});

				$('.ui-widget-overlay').on('click touchstart', function() {
					return false;
				});

				if(opt.boxTitle == '') {
					t.css({
						borderRadius: (opt.boxCorner + 1) +'px'
					});
				} else {
					t.css({
						borderBottomLeftRadius: (opt.boxCorner + 1) +'px',
						borderBottomRightRadius: (opt.boxCorner + 1) +'px'
					});
				}
			});
		},

		bAlert: function(options) {
			var defaults = {
				title: 'EarthEye',
				message: 'This is default message.',
				width: '360px',
				confirmText: 'Confirm',
				onClose: function() {}
			};

			var opt = $.extend(defaults, options);

			var id = 'bAlert';
			var o = $('#'+ id);
			var t = $(this);

			if(o.length) return false;

			var markup = [
				'<div class="alert-box">',
				' 	<div class="icon"><img src="/images/icon_alert.svg" height="39" /></div>',
				'	<div class="content">'+ opt.message +'</div>',
				'	<div class="btn-area">',
				'		<button id="bAlertButton" class="btn_common_t2">'+ opt.confirmText +'</button>',
				'	</div>',
				'</div>'
			].join('');

			$('body').bDialog({
				boxID: id,
				boxTitle: opt.title,
				boxWidth: opt.width,
				boxHeight: 'auto',
				boxColor: '#283041',
				boxTitleColor: '#20232d',
				boxTitleTextColor: '#666',
				boxBorder: '0',
				boxCorner: 3,
				useBoxModal: true,
				useBoxClose: false,
				useBoxDraggable: false,
				useBoxShadow: true,
				boxContents: markup
			});

			$('#bAlertButton').click(function() {
				closebDialog(id);

				try {
					if(t.length) t.focus();
				} catch(e) {
					//console.log(e);
				}

				if (typeof opt.onClose === "function") {
					opt.onClose.call();
				} else {
					return false;
				}
			});
		},

		bConfirm: function(options) {
			var defaults = {
				title: 'Confirm',
				message: 'This is default message.',
				width: '360px',
				buttons: {},
				init: function() {}
			};

			var opt = $.extend(defaults, options);

			var id = 'bConfirm';
			var o = $('#'+ id);
			var t = $(this);

			if(o.length) return false;

			var button = '';
			$.each(opt.buttons, function(name, obj) {
				if (name == "Confirm") {
					button += ' <button class="submitButton btn_common_t2 btn-confirm">Confirm</button>';
				} else if (name == "Cancel") {
					button += ' <button class="submitButton btn_common_t1 btn-cancel">Cancel</button>';
				} else {
					button += ' <button class="submitButton '+ ((obj['class'])?obj['class']:'btn_common_t1') +'">'+ ((obj['buttonName'] != null) ? obj['buttonName'] : name) +'</button>';
				}

				if(!obj.action) obj.action = function(){};
			});

			var markup = [
				'<div class="confirm-box">',
				' 	<div class="icon"><img src="/images/icon_alert.svg" height="39" /></div>',
				'	<div class="content">'+ opt.message +'</div>',
				'	<div class="btn-area">',
				button,
				'	</div>',
				'</div>'
			].join('');

			$('body').bDialog({
				boxID: id,
				boxTitle: opt.title,
				boxWidth: opt.width,
				boxHeight: 'auto',
				boxColor: '#283041',
				boxTitleColor: '#20232d',
				boxTitleTextColor: '#666',
				boxBorder: '0',
				boxCorner: 3,
				useBoxModal: true,
				useBoxClose: false,
				useBoxDraggable: false,
				useBoxShadow: true,
				boxContents: markup
			});

			var btns = $('#'+ id +' .submitButton'), i = 0;

			$.each(opt.buttons, function(name, obj) {
				btns.eq(i++).click(function() {
					obj.action();
					closebDialog(id);
					return false;
				});
			});

			if (typeof opt.init === "function") {
				opt.init.call();
			}
		},

		bPane: function(options) {
			var defaults = {
				message: 'This is default message.',
				speed: 200,
				duration: 3000,
				boxPadding: '6px 12px',
				boxMarginTop: 8,
				boxMarginLeft: 0,
				boxBorder: '0',
				boxCorner: 6,
				textColor: '#fff',
				textSize: '0.9em',
				textWeight: 'normal',
				boxColor: '#333'
			};

			var opt = $.extend(defaults, options);

			return this.each(function() {
				var px = 'ui-bPane';
				var i = $('.'+ px).length;
				var id = px + '-' + i;
				var t = $(this).parent();

				if($('#'+ id).length) return;

				t.append('<div id="'+ id +'" class="'+ px +'"><div class="arrow">▲</div><div class="message">'+ opt.message +'</div></div>');
				$('#'+ id +' .arrow').css({
					position: 'absolute',
					top: '-12px',
					left: '15px',
					color: opt.boxColor,
					fontSize: '0.6em'
				});

				$('#'+ id +' .message').css({
					color: opt.textColor,
					fontSize: opt.textSize,
					fontWeight: opt.textWeight
				});

				try	{
					$(this).focus();
				} catch(e) {
					$(document).scrollTop($(this).position().top);
				}

				$('#'+ id).css({
					opacity: 0,
					position: 'absolute',
					margin: (opt.boxMarginTop + 2) +'px 0 0 0',
					maxWidth: (t.outerWidth - opt.boxMarginLeft) +'px',
					marginLeft: opt.boxMarginLeft +'px',
					border: opt.boxBorder,
					padding: opt.boxPadding,
					borderRadius: opt.boxCorner +'px',
					background: opt.boxColor
				}).bMaxZindex().animate({
					opacity: 1
				}, opt.speed, function() {
					$(this).delay(opt.duration).animate({
						opacity: 0
					}, opt.speed, function() {
						$(this).remove();
					});
				});
			});
		},

		bDirectionPane: function(options) {
			var defaults = {
				message: 'This is default message.',
				speed: 200,
				duration: 3000,
				boxPadding: '6px 12px',
				boxGap: 5,
				boxBorderSize: 0,
				boxBorderColor: 'transparent',
				boxCorner: 3,
				textColor: '#fff',
				textSize: '12px',
				textWeight: 'normal',
				boxDirection: 'right',
				boxColor: '#333',
				arrowSize: 10,
				boxShadow: ''
			};

			var opt = $.extend(defaults, options);

			return this.each(function() {
				var px = 'ui-bDirectionPane';
				var i = $('.'+ px).length;
				var id = px + '-' + i;
				var t = $(this).parent();

				if($('#'+ id).length) return;

				var markup = [
					'<div id="'+ id +'" class="'+ px +'">',
					'	<div class="arrow"><div class="inarrow"></div></div>',
					'	<div class="message">'+ opt.message +'</div>',
					'</div>'
				].join('');

				if(opt.boxDirection == 'up') {
					t.prepend(markup);
				} else {
					t.append(markup);
				}

				$('#'+ id +' .message').css({
					color: opt.textColor,
					fontSize: opt.textSize,
					fontWeight: opt.textWeight
				});

				var a = $('#'+ id +' .arrow');
				var margin = opt.arrowSize * 2 + opt.boxBorderSize * 2 + opt.boxGap;

				a.css({
					width: 0,
					height: 0,
					position: 'absolute',
					border: opt.arrowSize + 'px solid transparent'
				});

				switch(opt.boxDirection) {
					case "left":
						a.css({
							top: '6px',
							right: '-'+ (opt.arrowSize * 2) +'px',
							borderLeft: opt.arrowSize + 'px solid '+ opt.boxBorderColor,
							borderTop: (opt.arrowSize * 0.8) + 'px solid transparent',
							borderBottom: (opt.arrowSize * 0.8) + 'px solid transparent'
						});

						a.find('.inarrow').css({
							position: 'absolute',
							left: '-'+ opt.arrowSize +'px',
							top: '-'+ ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px',
							border: (opt.arrowSize - (opt.boxBorderSize * 2)) +'px solid transparent',
							borderLeftColor: opt.boxColor,
							borderTop: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent',
							borderBottom: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent'
						});

						margin += $('#'+ id).outerWidth();
						margin = '0 0 0 -'+ margin +'px';
						break;

					case "up":
						a.css({
							left: '12px',
							bottom: '-'+ (opt.arrowSize * 2) +'px',
							borderTop: opt.arrowSize + 'px solid '+ opt.boxBorderColor,
							borderLeft: (opt.arrowSize * 0.8) + 'px solid transparent',
							borderRight: (opt.arrowSize * 0.8) + 'px solid transparent'
						});

						a.find('.inarrow').css({
							position: 'absolute',
							top: '-'+ opt.arrowSize +'px',
							left: '-'+ ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px',
							border: (opt.arrowSize - (opt.boxBorderSize * 2)) +'px solid transparent',
							borderTopColor: opt.boxColor,
							borderLeft: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent',
							borderRight: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent'
						});

						margin += $('#'+ id).outerHeight();
						margin = '-'+ margin +'px 0 0 0';
						break;

					case "down":
						a.css({
							left: '12px',
							top: '-'+ (opt.arrowSize * 2) +'px',
							borderBottom: opt.arrowSize + 'px solid '+ opt.boxBorderColor,
							borderLeft: (opt.arrowSize * 0.8) + 'px solid transparent',
							borderRight: (opt.arrowSize * 0.8) + 'px solid transparent'
						});

						a.find('.inarrow').css({
							position: 'absolute',
							bottom: '-'+ opt.arrowSize +'px',
							left: '-'+ ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px',
							border: (opt.arrowSize - (opt.boxBorderSize * 2)) +'px solid transparent',
							borderBottomColor: opt.boxColor,
							borderLeft: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent',
							borderRight: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent'
						});

						margin += $('#'+ id).outerHeight();
						margin = '0 0 -'+ margin +'px 0';
						break;

					default:
						a.css({
							top: '6px',
							left: '-'+ (opt.arrowSize * 2) +'px',
							borderRight: opt.arrowSize + 'px solid '+ opt.boxBorderColor,
							borderTop: (opt.arrowSize * 0.8) + 'px solid transparent',
							borderBottom: (opt.arrowSize * 0.8) + 'px solid transparent'
						});

						a.find('.inarrow').css({
							position: 'absolute',
							right: '-'+ opt.arrowSize +'px',
							top: '-'+ ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px',
							border: (opt.arrowSize - (opt.boxBorderSize * 2)) +'px solid transparent',
							borderRightColor: opt.boxColor,
							borderTop: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent',
							borderBottom: ((opt.arrowSize * 0.8) - (opt.boxBorderSize * 2)) + 'px solid transparent'
						});

						margin += $('#'+ id).outerWidth();
						margin = '0 -'+ margin +'px 0 0';
				}

				try	{
					$(this).focus();
				} catch(e) {
					$(document).scrollTop($(this).position().top);
				}

				$('#'+ id).css({
					opacity: 0,
					position: 'absolute',
					margin: margin,
					maxWidth: (t.outerWidth - opt.boxGap) +'px',
					border: opt.boxBorderSize + 'px solid ' + opt.boxBorderColor,
					padding: opt.boxPadding,
					borderRadius: opt.boxCorner +'px',
					background: opt.boxColor,
					boxShadow: opt.boxShadow
				}).bMaxZindex().animate({
					opacity: 1
				}, opt.speed, function() {
					$(this).delay(opt.duration).animate({
						opacity: 0
					}, opt.speed, function() {
						$(this).remove();
					});
				});
			});
		},

		bTooltip: function(options, callback) {
			var defaults = {
				textColor: '#fff',
				textSize: '1em',
				boxColor: '#000',
				boxCorner: 3,
				boxPadding: '3px 6px',
				boxGap: 5,
				boxDirection: 'right',
				boxShadow: '0px 0px 3px 0px #6899eb'
			};

			var o = $.extend(defaults, options);

			return this.each(function(i) {
				var me = $(this);
				var name = 'bTooltip_'+ i;
				var gap = o.boxGap;

				me.hover(function() {
					$('body').append('<div class="bTooltip '+ name +'">'+ me.attr('data-btitle') +'</div>');
					$('.'+ name).css({
						position: 'absolute',
						borderRadius: o.boxCorner +'px',
						background: o.boxColor,
						color: o.textColor,
						padding: o.boxPadding,
						fontSize: o.textSize,
						boxShadow: o.boxShadow
					}).hide().bMaxZindex();

					me.mousemove(function(e) {
						if($('.'+ name).css('display') == 'none') $('.'+ name).show();

						var x = e.pageX, y = e.pageY;
						switch(o.boxDirection) {
							case 'left':
								x -= ($('.'+ name).outerWidth() + gap);
								y -= ($('.'+ name).outerHeight() / 2);
								break;
							case 'up':
								x -= ($('.'+ name).outerWidth() / 2);
								y -= ($('.'+ name).outerHeight() + gap);
								break;
							case 'down':
								x -= (($('.'+ name).outerWidth() / 2) - 5);
								y += 25;
								break;
							default:
								x += 15;
						}

						$('.'+ name).css({
							left: x,
							top: y
						}).html(me.attr('data-btitle'));
					});
				}, function() {
					if(typeof callback == 'function') {
						callback.call($('.'+ name));
					} else {
						$('.'+ name).remove();
					}
				});

				$(this).on('remove', function() {
					$('.'+ name).remove();
				});
			});
		},

		bRotate: function(degrees) {
			$(this).css({
				'-webkit-transform': 'rotate('+ degrees +'deg)',
				'-moz-transform': 'rotate('+ degrees +'deg)',
				'transform': 'rotate('+ degrees +'deg)'
			});

			return $(this);
		}
	});

})(jQuery);


/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2006, 2014 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD (Register as an anonymous module)
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (arguments.length > 1 && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setMilliseconds(t.getMilliseconds() + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {},
			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling $.cookie().
			cookies = document.cookie ? document.cookie.split('; ') : [],
			i = 0,
			l = cookies.length;

		for (; i < l; i++) {
			var parts = cookies[i].split('='),
				name = decode(parts.shift()),
				cookie = parts.join('=');

			if (key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));

(function ( $ ) {
	$.fn.autosized = function( options ) {
		var elem = $(this);
		elem.on('change keyup keydown paste cut input', function() {
			var scrollParent = elem.scrollParent();
			var currentScrollPosition = scrollParent.scrollTop();

			elem.height(0);
			elem.height(elem.prop('scrollHeight'));

			scrollParent.scrollTop(currentScrollPosition);
		});

		var settings = $.extend({
			resize: "none",
			width: "",
			overflow: "",
			minHeight: "",
			backgroundColor: "",
			color: ""
		}, options );

		return this.css({
			resize: settings.resize,
			width: settings.width,
			overflow: settings.overflow,
			minHeight: settings.minHeight,
			backgroundColor: settings.backgroundColor,
			color: settings.color
		});
	};
}( jQuery ));

function closebDialog(id) {
	$('#'+ id +':ui-dialog').dialog('destroy');
	$('#'+ id).remove();
}

function showLoading(msg) {
	var id = 'gLoading';
	var markup = [
		'<div id="'+ id +'" style="margin: 30px 0; text-align: center;">',
		'	<div class="animate-logo"><div class="fixed"></div><div class="circle"></div></div>',
		'	<div style="padding-top: 24px;">'+ ((msg != undefined)?msg:'Please wait a moment.') +'</div>',
		'</div>'
	].join('');

	$('body').bDialog({
		boxID: id,
		boxWidth: 350,
		boxTitle: '',
		boxBorder: '0',
		//boxColor: '#283041',
		boxColor: 'transparent',
		boxCorner: 3,
		boxContents: markup,
		useBoxModal: true,
		useBoxClose: false,
		useBoxDraggable: false,
		useBoxShadow: false,
		boxModalOpacity: 0.6
	});
}

function hideLoading() {
	closebDialog('gLoading');
}