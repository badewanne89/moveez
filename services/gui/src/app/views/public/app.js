//prepare modal to delete a title
function prepareDeleteModal(name, id) {
	//set name of modal
	$('#deleteModalName').text(name)
	//set action to id of title
	$('#deleteModalForm').attr('action', '/title/' + id + '/?_method=DELETE')
	//show delete modal
	$('#deleteModal').modal('show')
}

//trigger fadeout of flash messages
window.onload = function() {
    $('#successAlert').fadeOut(5000)
    $('#errorAlert').fadeOut(5000)
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

//suggestions from IMDB (via omdb api) for adding a new title
function suggestTitle() {
    var searchString = $('#searchNewTitle').val()
    if(searchString.length > 2) {
        superagent.get(`https://www.omdbapi.com/?s=${searchString}&apikey=b50af808`)
        .end((err, response) => {
            if (err) {
                console.log(`ERR: oMDB failed us, here is the reason: ${err}`)
                $('#results').html("<p style='padding:5px;'> 😰ooops we can't get results from iMDB, please notify us! </p>")
                $('#results').show()
            } else {
                if(response.body.Search) {
                    $('#results').html("")
                    for (let suggestion of response.body.Search) {
                        //some titles have no cover and some covers are hosted at imdb, seems like they don't allow external usage of those, we replace those with a default one
                        if(suggestion.Poster === "N/A" || suggestion.Poster.includes("media-imdb.com") || suggestion.Poster.includes("images-na")) {
                            suggestion.Poster = "/nocover.png"
                        }
                        //build string for suggestion
                        suggestion = `
                            <div class="suggestion d-flex" onClick="addTitle('${suggestion.Title}', '${suggestion.imdbID}', '${suggestion.Year}', '${suggestion.Poster}')">
                                <i class="fas fa-plus-circle addSuggestionButton my-auto"></i>
                                <img loading="lazy" class="my-auto ml-2" src="${suggestion.Poster}" width="33px" height="50px">
                                <div class="container-fluid ml-2 my-auto p-0">
                                    <h4 class="my-1 trimLength" style="min-width: 0px">${suggestion.Title}</h4>
                                    <p class="text-muted my-1">(${suggestion.Year})</p>
                                </div>
                            </div>
                        `
                        $('#results').append(suggestion)
                    }
                    $('#results').show()
                }
            }
        })
    } else {
        $('#results').hide(0)
    }
}

//add a new title
function addTitle(name, imdbID, year, poster) {

    let form = document.createElement('form')
    form.action = '/title'
    form.method = 'POST'

    var ratingRequest = new XMLHttpRequest();
    ratingRequest.onreadystatechange = function() {
        if (ratingRequest.readyState == 4 && ratingRequest.status == 200) {
            form.innerHTML = '<input name="title[name]" value="' + name + '"><input name="title[tomatoURL]" value="' + JSON.parse(ratingRequest.responseText).tomatoURL + '"><input name="title[imdbRating]" value="' + JSON.parse(ratingRequest.responseText).imdbRating + '"><input name="title[imdbID]" value="' + imdbID + '"><input name="title[year]" value="' + year + '"><input name="title[poster]" value="' + poster + '">'
            //the form must be in the document to submit it, but should be invisible
            form.hidden = true
            document.body.append(form)

            form.submit()
        }
    }

    ratingRequest.open("GET", "https://www.omdbapi.com/?i=" + imdbID + "&apikey=b50af808&tomatoes=true")
    ratingRequest.send()
}

//hide suggestions when search field loses focus
function hideSuggestions() {
    //setTimeout(function () {
    //    $('.results').hide(0)
    //}, 200);
}