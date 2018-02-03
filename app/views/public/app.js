//dialogue to update a name
function prepareModal(name, id) {
    //set name of modal
    $('#modalOldName').text(name);
    //set placeholder
    $('#modalInput').val(name);
    //set action to id of title
    $('#modalForm').attr('action', '/title/' + id)
    //show modal
    $('.ui.modal').modal('show');
}