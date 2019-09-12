function submit_form() {
	var message = {
		name: $('#name').val(),
		email: $('#email').val(),
		message: $('#message').val()
	};

	$('#name').prop('disabled', true);
	$('#email').prop('disabled', true);
	$('#message').prop('disabled', true);
	$('submit').prop('disabled', true);
	$('reset').prop('disabled', true);

	$('#contactform').validate();

	$('#message_result').html('Sending...');

	$.ajax({
		url: 'https://api.mattkellock.com/contactform',
		type: 'post',
		dataType: 'json',
		contentType: 'application/json',
		success: function(data) {
			//$('#message_result').html('Your message has been sent!');
		},
		error: function(data) {
			$('#message_result').html('There was an error sending your message, please try again');

			$('#name').prop('disabled', false);
			$('#email').prop('disabled', false);
			$('#message').prop('disabled', false);
			$('submit').prop('disabled', false);
			$('reset').prop('disabled', false);
		},
		data: JSON.stringify(message)
	});
}
