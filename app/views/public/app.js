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

//dialoge to delete a title
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