const HEADINGS = { 0:'WELCOME!' ,1:'LET THE DATA EXPLORATION BEGIN!', 2:'THE PERFECT PRODUCT FOR YOU!', 3:'WE’RE WORKING HARD TO IMPROVE YOUR EXPERIENCE!', 4:'LET’S EXPLORE!' };
$(document).ready(function(){
	changeHeight();
	$(".collapse").each(function() {
		$(this).on('show.bs.collapse', function(){
			var id = $(this).attr('id');
			/*var pele = $('body').find("[data-target='#" + id + "']")[0];
			$(this).css("left",$(pele).offset().left+"px");*/
			$('body').find("[data-target='#" + id + "']").addClass("active");
		});
		$(this).on('hide.bs.collapse', function(){
			var id = $(this).attr('id');
			setTimeout(function () {
				var eles = $('body').find("[data-target='#" + id + "']");
				$.each( eles, function( key, value ) {
				  if($(value).hasClass('collapsed'))
				  {
				  	$(value).removeClass("active");
				  }
				});
			},500);
		});
	});
	/*$( ":text,:password").on('load',function() { 
    $(this).focus();
    $(this).blur();
  });*/
});

$(document).on('slid.bs.carousel','#welcome-carousel', function () {
	var carouselData = $(this).data('bs.carousel');
	var currentIndex = carouselData.getItemIndex(carouselData.$element.find('.item.active'));
	$('.home-popup-header').html(HEADINGS[currentIndex]);
})

/* $("body").mouseup(function(e){
	var checkbox = $('.option-header');
	if(!checkbox.is(e.target) && checkbox.has(e.target).length === 0)
	{
		var container = $('.filter-submenu-div');
		if (!container.is(e.target) && container.has(e.target).length === 0)
		{
			container.collapse('hide');
		}
		var audience_filter_container = $('.audience-filter-main');
		if (!audience_filter_container.is(e.target) && audience_filter_container.has(e.target).length === 0)
		{
			audience_filter_container.collapse('hide');
		}
		var container1 = $('#mobile-filter-menu');
		if (!container1.is(e.target) && container1.has(e.target).length === 0)
		{
			container1.collapse('hide');
		}
	}
}); */
$(window).resize(function(){
	changeHeight();
});
function changeHeight()
{
	var content_height = $(".content-wrapper").height();
	$(".main-sidebar").height(content_height+"px");
  if($(window).width() > 767) {
      $('#usermenu').removeClass('collapse');
  }else{
      $('#usermenu').addClass('collapse');
  }
}