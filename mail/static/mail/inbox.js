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

      newEmail.classList.add('list-group-item', 'list-group-item-action', 'mb-2', 'shadow-sm');
      if (email.read) {
        newEmail.classList.add('bg-light');
      } else {
        newEmail.classList.add('bg-white', 'fw-bold');
      }


      newEmail.innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <span><strong>From:</strong> ${email.sender}</span>
      <span class="text-muted small">${email.timestamp}</span>
    </div>
    <div><strong>Subject:</strong> ${email.subject}</div>
  `;
    

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
          <div class="card mb-3 shadow-sm">
            <div class="card-header">
              <div><strong>From:</strong> ${email.sender}</div>
              <div><strong>To:</strong> ${email.recipients.join(', ')}</div>
            </div>
            <div class="card-body">
              <h5 class="card-title mb-2"><strong>Subject:</strong> ${email.subject}</h5>
              <hr>
              <p class="card-text" style="white-space: pre-line;">${email.body}</p>
              <p class="card-text">
                <small class="text-muted">${email.timestamp}</small>
              </p>
              <div id="email-action-buttons" class="mt-3"></div>
            </div>
          </div>
        `;
        
          const actionDiv = displayEmail.querySelector("#email-action-buttons");


          //Creating reply button
          const replyButton = document.createElement('button');

          replyButton.classList.add("btn", "btn-primary", "mb-2");

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

          actionDiv.appendChild(replyButton);


          //Dealing with the creation of archive button
          if (mailbox !== 'sent') {
            const archiveButton = document.createElement('button');
          
          archiveButton.classList.add("btn", "btn-outline-secondary", "me-2", "mb-2");  

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
              setTimeout(() => {
                showFlashMessage(
                  newArchivedStatus ? "Email archived!" : "Email unarchived!",
                  "success"
                );
              }, 100);
            })
            .catch(error => {
              showFlashMessage("Failed to archive email.", "danger");
              console.error('Error:', error);
            });

          });
            if (mailbox !== 'sent') {
              actionDiv.appendChild(archiveButton);
            }
          }

      
          document.querySelector('#emails-view').innerHTML ='';
          document.querySelector('#emails-view').append(displayEmail);

      });
      
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

        //Short delay then show flash message
        setTimeout(() => {
          showFlashMessage(result.message, "success");
        }, 100);

      } else {
        //Handle any errors (Like if recipient were invalid)
        alert(result.error, "danger");
      }
    });

}


function showFlashMessage(message, type = "success") {
  // 1. Find the flash message container
  const flashContainer = document.getElementById('flash-message-container');
  
  // 2. Set its content to the message, styled by type (success, danger, etc.)
  flashContainer.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${message}
    </div>
  `;

  // 3. Auto-dismiss: clear the message after 3 seconds
  setTimeout(() => {
    flashContainer.innerHTML = "";
  }, 3000);
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