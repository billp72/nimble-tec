$(function($){
    requested = function(){
        
        var Skill = $(this).val();
        var alpha = Skill.length > 0 ? Skill : '0';
        $.post('/admin-search-results', {'primary': alpha}, function(results){
            $('.results').remove();
            $('#myDropdown').append('<a class="results">'+results.length+' results</a>');
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
            if(results.length === 0){
                $('.results').remove();
            }
        });
    }
    //
    $('#search-bar').keyup($.debounce( 250, requested ) );

}(jQuery));