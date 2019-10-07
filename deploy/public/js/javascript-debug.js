$(function($){
    requested = function(currentPage){
        var page = typeof currentPage === 'object' ? 1 : currentPage;
        var _this = this;
        var Skill = $(this).val();
        var alpha = Skill.length > 0 ? Skill : '0';
    
        $.post('/admin-search-results', {'primary': alpha, 'page':page}, function(results){
            $('.results').remove();
            $('#myDropdown').append('<a class="results">'+results.count+' results</a>');
            $('a').click(function(){
                $('tbody').empty();
                $.each(results.results, (index, row) => {
                    $('tbody').append($('<tr>').append(
                        $('<td>').append('<input name="box-'+index+'" class="all" type="checkbox"'+
                        'value="'+row.tel+'" />'),
                        $('<td class="row-'+index+'">').append(row.firstName),
                        $('<td class="row-'+index+'">').append(row.primary),
                        $('<td class="row-'+index+'">').append(row.secondary || 'N/A'),
                        $('<td class="row-'+index+'">').append(row.hobby || 'N/A'),
                        $('<td class="row-'+index+'">').append(row.about.trunc(50, true) +
                        '&nbsp;(<span onclick="seefull(\''+ row.about + '\')" class="linkColor">see full</span>)'),
                        $('<td class="row-'+index+'">').append(row.experience == 1 ?
                        row.experience + ' year' : row.experience + ' years'),
                        $('<td class="row-'+index+'">').append(row.distance + ' mi'),
                        $('<td class="row-'+index+'">').append(row.tel)     
                    ));
                });
            });
     
            if(results.count === 0){
                $('.results').remove();
            }
            createPagination(results.pages, results.currentPage, _this);
        });
    }
 
    $('#search-bar').keyup($.debounce(250, requested));

    $('#toggleCheckboxes').click(function(){
        var checkboxes = Array.prototype.slice.call(document.getElementsByClassName('all'));
        var len = checkboxes.length;
        var index = 0;
        for(index; index<len; index++){
            checkboxes[index].checked = this.checked;
        }
    });

   $("#dialog").dialog({
        autoOpen: false
   });
  $("#submitform").click(function() {
       var json = {
           "sms":[]
       };
       var arrayOfValues =  $("input:checkbox:checked", "#myTable").map(function(index, cur) {
            return $(this).val();   
       }).get();
     
       for(var i=0; i < arrayOfValues.length; i++){
            json.sms.push({'tel':arrayOfValues[i]});
       }
       json.textmessage = $('#textmessage').val();
       if(json.sms[0] && json.sms[0].tel && json.textmessage){
          $.ajax({
            type: 'POST',
            url: '/submit-sms',
            data: JSON.stringify(json),
            contentType:'application/json; charset=utf-8',
            success: function(data)
            {
                ///console.log(data);
                $("#dialog").html(data);
                 $("#dialog").dialog("open");
            }
          });
       }else{
           alert('you must select a row and fill out the message box');
       }
  
       return false;
   });

   var createPagination = function(pages, currentPage, _this){

        currentPage = parseInt(currentPage, 10);
        
        if(currentPage < pages && currentPage === 1){  
            $(".pagination").html(
                '<span>'+currentPage+'</span><a class="currentPage"></a>&nbsp;of&nbsp;'+
                '<span>'+pages+'</span>&nbsp;&nbsp;<a href="" class="totalPages"> > </a>'
            );
        }

        if(currentPage === pages && pages > 1){
            $(".pagination").html(
                '<a href="" class="currentPage"> < </a>&nbsp;&nbsp;<span>'+currentPage+'</span>&nbsp;&nbsp;of'+
                '&nbsp;&nbsp;<span>'+pages+'</span>&nbsp;&nbsp;pages'
                );
        }

        if(currentPage < pages && currentPage > 1){     
            $(".pagination").html(
                '<a href="" class="currentPage"> < </a>&nbsp;&nbsp;<span>'+currentPage+'</span>&nbsp;&nbsp;of' +
                '&nbsp;&nbsp;<span>'+pages+'</span>&nbsp;&nbsp;<a href="" class="totalPages"> > </a>'
            );
        }
        
        if(currentPage === pages && pages === 1){
            $(".pagination").html(
                '<span>'+currentPage+'</span>&nbsp;of&nbsp;'+
                '<span>'+pages+'</span>&nbsp;pages'
                );
          
        }
        
      $(".pagination").on('click',function(e){
          if(currentPage !== pages){
              if(e.target.id === 'currentPage'){
                currentPage++;
              }else if(e.target.id === 'totalPages'){
                currentPage--;
              }
            requested.call(_this, currentPage);
          }
      });
   }
  
   String.prototype.trunc =
     function( n, useWordBoundary ){
         if (this.length <= n) { return this; }
         var subString = this.substr(0, n-1);
         return (useWordBoundary 
            ? subString.substr(0, subString.lastIndexOf(' ')) 
            : subString) + "&hellip;";
      };
}(jQuery));