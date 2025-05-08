document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);


  // Add submit event listener for the compose form
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;


  // Fetch the emails for the selected mailbox
  fetch(`/emails/${mailbox}`)
  .then(function(response) {
    return response.json();
  })
  .then(function(emails) {
    
    //Clear the emails-view content
    const emailsList = document.createElement('div');
    emailsList.id = 'emails-list';
    document.querySelector('#emails-view').append(emailsList);

    emails.forEach(function(email){
      //Create div for each email
      const newEmail = document.createElement('div');
      newEmail.innerHTML = ` 
        <strong>From:</strong> ${email.sender}<br>
        <strong>Subject:</strong> ${email.subject}<br>
        <strong>Timestamp:</strong> ${email.timestamp}
        `
    

      newEmail.addEventListener('click', function() {
          if (mailbox != 'sent') {
            console.log(email.read);

            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify ({
                read:true
              })
            })
            .then(() => {
              console.log('Email marked as read');
            })
          }
        
          const displayEmail = document.createElement('div');
        
          displayEmail.innerHTML = `
            <strong>From:</strong> ${email.sender}<br>
            <strong>To:</strong> ${email.recipients.join(', ')}<br>
            <strong>Subject:</strong> ${email.subject}<br>
            <strong>Body:</strong> ${email.body}<br>
            <strong>Timestamp:</strong> ${email.timestamp}<br>
            `

          //Dealing with the creation of archive button
          if (mailbox !== 'sent') {
            const archiveButton = document.createElement('button');

            if (email.archived === true) {
              archiveButton.innerHTML="Unarchive"
          } else{
            archiveButton.innerHTML="Archive"
          }
          
          archiveButton.addEventListener('click', function() {
            const newArchivedStatus = !email.archived;


            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify ({
                archived: newArchivedStatus
              })
            })
            .then(() => {
              load_mailbox('inbox');
            })
            .catch(error => {
              console.error('Error:', error);
            });
          });
          displayEmail.append(archiveButton);
          }

          const replyButton = document.createElement('button');
          replyButton.innerHTML="Reply"
          replyButton.addEventListener('click', function() {
            // Show compose view and hide other views
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'block';
            fetch(`/emails/${email.id}`)
              .then(response => response.json())
              .then(email => {
                console.log(email);

                let sender = email.sender;
                let subject = email.subject;
                let body = email.body;
                let time = email.timestamp

                //Pre fill email slots
                document.querySelector('#compose-recipients').value = `${sender}`;
                document.querySelector('#compose-subject').value = `Re: ${subject}`;
                document.querySelector('#compose-body').value = `On ${time} ${sender} wrote: ${body}`;
              })

              
            

            
          })

          displayEmail.append(replyButton);


      
          document.querySelector('#emails-view').innerHTML ='';
          document.querySelector('#emails-view').append(displayEmail);

      });

      // Set background color based on whether the email is read
      email.read === true ? newEmail.style.backgroundColor = 'lightgray' : newEmail.style.backgroundColor = 'white';
      newEmail.style.border = '1px solid black';
      newEmail.style.padding = '10px';
      newEmail.style.margin = '5px 0';

      emailsList.append(newEmail);
    })

})
}

function send_email(event) {
  event.preventDefault();

  //Get the values from the form fields
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;


  //Send a POST request to the '/emails' endpoint
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body})
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(result) {
      // Log the result (success message or error
      console.log(result);

      //If the email was send successfully, load the mailbox
      if (result.message === "Email sent successfully."){
        load_mailbox('sent');
      } else {
        //Handle any errors (Like if recipient were invalid)
        alert(result.error);
      }
    });

}

/* Plans on handling the archive button before
 (Wouldnt have worked because it would always appear on the top of the pay.
 Also, would not be email specific if that makes sense, I added it as part of the section
 that displayed the email details)


function toggleArchive(emailId, current_state) {
  //Need a way to track the state when button is clicked
  //Then will need to update new_state accordingly
  const new_state = current_state

  fetch(`emails/${emailId}`, {
    method: 'POST',
    body: JSON.stringify ({
      archived: new_state,
    })
  })

  //Need a way to display the archive button depending on the new_state


  alert('archive button clicked');
}
*/