//dialogue to update a name
function prepareUpdateModal(name, id) {
    //set name of modal
    $('#updateModalOldName').text(name)
    //set placeholder
    $('#updateModalInput').val(name)
    //set action to id of title
    $('#updateModalForm').attr('action', '/title/' + id + '/?_method=PUT')
    //show update modal
    $('#updateModal').modal('show')
}

//dialogue to delete a title
function prepareDeleteModal(name, id) {
	//set name of modal
	$('#deleteModalName').text(name)
	//set button text for delete
	$('#deleteModalButton').attr('value', "Yes, delete '" + name + "'!")
	//set action to id of title
	$('#deleteModalForm').attr('action', '/title/' + id + '/?_method=DELETE')
	//show delete modal
	$('#deleteModal').modal('show')
}

//trigger fadeout of flash messages
window.onload = function() {
    $('.success.message').fadeOut(2500)
    $('.error.message').fadeOut(2500)
}

//update a title as seen or unseen
function toggleSeenStatus(id, name, seen) {
    let form = document.createElement('form')
    form.action = '/title/' + id + '/?_method=PUT'
    form.method = 'POST'
    if(seen) {
        form.innerHTML = '<input name="title[seen]" value="true"> <input name="title[seenOn]" value="' + Date.now() + '">'
    } else {
        form.innerHTML = '<input name="title[seen]" value="false">'
    }

    //the form must be in the document to submit it, but should be invisible
    form.hidden = true
    document.body.append(form)

    form.submit()
}

//suggestions from IMDB for adding a new title
//Define API endpoints once globally
    $.fn.api.settings.api = {
        'search' : 'http://www.omdbapi.com/?s={value}&apikey=b50af808'
    };
    $('.search input')
      .api({
        debug: true,
        action: 'search',
        searchFullText: false,
        stateContext: '.ui.input',
        onSuccess: function(response) {
             if(response.Search.length > 0) {
                 $('.results').html("")
                 for(i = 0; response.Search.length > i; i++) {
                    $('.results').append("<div><img src=\"" + response.Search[i].Poster + "\" width=\"30px\" height=\"40px\">" + response.Search[i].Title + " (" + response.Search[i].Year +  ") </div>")
                 }
                 $('.results').show()
             }
        },
      })
    ;