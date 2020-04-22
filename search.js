/*
   Given the below JSON object, construct a live search filter module
       - Begin with no results
       - As the user types, display a list of matches below the line in real time
*/
$.getJSON( "data.json", function( json ) {

        function check_key_event(key_event) {
            // Early exit if key event is not alphanumeric or backspace
    
            if (!(key_event > 47 && key_event < 58 || key_event > 64 && key_event < 92 || key_event == 8 || key_event === undefined)) {
                return false;
            }
            return true;
        }
    
        function append_to_results(element, tag, tag2, key, value) {
            // Append list item to results list
    
            var record = String(key);
    
            jQuery.each(value, function (key, value) {
                record += (' ' + value);
            });
    
            $(element).append($(tag).append($(tag2).append(record)));
        }
    
        function compare_search_term_to_data_set(input_val, key, value) {
            // Compare search term to result set key name and value
            console.log(input_val, 'Un', key,' kjk', value);
            
            var match = false;
    
            match = (key.toLowerCase().indexOf(input_val.toLowerCase()) >= 0) ? true : false;
    
            jQuery.each(value, function (key, value) {
                if (value.toLowerCase().indexOf(input_val.toLowerCase()) >= 0) {
                    match = true;
                }
            });
    
            if (match) {
                append_to_results('.results', '<tr class="match">', '<td>', key, value);
            }
        }
    
        function search_autocomplete() {
            // Search the list of vehicles and autocomplete the search term
    
            var key_event = event.which;
            var input_val = $(this).val();
    
            console.log(key_event);
    
            // If key pressed is not alphanumeric or backspace, early exit
            if (!check_key_event(key_event)) {
                return false;
            }
    
            // Clear list of results
            $('.match').remove();
    
            jQuery.each(json, function (key, value) {                
                // Compare search term to result set name
                if (json.name || json.location) {
                    var match = compare_search_term_to_data_set(json.name, key, value);
                }
            });
        }
    
        // Add event handler to the input field
        $('.search_term').on('keyup blur change paste cut reset submit', search_autocomplete);
});

