$(function($){
    requested = function(){
        
        var Skill = $(this).val();
        $.post('/admin-search-results', {'skill': Skill}, function(results){
            $('#myDropdown').append('<a>'+results.length+'</a>');
            $('a').click(function(){
                $.each(results, (index, row) => {
                    $('tbody').append(
                        '<tr>'+
                            '<td>'+row.name+'</td>'+
                            '<td>'+row.age+'</td>'+
                            '<td>'+row.phone+'</td>'+
                            '<td>'+row.primary+'</td>'+
                        '</tr>'
                    );
                });
            });
        });
  
    }

    $('#search-bar').keyup( $.debounce( 250, requested ) );

}(jQuery));