$(function (){
    renderProfilePage();
})

export const getProfile = async function() {
    let result = await axios({
        method: 'get',
        url: 'http://localhost:3000/getLoggedInUser',
    });
    let prof = result.data;
    return prof;
}

export const editProfile = function(new_prof) {
    profile = new_prof;
    updateProfileInfo();
}

export const renderProfilePage = async function(){
    let profile = await getProfile();
    const $root = $("#root");
    $root.append(`
        <div class="container" id="profile_info">
            <p class="title">Username: ${profile.username}</p>
            <p class="subtitle">${profile.firstName} ${profile.lastName}</p>
            <p>Email Address: ${profile.emailAddress}</p>
            <p>Password: ${profile.password}</p>
        </div>
        <button class="button" id="change_password_button">Change Password</button>
        <button class="button is-danger is-light" id="delete_profile">Delete Account</button>
        <br><br>
        <div class="container" id="user_posts">
            <p class="title">Posts Made:</p>
        </div>
    `)
    $("#change_password_button").click(handleChangePassClick);
    $("#delete_profile").click(handleDeleteProfileClick);
}

const updateProfileInfo = async function () {
    let profile = await getProfile();
    $("#profile_info").replaceWith(`
        <div class="container" id="profile_info">
            <p class="title">Username: ${profile.username}</p>
            <p class="subtitle">${profile.firstName} ${profile.lastName}</p>
            <p>Email Address: ${profile.emailAddress}</p>
            <p>Password: ${profile.password}</p>
        </div>
    `);
}

export const handleChangePassClick = function () {
    $("#change_password_button").replaceWith(`
        <div id="change_password_form" style="border: solid; padding:5px;">
            <form>
                Current Password: <input type="text" id="cur_pass"><br>
                New Password: <input type="password" id="new_pass"><br>
                Confirm New Password: <input type="password" id="confirm_pass"><br>
                <button class="button" id="submit_pass_change">Submit</button>
                <button class="button is-danger is-light" id="cancel_pass_change">Cancel</button>
            <form>
            <p class="successful_pass_change" style="visibility: hidden; color: #48c774">Password changed successfully</p>
            <p class="pass_change_error" style="visibility: hidden; color: red;"></p>
        </div>
    `);
    $("#submit_pass_change").click(handleSubmitPassChange);
    $("#cancel_pass_change").click(handleCancelPassChange)
}

export const handleSubmitPassChange = function() {
    if($("#cur_pass").val() != getProfile().password){
        $(".pass_change_error").html("Current password does not match");
        $(".pass_change_error").attr("style", "visibility: visible; color: red;");
        return false;
    }
    else if ($("#new_pass").val() != $("#confirm_pass").val()){
        $(".pass_change_error").html("New passwords do not match");
        $(".pass_change_error").attr("style", "visibility: visible; color: red;");
        return false;
    }
    else{
        let new_profile = {
            "username": "he",
            "password": $("#new_pass").val(),
            "firstName": "hell",
            "lastName": "wrfnw",
            "emailAddress": "rklegerklg@fef"
        };
        editProfile(new_profile);
        $("#change_password_form").replaceWith(`<button class="button" id="change_password_button">Change Password</button>`);
        $("#change_password_button").click(handleChangePassClick);
        $(".successful_pass_change").attr("style", "visibility: visible; color: #48c774;")
        return true;
    }
}

export const handleCancelPassChange = function () {
    $("#change_password_form").replaceWith(`<button class="button" id="change_password_button">Change Password</button>`);
    $("#change_password_button").click(handleChangePassClick);
}

export const handleDeleteProfileClick = async function () {
    let prof = await getProfile();
    alert(prof)
    if(confirm("Are you sure you want to delete your account?")){
        alert("Profile Deleted");
        await axios({
            method: 'delete',
            url: 'http://localhost:3000/users',
        });
        alert(prof)
        updateProfileInfo();
    }
}