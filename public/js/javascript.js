$(function($){
    requested = function(){
        
        var Skill = $(this).val();
        var alpha = Skill.length > 0 ? Skill : '0';
        $.post('/admin-search-results', {'primary': alpha}, function(results){
            $('.results').remove();
            $('#myDropdown').append('<a class="results">'+results.length+' results</a>');
            $('a').click(function(){
                $('tbody').empty();
                $.each(results, (index, row) => {
                    $('tbody').append($('<tr>').append(
                        $('<td>').append('<input name="box-'+index+'" class="all" type="checkbox"'+
                        'value="'+row.tel+'" />'),
                        $('<td class="column-'+index+'">').append(row.firstName),
                        $('<td class="column-'+index+'">').append(row.about),
                        $('<td class="column-'+index+'">').append(row.distance + ' mi'),
                        $('<td class="column-'+index+'">').append(row.tel),
                        $('<td class="column-'+index+'">').append(row.primary),
                        $('<td class="column-'+index+'">').append(row.secondary),
                        $('<td class="column-'+index+'">').append(row.hobby)
                    ));
                });
            });
     
            if(results.length === 0){
                $('.results').remove();
            }
    
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
   
       if(json.sms[0].tel && json.textmessage){
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
}(jQuery));