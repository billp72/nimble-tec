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
                        $('<td>').append('<input name="box-'+index+'" class="all" type="checkbox" />'),
                        $('<td>').append(row.firstName),
                        $('<td>').append(row.about),
                        $('<td>').append(row.distance + ' mi'),
                        $('<td>').append(row.tel),
                        $('<td>').append(row.primary),
                        $('<td>').append(row.secondary),
                        $('<td>').append(row.hobby)
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
}(jQuery));