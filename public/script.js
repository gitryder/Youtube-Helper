const CLIENT_ID = '969229269832-vlkvofru6toec73ovt57t9vqqbcrh5n2.apps.googleusercontent.com'
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const loginButton = document.getElementById('btn-login');
const logoutButton = document.getElementById('btn-logout');
const loggedOutContent = document.getElementById('logged-out-content');
const loggedInContent = document.getElementById('logged-in-content');
const channelNameInput = document.getElementById('input-channel-name');
const getDataButton = document.getElementById('btn-get-data');

const defaultChannelId= 'UCl3HSwd9i67Mjs4DfldgZmg'

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        discoveryDocs: DISCOVERY_DOCS,
        clientId: CLIENT_ID,
        scope: SCOPES
    }).then(() => {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        loginButton.onclick = handleLogin;
        logoutButton.onclick = handleLogout;
    });
}

function updateSigninStatus(isSignedIn) {
     if (isSignedIn) {
        loggedOutContent.style.display = 'none';
        loggedInContent.style.display = 'block';

        getChannel(defaultChannelId);
     } else {
        loggedOutContent.style.display = 'block';
        loggedInContent.style.display = 'none';
     }
}

function handleLogin() {
    gapi.auth2.getAuthInstance().signIn(); 
}  

function handleLogout() {
    gapi.auth2.getAuthInstance().signOut(); 
}

function getChannel(channelId) {
    var profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
    
    gapi.client.youtube.channels
    .list({
        part: 'snippet,contentDetails,statistics',
        id: channelId

    }).then(response => {
        console.log(response);
        
    }).catch(err => alert('No channel by that name'));
}