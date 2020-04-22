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
    
            $(element).append($(tag).append($(tag2)));
        }
    
        function compare_search_term_to_data_set(input_val, key, value) {
            // Compare search term to result set key name and value            
            var match = false;
    
            jQuery.each(value, function (key, value) {
                if (value.toLowerCase().indexOf(input_val.toLowerCase()) >= 0) {
                    match = true;
                }
            });
            
    
            if (match) {
                // if (value.img == '') {
                //     value.img = './images/Venugopal/Gowthamnarayanan.jpg'
                // }
                
                $('.undraw').hide();
                append_to_results('.results', '<div class="match col-xl-4 col-lg-4 col-md-6 col-sm-6 col-xs-6 px-auto">', '<div class="card shadow-lg px-2 rounded-lg my-2 border-0"><div class="card-horizontal"><div class="p-3"><img src="'+value.img+'" height="150px" width="150px" class="rounded-lg"></div><div class="card-body"><p class="mb-1">'+value.name+'</p><p class="p-0 text-muted">'+value.title+'</p><p class="p-0 m-0 text-muted"><img class="img-fluid" src="./images/home/location.png" height="30" width="30">'+value.location+'</p></div></div></div></div>', key, value);
            }
        }
    
        function search_autocomplete() {
            // Search the list of data and autocomplete the search term
    
            var key_event = event.which;
            var input_val = $(this).val();
    
            // If key pressed is not alphanumeric or backspace, early exit
            if (!check_key_event(key_event) || input_val.length <= 3 || input_val == 'image') {
                return false;
            }
            // Clear list of results
            $('.match').remove();
    
            jQuery.each(json, function (key, value) {                
                // Compare search term to result set name
                if (input_val) {
                    var match = compare_search_term_to_data_set(input_val, key, value);
                }
            });
        }
    
        // Add event handler to the input field
        $('.search_term').on('keyup blur change paste cut reset submit', search_autocomplete);
});

