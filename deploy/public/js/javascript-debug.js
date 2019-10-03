$(function($){
    requested = function(){
        
        var Skill = $('#search-bar').val();
        $.post('/admin-search-results', {'primary': Skill}, function(results){
            $('#myDropdown').append('<a>'+results.length+' results</a>');
            $('a').click(function(){
                $.each(results, (index, row) => {
                    $('tbody').append($('<tr>').append(
                        $('<td>').append('<input type="checkbox" />'),
                        $('<td>').append(row.firstName),
                        $('<td>').append(row.about),
                        $('<td>').append(row.tel),
                        $('<td>').append(row.primary),
                        $('<td>').append(row.secondary),
                        $('<td>').append(row.hobby)
                    ));
                });
            });
        });
    }
    //$.debounce( 250, requested ) 
    $('#btn').click(requested);

}(jQuery));