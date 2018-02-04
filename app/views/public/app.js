//dialogue to update a name
function prepareModal(name, id) {
    //set name of modal
    $('#modalOldName').text(name)
    //set placeholder
    $('#modalInput').val(name)
    //set action to id of title
    $('#modalForm').attr('action', '/title/' + id + '/?_method=PUT')
    //show modal
    $('.ui.modal').modal('show')
}

//trigger fadeout of flash messages
window.onload = function() {
    $('.success.message').fadeOut(2500)
    $('.error.message').fadeOut(2500)
}