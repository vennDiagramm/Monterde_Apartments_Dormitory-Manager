/* SWALLL */
const mySwalala = Swal.mixin({
    background: "#bfbfbf",
    color: "#1a1a1a",
    confirmButtonColor: "#007bff" // Bootstrap blue
});


// Update time and date
async function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString();
    document.getElementById('current-date').textContent = now.toLocaleDateString();
}

// Update time every second
setInterval(updateDateTime, 1000);

// Initial update
updateDateTime();

// Get current apartment based on active slide
async function getCurrentApartment() {
    const slides = document.querySelectorAll('.slide');
    let activeIndex = 0;
    
    for (let i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains('active')) {
            activeIndex = i;
            break;
        }
    }
    
    // Return apartment ID based on active slide || 1 - Matina, 2 - Sesame, 3 - Nabua
    switch (activeIndex) {
        case 0: return 2; // Sesame is first slide (index 0)
        case 1: return 1; // Matina is second slide (index 1)
        case 2: return 3; // Nabua is third slide (index 2)
        default: return 2; // Default to Sesame
    }
}


// Change apartment background and location text
async function changeApartment(locationName, slideIndex) {
    // Update the location text
    document.getElementById('currentLocation').textContent = locationName.toUpperCase();
    sendApartment();
    
    // Remove active class from all slides
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.classList.remove('active'));
    
    // Add active class to selected slide
    if (slides[slideIndex]) {
        slides[slideIndex].classList.add('active');
    }
    
    // Return the apartment id
    return await getCurrentApartment();
}

// When the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Update time and date
    updateDateTime();
    fetchRooms() // just to load
    
    // Setup click handlers for apartment locations in dropdown
    const dropdownItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
    
    dropdownItems.forEach(item => {
        const text = item.textContent.trim();
        
        if (text === 'Matina Crossing') {
            item.addEventListener('click', async function(e) {
                e.preventDefault();
                const apartmentId = await changeApartment('Matina', 1);
                console.log('Current apartment ID:', apartmentId);
            });
        } else if (text === 'Sesame Street') {
            item.addEventListener('click', async function(e) {
                e.preventDefault();
                const apartmentId = await changeApartment('Sesame', 0);
                console.log('Current apartment ID:', apartmentId);
            });
        } else if (text === 'Nabua Street') {
            item.addEventListener('click', async function(e) {
                e.preventDefault();
                const apartmentId = await changeApartment('Nabua', 2);
                console.log('Current apartment ID:', apartmentId);
            });
        }
    });

    // For Modals
    const modalClick = document.querySelector('.modal');
    modalClick.addEventListener('click', (e) => {
        e.stopPropagation(); 
    });

    // Add tenant form
    const addTenantBtn = document.getElementById("addTenantBtn");
    const mainContentArea = document.getElementById("mainContentArea");
    const addTenantFormContainer = document.getElementById("addTenantFormContainer");

    if (addTenantBtn && mainContentArea && addTenantFormContainer) {
        addTenantBtn.addEventListener("click", function () {
            mainContentArea.innerHTML = "";
            addTenantFormContainer.style.display = "block";
            mainContentArea.appendChild(addTenantFormContainer);

            // for drop downs || NOTES: For add and remove(dismiss), we need to make it fetch dynamically.
            updateRoomDropdown();
        });
    }

    // Edit Tenant Form
    const editTenantBtn = document.getElementById("editTenantBtn");
    const editTenantFormContainer = document.getElementById("editTenantFormContainer");

    if(editTenantBtn && mainContentArea && editTenantFormContainer){
        editTenantBtn.addEventListener("click", function(){
            mainContentArea.innerHTML="";
            editTenantFormContainer.style.display="block";
            mainContentArea.appendChild(editTenantFormContainer);
        })
    }
    editTenantBtn.addEventListener("click", async function () {
        const response = await fetch(`/search-tenant/All`)
        const tenant = await response.json();
        viewEditTenantInfo(tenant);
    })

    // Dismiss Tenant Form
    const dismissTenentBtn = document.getElementById("dismissTenantBtn");
    const dismissTenantFormContainer = document.getElementById("dismissTenantFormContainer");

    if (dismissTenentBtn && mainContentArea && dismissTenantFormContainer) {
        dismissTenentBtn.addEventListener("click", function () {
            mainContentArea.innerHTML = "";
            dismissTenantFormContainer.style.display = "block";
            mainContentArea.appendChild(dismissTenantFormContainer);
        });
    }
    dismissTenentBtn.addEventListener("click", async function () {
        const aptLocId = await getCurrentApartment();
        if (!aptLocId) return; 
        const response = await fetch(`/getTenantInfo/${aptLocId}`) // For the table in dismiss
        const tenant = await response.json();
        viewTenantInfo(tenant);
    });

    //Room Management
    const roomsBtn = document.getElementById("roomsBtn");
    const roomsFormContainer = document.getElementById("roomsFormContainer");

    if (roomsBtn && mainContentArea && roomsFormContainer){
        roomsBtn.addEventListener("click",function(){
            mainContentArea.innerHTML ="";
            roomsFormContainer.style.display = "block";
            mainContentArea.appendChild(roomsFormContainer);

            // for drop downs
            updateAllRoomDropdown()
        })
    }

    // get room view via apartment || see what rooms are available
    roomsBtn.addEventListener("click", async function () {
        const aptLocId = await getCurrentApartment();
        
        const response = await fetch(`/getFullRoomView/${aptLocId}`);
        const rooms = await response.json();
        populateRoomTable(rooms);
    });

    //Payment

    //Reports
    const reportBtn = document.getElementById("reportBtn");
    const reportsFormContainer = document.getElementById("reportsFormContainer")

    if (reportBtn && mainContentArea && reportsFormContainer){
        reportBtn.addEventListener("click",function(){
            mainContentArea.innerHTML ="";
            reportsFormContainer.style.display = "block";
            mainContentArea.appendChild(reportsFormContainer);
        })
    }
    reportBtn.addEventListener("click", async function () {
        initializeReports(); // All charts...

        const responseTenant = await fetch('/getAllContracts') // For tenant summary report
        const contractsTenant = await responseTenant.json();
        viewTenantReport(contractsTenant);

        const responseRoom = await fetch('/getRoomsReport'); // For room summary report
        const contractsRoom = await responseRoom.json();
        viewRoomReport(contractsRoom);
    })

    /* ---- OTHER FUNCTIONALITIES ---- */
    // Form Submissions
    const addTenantForm = document.getElementById('addTenantForm');
    addTenantForm.addEventListener('submit', addTenant);

    const removeTenantForm = document.getElementById("removeTenantForm");
    removeTenantForm.addEventListener('submit', removeTenant);

    const addRoomForm = document.getElementById('addRoomForm');
    addRoomForm.addEventListener('submit', addRoom);

    const updateRoomForm = document.getElementById('updateRoomsForm');
    updateRoomForm.addEventListener('submit', updateRoom);

    const deleteRoomForm = document.getElementById('deleteRoomForm');
    deleteRoomForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const selectedRoomId = this.querySelector('.allRoomId').value; // Get the correct dropdown inside this form
        
        if (!selectedRoomId) {
            mySwalala.fire({ title: "Error!", text: "Please select a room.", icon: "error", iconColor: "#8B0000" });
            return;
        }

        const success = await deleteRoom(selectedRoomId);
        
        if (success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('deleteRoomModal'));
            modal.hide();
            this.reset();
            fetchRooms();
        }
    });

    const paymentForm = document.getElementById('paymentTenantForm');
    paymentForm.addEventListener('submit', paymentProcess);

});

// Add a Tenant
async function addTenant(event) {
    event.preventDefault();
    try {
        // Gather form data
        const firstName = document.getElementById('firstName').value;
        const middleName = document.getElementById('middleName').value;
        const lastName = document.getElementById('lastName').value;
        const contact = document.getElementById('contact').value;
        const dob = document.getElementById('dob').value;
        const sex = document.getElementById('sex').value;
  
        // City and Address fields
        const city = document.getElementById('city').value;
        const region = document.getElementById('region').value;
        const barangay = document.getElementById('barangay').value;
        const street = document.getElementById('street').value;
  
        // Get the active apartment location
        let aptLocID = await getCurrentApartment();
  
        // Room ID
        const roomId = document.querySelector('.vacantRoomId').value;
  
        // Validate inputs
        if (!firstName || !lastName || !contact || !dob || !sex || 
            !city || !region || !barangay || !street || !roomId || !aptLocID) {
            mySwalala.fire({ 
                title: "Error!", 
                text: "Please fill in all required fields!", 
                icon: "error", 
                iconColor: "#8B0000",
                background: "#222", 
                color: "#fff", 
                confirmButtonColor: "#8B0000" 
            });
            return;
        }
  
        // Send data to server
        let response = await fetch('/add-person', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firstName,
                middleName,
                lastName,
                contact,
                dob,
                sex,
                city,
                region,
                barangay,
                street,
                aptLocID, 
                roomId
            })
        });
  
        let result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to add tenant");
        }
        
        // After successfully adding tenant, update room status
        response = await fetch("/updateRoomStatus");
        let statusResult = await response.json();
        
        if (!response.ok) {
            console.error("Room status update failed but tenant was added:", statusResult);
            // Continue since the main operation (adding tenant) succeeded
        } else {
            console.log("Rooms updated:", statusResult);
        }
        
        mySwalala.fire({
            title: "Success!",
            text: "Tenant and occupant added successfully!",
            icon: "success",
            iconColor: "#006400"
        }).then(() => {
            event.target.reset(); 
            fetchRooms(); 
            updateRoomDropdown(); 
        });
        
    } catch (error) {
        console.error("Error adding tenant:", error);
        mySwalala.fire({
            title: "Error!",
            text: "Failed to complete tenant registration. " + error.message,
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
    }        
}
// End of Add a Tenant Function

// Remove a Tenant
async function removeTenant(event) {
    event.preventDefault();
    try {
        const personId = document.getElementById('personId').value;
        
        if (!personId) {
            mySwalala.fire({
                title: "Error!",
                text: "Please enter a valid Person ID!",
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonColor: "#dc3545"
            });
            return;
        }

        // Confirm removal
        const confirmRemoval = await mySwalala.fire({
            title: "Are you sure?",
            text: "This action cannot be undone!",
            icon: "warning",
            iconColor: "#FFA500",
            showCancelButton: true,
            confirmButtonText: "Yes, remove",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#8B0000",
            cancelButtonColor: "#6c757d"
        });

        if (!confirmRemoval.isConfirmed) {
            return;
        }

        // Send remove request to backend
        const response = await fetch(`/remove-tenant/${personId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to remove tenant');
        }

        mySwalala.fire({
            title: "Success!",
            text: "Tenant removed successfully!",
            icon: "success",
            iconColor: "#006400"
        }).then(() => {
            event.target.reset();
            fetchRooms();
        });

    } catch (error) {
        console.error("Error removing tenant:", error);
        mySwalala.fire({
            title: "Error!",
            text: "Failed to remove tenant. " + error.message,
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
    }
}
// End of Remove a Tenant Function

// Table in dismiss Tenant
async function viewTenantInfo(tenants) {
    const tbody = document.getElementById('tenantInfoTable').querySelector('tbody');
    tbody.innerHTML = '';  // Clear existing table data
    tenants.forEach(tenant => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tenant["Tenant ID"]}</td>
            <td>${tenant["First Name"]}</td>
            <td>${tenant["Last Name"]}</td>
            <td>${tenant["Sex"]}</td>
            <td>${tenant["Date of Birth"]}</td>
            <td>${tenant["Contact Number"]}</td>
            <td>${tenant["Room Number"]}</td>
            <td>${tenant["Apartment Location"]}</td>
        `;
        tbody.appendChild(row);
    });
}
// End of Populate room with details

// Table in Edit Tenant
async function viewEditTenantInfo(tenants) {
    const tbody = document.getElementById('tenantInfoTable').querySelector('tbody');
    tbody.innerHTML = '';  // Clear existing table data
    tenants.forEach(tenant => {
        // Format address
        const address = [
          tenant.Person_Street || "",
          tenant.Brgy_Name || "",
          tenant.City_Name || ""
        ].filter(Boolean).join(", ");
        
        // Format move-in date
        const moveInDate = tenant.actual_move_in_date !== '0000-00-00' 
          ? new Date(tenant.actual_move_in_date).toLocaleDateString() 
          : 'Not available';

        // Format move-out date
        const moveOutDate = tenant.actual_move_out_date !== '0000-00-00' 
          ? new Date(tenant.actual_move_out_date).toLocaleDateString() 
          : 'Not Yet Set';

        const birthDay = tenant.Person_DOB !== '0000-00-00' 
        ? new Date(tenant.actual_move_in_date).toLocaleDateString() 
        : 'Not available';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${tenant.Person_ID || "N/A"}</td>
          <td>${tenant.FullName || "N/A"}</td>
          <td>${tenant.Person_Contact || "N/A"}</td>
          <td>${birthDay || "N/A"}</td>
          <td>${tenant.Person_sex || "N/A"}</td>
          <td>${tenant.room_id || "N/A"}</td>
          <td>${address || "N/A"}</td>
          <td>${tenant.apt_location || "N/A"}</td>
          <td>${moveInDate}</td>
          <td>${moveOutDate}</td>
        `;
        tbody.appendChild(row);
    });
}
// End of Table in Edit

// Edit Tenant Details
async function editTenant(event) {
    event.preventDefault();

    const personId = document.getElementById("personIdEdit").value;
    const firstNameId = document.getElementById("firstNameId").value;
    const middleNameId = document.getElementById("middleNameId").value;
    const lastNameId = document.getElementById("lastNameId").value;
    const birthdayP = document.getElementById("birthdayP").value;
    const street = document.getElementById("streetP").value;
    const barangay = document.getElementById("barangayP").value;
    const city= document.getElementById("cityP").value;
    const contact = document.getElementById("contactId").value;
    const moveInDate = document.getElementById("moveInDateId").value;
    const moveOutDate = document.getElementById("moveOutDateId").value;

    if (personId === undefined || personId === "") {
        mySwalala.fire({
            title: "No ID Entered!",
            text: "Must put an ID",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
        return;
    }

    // Function to check if a value is empty (handles both strings and numbers)
    function isEmpty(value) {
        return value === "" || value === null || value === undefined || (typeof value === "string" && value.trim() === "");
    }
    
    if (
        isEmpty(firstNameId) &&
        isEmpty(middleNameId) &&
        isEmpty(lastNameId) &&
        isEmpty(birthdayP) &&
        isEmpty(street) &&
        isEmpty(barangay) &&
        isEmpty(city) &&
        isEmpty(contact) &&
        isEmpty(moveInDate) &&
        isEmpty(moveOutDate)
    ) {
        mySwalala.fire({
            title: "No Inputs Detected!",
            text: "Atleast put one input",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
        return;
    } 


    // Check if some Address fields are filled while others are empty
    if ((street && !barangay && !city) || (!street && barangay && !city) || (!street && !barangay && city)) {
        mySwalala.fire({
            title: "All address fields must be filled!",
            text: "If you are going to change the address then please fill all fields",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
        return;
    }

    console.log(`The person id: ${personId}`);
    console.log(contact);
    console.log(moveInDate);
    console.log(moveOutDate);

    let requestData = {};

    let moveIn = "";
    let moveOut = "";
    if (moveInDate) {
        moveIn = new Date(moveInDate);
        requestData.moveIn = moveIn;
    }

    if (moveOutDate) {
        moveOut = new Date(moveOutDate);
        requestData.moveOut = moveOut;
    }

    if (firstNameId) {
        requestData.firstNameId = firstNameId;
    }

    if (middleNameId) {
        requestData.middleNameId = middleNameId;
    }
    
    if (lastNameId) {
        requestData.lastNameId = lastNameId;
    }
    
    if (birthdayP) {
        requestData.birthdayP = birthdayP;
    }
    
    if (street) {
        requestData.street = street;
    }
    
    if (barangay) {
        requestData.barangay = barangay;
    }
    
    if (city) {
        requestData.city = city;
    }

    if (contact) {
        if (!/^\d{11}$/.test(contact)) {
            mySwalala.fire({
                title: "Contact Number Issue!",
                text: "Contact number must be exactly 11 digits.",
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonColor: "#dc3545"
            });
            return;
        }
        requestData.contact = contact; // Add contact if valid
    }

    if (moveIn && moveOut && moveIn >= moveOut) {
        mySwalala.fire({
            title: "Move-Out Date Issue!",
            text: "Move-out date must be after the move-in date.",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
        return;
    }

    if (moveIn && moveOut && moveOut <= moveIn) {
        mySwalala.fire({
            title: "Move-In Date Issue!",
            text: "Move-In date must be before the move-out date.",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
        return;
    }

    try { 
        const response = await fetch(`/edit-tenant/${personId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        const responseE = await fetch(`/search-tenant/All`)
        const tenantE = await responseE.json();
        // const result = await response.json();
        
        if (response.ok) {
            mySwalala.fire({
                title: "Success!",
                text: "Tenant Information Edited Successfully!",
                icon: "success",
                iconColor: "#006400"
            }).then(() => {
                viewEditTenantInfo(tenantE);
                event.target.reset();
            });   
        } else {
            mySwalala.fire({
                title: "No tenant found!",
                text: "Failed to edit tenant information.",
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonColor: "#dc3545"
            });
        }
    } catch (error) {
        mySwalala.fire({
            title: "Failed!",
            text: "Failed to update tenant information.",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
    }
}

const editTenantForm = document.getElementById('editTenantForm');
if (editTenantForm) {
    editTenantForm.addEventListener('submit', editTenant);
}
// End of Edit Tenant Details Function

// Add Room
async function addRoom(event) {
    event.preventDefault();

    const floor = parseInt(document.getElementById("roomFloorAdd").value, 10);
    const maxRenters = parseInt(document.getElementById("maxRentersAdd").value, 10);
    const price = parseFloat(document.getElementById("roomPriceAdd").value);
    const status = parseInt(document.getElementById("roomStatusAdd").value, 10);
    let number_of_Renters = 0;
    
    // Get the apartment name
    const apt_loc = await getCurrentApartment();
    
    // Validate apartment ID
    if (!apt_loc) {
        mySwalala.fire({
            title: "Error!",
            text: "Invalid apartment location.",
            icon: "error",
            iconColor: "#8B0000",
            background: "#222",
            color: "#fff",
            confirmButtonColor: "#dc3545"
        });
        return;
    }
    
   // Validate input fields
    if (isNaN(floor) || floor <= 0 || isNaN(maxRenters) || maxRenters < 1 || 
    isNaN(price) || price <= 0 || isNaN(status)) {
    let errorMsg = "";

    if (isNaN(floor) || floor <= 0) errorMsg = "Floor must be a non-negative number.";
    else if (isNaN(maxRenters) || maxRenters < 1) errorMsg = "Max renters must be at least 1.";
    else if (isNaN(price) || price <= 0) errorMsg = "Price must be a non-negative number.";
    else if (isNaN(status)) errorMsg = "Status is required.";

    mySwalala.fire({ 
        title: "Error!", 
        text: errorMsg, 
        icon: "error", 
        iconColor: "#8B0000",
        background: "#222", 
        color: "#fff", 
        confirmButtonColor: "#8B0000" 
    });

    return;
    }
    
    // Prepare request payload
    const newRoom = { 
        floor, 
        tenants: number_of_Renters, 
        max_renters: maxRenters, 
        status, 
        price, 
        apt_loc
    };
    
    try {
        const response = await fetch("/addRoom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRoom)
        });

        if (response.ok) {
            mySwalala.fire({
                title: "Success!",
                text: "Room added successfully!",
                icon: "success",
                iconColor: "#006400"
            }).then(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('addRoomModal'));
                modal.hide();
                event.target.reset();
                fetchRooms(); // Refresh room list
            });
        } else {
            mySwalala.fire({
                title: "Failed!",
                text: "Failed to add room.",
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonColor: "#dc3545"
            });
        }
    } catch (error) {
        console.error("Error adding room:", error);
        mySwalala.fire({
            title: "Error!",
            text: "Something went wrong. Please try again.",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
    }
}
// End of Add Room Function

// Update Room Details
async function updateRoom(event) {
    event.preventDefault();
    // IF IN the rooms modal || Change
    const selectedRoomId = document.querySelector('.allRoomId').value;
    const floor = parseInt(document.getElementById("roomFloor").value, 10);
    const tenants = parseInt(document.getElementById("numTenants").value, 10);
    const maxRenters = parseInt(document.getElementById("maxRenters").value, 10);
    const price = parseFloat(document.getElementById("roomPrice") ? document.getElementById("roomPrice").value : "0.00");
    const status = parseInt(document.getElementById("roomStatus").value, 10);

    console.log("Selected status:", status); // Debugging log

    // Validate input fields
    if (!selectedRoomId || isNaN(floor) || floor <= 0 || isNaN(tenants) || tenants < 0 || 
    isNaN(maxRenters) || maxRenters < 1 || isNaN(price) || price <= 0 || isNaN(status)) {

    let errorMsg = !selectedRoomId ? "Room ID is required." :
                isNaN(floor) || floor <= 0 ? "Floor must be a non-negative number." :
                isNaN(tenants) || tenants < 0 ? "Tenants must be a non-negative number." :
                isNaN(maxRenters) || maxRenters < 1 ? "Max renters must be at least 1." :
                isNaN(price) || price <= 0 ? "Price must be a non-negative number." :
                "Status is required.";

    mySwalala.fire({
        title: "Error!",
        text: errorMsg,
        icon: "error",
        iconColor: "#8B0000"
    });

    return;
    }

    // Gather validated values
    const updatedRoom = {
        floor,
        tenants,
        max_renters: maxRenters,
        status,
        price,
        room_id: selectedRoomId
    };

    try {
        const response = await fetch("/updateRoom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedRoom)
        });
    
        if (response.ok) {
            mySwalala.fire({
                title: "Success!",
                text: "Room updated successfully!",
                icon: "success",
                iconColor: "#006400",
                confirmButtonText: "OK"
            }).then(() => {
                event.target.reset(); 
                fetchRooms(); 
                updateAllRoomDropdown();
            });
        } else {
            mySwalala.fire({
                title: "Error!",
                text: "Failed to update room.",
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonText: "OK"
            });
        }
    
        // Refresh rooms to update the display
        fetchRooms();
        } catch (error) {
            console.error("Error updating room:", error);
            mySwalala.fire({
                title: "Error!",
                text: "An unexpected error occurred.",
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonText: "OK"
            });
        }
}
// End of Update Room Details Function

// Delete Room
async function deleteRoom(roomId) {
    if (!roomId) {
        mySwalala.fire({
            title: "Error!",
            text: "Please enter a valid Room ID!",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#8B0000"
        });
        return;
    }

    // Confirm deletion using Swal
    const result = await mySwalala.fire({
        title: "Are you sure?",
        text: `Do you really want to delete Room ${roomId}?`,
        icon: "warning",
        iconColor: "#8B0000",
        showCancelButton: true,
        confirmButtonColor: "#8B0000",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return; // Stop if user cancels

    try {
        const response = await fetch(`/deleteRoom/${roomId}`, { method: "DELETE" });

        if (!response.ok) {
            const errorData = await response.json(); 
            mySwalala.fire({
                title: "Error!",
                text: errorData.error,
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonColor: "#8B0000"
            });
            return false;
        }

        mySwalala.fire({
            title: "Deleted!",
            text: `Room ${roomId} has been successfully deleted.`,
            icon: "success",
            iconColor: "#006400",
            confirmButtonColor: "#006400"
        });

        // Refresh room list
        fetchRooms();

        return true;
    } catch (error) {
        console.error("Error deleting room:", error);
        mySwalala.fire({
            title: "Error!",
            text: "An unexpected error occurred while deleting the room.",
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#8B0000"
        });
        return false;
    }
}
// End of Delete Room Function

// Populate the room table with room details || pag open sa rooms
async function populateRoomTable(rooms) {
    const tbody = document.getElementById('roomTable').querySelector('tbody');
    tbody.innerHTML = '';  // Clear existing table data
    rooms.forEach(room => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${room.Room_ID}</td>
            <td>${room.Room_floor}</td>
            <td>${room.Number_of_Renters}</td>
            <td>${room.Room_maxRenters}</td>
            <td>₱${room.Room_Price.toLocaleString()}</td>
            <td>${room.Room_Status_Desc}</td>
        `;
        tbody.appendChild(row);
    });
}
// End of Populate room with details

// View All Rooms || Inside rooms >> view all
async function viewAllRooms(rooms) {
    const tbody = document.getElementById('allRoomsTable').querySelector('tbody');
    tbody.innerHTML = '';  // Clear existing table data

    rooms.forEach(room => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${room.Room_ID}</td>
            <td>${room.Room_floor}</td>
            <td>${room.Number_of_Renters}</td>
            <td>${room.Room_maxRenters}</td>
            <td>₱${room.Room_Price.toLocaleString()}</td>
            <td>${room.Room_Status_Desc}</td>
            <td>${room.Apt_Location}</td>
        `;
        tbody.appendChild(row);
    });

    // **Destroy existing DataTable instance if it exists (important!)**
    if ($.fn.DataTable.isDataTable('#allRoomsTable')) {
        $('#allRoomsTable').DataTable().destroy();
    }

    // **Reinitialize DataTables**
    $('#allRoomsTable').DataTable({
        scrollX: true,  
        autoWidth: false, 
        responsive: true, 
        "pageLength": 10,
        "lengthMenu": [10, 25, 50, 100],
    });

    
}
// End of View All Rooms Function

// For the view all rooms button in the room management
const viewRooms = document.getElementById("viewRooms");
viewRooms.addEventListener("click", async function() {
    console.log("viewRooms:", viewRooms);
    fetchRooms();;
    const response = await fetch("/viewAll")
    .then(response => response.json())
    .then(data => {
        console.log("Calling viewAllRooms with data:", data);
        viewAllRooms(data);
    })
    .catch(error => console.error("Fetch error:", error));
  
    const rooms = await response.json();
    await viewAllRooms(rooms);
})  

// Update room dropdown based on selected apartment
async function updateRoomDropdown() {
    const aptLocId = await getCurrentApartment(); // Get the current apartment number
    if (!aptLocId) return; // Exit if no valid apartment ID

    console.log('Current apt_ID: ', aptLocId)

    const roomDropdowns = document.querySelectorAll(".vacantRoomId"); // Select multiple elements
    if (roomDropdowns.length === 0) return;


    roomDropdowns.forEach(dropdown => {
        dropdown.innerHTML = ""; // Clear existing options

        // Fetch available rooms from the database
        fetch(`/getRooms/${aptLocId}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    let option = document.createElement("option");
                    option.textContent = "No available rooms";
                    dropdown.appendChild(option);
                } else {
                    data.forEach(room => {
                        let option = document.createElement("option");
                        option.value = room.Room_ID;
                        option.textContent = `Room ${room.Room_ID}`;
                        dropdown.appendChild(option);
                    });
                }
            })
            .catch(error => console.error("Error fetching rooms:", error));
    });
}
// End of Update room dropdown based on selected apartment

// Update room dropdown based on selected apartment REGARDLESS OF STATUS
async function updateAllRoomDropdown() {
    const aptLocId = await getCurrentApartment(); // Get the current apartment number
    if (!aptLocId) return; // Exit if no valid apartment ID

    console.log('Current apt_ID: ', aptLocId)

    const roomDropdowns = document.querySelectorAll(".allRoomId"); // Select multiple elements
    if (roomDropdowns.length === 0) return;


    roomDropdowns.forEach(dropdown => {
        dropdown.innerHTML = ""; // Clear existing options

        // Fetch available rooms from the database
        fetch(`/getAllRooms/${aptLocId}`)
            .then(response => response.json())
            .then(data => {
                if (data.length === 0) {
                    let option = document.createElement("option");
                    option.textContent = "No available rooms";
                    dropdown.appendChild(option);
                } else {
                    data.forEach(room => {
                        let option = document.createElement("option");
                        option.value = room.Room_ID;
                        option.textContent = `Room ${room.Room_ID}`;
                        dropdown.appendChild(option);
                    });
                }
            })
            .catch(error => console.error("Error fetching rooms:", error));
    });
}
// End of Update room dropdown based on selected apartment


// Search Mechanism
document.addEventListener('DOMContentLoaded', function() {
    // Function to get current apartment from the span element
    function getApartment() {
        const locationSpan = document.getElementById('currentLocation');
        if (locationSpan) {
            return locationSpan.textContent.trim();
        }
        return ""; // Fallback if element not found
    }
    
    // Function to send current apartment to the server
    async function sendApartment() {
        const currentApartment = getApartment();
        
        // Check if we have a valid apartment name
        if (!currentApartment) {
            console.warn("No apartment location found in the span element.");
            return false;
        }
        
        // Extract just the first word of the apartment name if needed
        const apartmentFirstWord = currentApartment.split(" ")[0];
        
        console.log("Sending apartment to server:", apartmentFirstWord);
        
        try {
            const response = await fetch("/set-current-apartment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apartment: apartmentFirstWord }),
            });
            
            if (!response.ok) {
                throw new Error("Failed to send current apartment.");
            }
            
            console.log(`Current apartment (${apartmentFirstWord}) sent successfully.`);
            return true;
        } catch (error) {
            console.error("Error sending current apartment:", error);
            return false;
        }
    }
    
    // Send the current apartment to the server when the page loads
    sendApartment();
    
    // Make getCurrentApartment available globally if needed
    window.getApartment = getApartment;
    window.sendApartment = sendApartment;
});
// // Call this function when the page loads
// window.onload = sendCurrentApartment;

// Search Function
document.addEventListener('DOMContentLoaded', function() {
    const searchTenantBtn = document.getElementById("searchTenantBtn");
    const mainContentArea = document.getElementById("mainContentArea");
    const searchTenantFormContainer = document.getElementById("searchTenantFormContainer");
    const searchForm = document.getElementById("searchTenantForm");
    
    // Flag to track if the search interface has been initialized
    let searchInterfaceInitialized = false;
    
    // Search Tenant Button Click
    if (searchTenantBtn && mainContentArea && searchTenantFormContainer) {
      searchTenantBtn.addEventListener("click", function() {
        // Only create the search interface once
        if (!searchInterfaceInitialized) {
          // Clear main content area
          mainContentArea.innerHTML = "";
          
          // Create the search results container
          const resultsContainer = document.createElement("div");
          resultsContainer.id = "searchResultsContainer";
          resultsContainer.className = "mt-4";
          resultsContainer.innerHTML = `
            <h2>Search a Tenant</h2>
            <div class="table-responsive">
              <table class="table table-dark table-striped table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Date of Birth</th>
                    <th>Sex</th>
                    <th>Room</th>
                    <th>Address</th>
                    <th>Location</th>
                    <th>Move-In Date</th>
                    <th>Move-Out Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="tenantResultsBody">
                  <!-- Initially empty -->
                </tbody>
              </table>
            </div>
          `;
          
          // Make form visible and add the results container
          searchTenantFormContainer.style.display = "block";
          searchTenantFormContainer.insertBefore(resultsContainer, searchTenantFormContainer.firstChild);
          
          // Add to main content area
          mainContentArea.appendChild(searchTenantFormContainer);
          
          // Set flag to indicate search interface is initialized
          searchInterfaceInitialized = true;
        } else {
          // Just show the form container if it's already been created
          searchTenantFormContainer.style.display = "block";
          
          // Make sure it's in the main content area
          if (!mainContentArea.contains(searchTenantFormContainer)) {
            mainContentArea.innerHTML = "";
            mainContentArea.appendChild(searchTenantFormContainer);
          }
          
          // Clear previous search results
          const resultsBody = document.getElementById("tenantResultsBody");
          if (resultsBody) {
            resultsBody.innerHTML = '';
          }
        }
      });
    }
    
    // Search form submission handler
    if (searchForm) {
      searchForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        // Get search input from the form
        const userInput = document.getElementById("userInput").value.trim();
        console.log("THE USER INPUT:", userInput)
        if (!userInput) {
          alert("Please enter a search term");
          return;
        }
        
        // Get reference to results body
        const resultsBody = document.getElementById("tenantResultsBody");
        if (!resultsBody) return;
        
        // Clear previous results
        resultsBody.innerHTML = '';
        
        try {
          // Show loading indicator
          resultsBody.innerHTML = '<tr><td colspan="9" class="text-center">Loading...</td></tr>';
          
          // Send search request to backend
          const response = await fetch(`/search-tenant/${userInput}`);
          
          if (response.status === 404) {
            resultsBody.innerHTML = '<tr><td colspan="9" class="text-center">No tenant found!</td></tr>';
            return;
          }
          
          if (!response.ok) {
            throw new Error('Search request failed');
          }
          
          const tenants = await response.json();
          
          let apartmentNow = window.getApartment();

          if ((tenants[0].apt_location.split(" ")[0].toLowerCase() !== apartmentNow.toLowerCase()) && userInput.toLowerCase() !== "all") {
            mySwalala.fire({
                title: "No Tenant Found!",
                text: "This tenant does not exist in " + tenants[0].apt_location.split(" ")[0] + " Apartment",
                icon: "error",
                iconColor: "#8B0000",
                confirmButtonColor: "#dc3545"
            }).then(() => {
                document.getElementById("userInput").value = ""; // Clears the input field
            });
            resultsBody.innerHTML = '';
            return;
          }

          // Clear loading message
          resultsBody.innerHTML = '';
          
          if (tenants.length === 0) {
            resultsBody.innerHTML = '<tr><td colspan="9" class="text-center">No tenant found!</td></tr>';
            return;
          }
          
          // Check if tenant belongs to current apartment
          
          // Populate table with results
          tenants.forEach(tenant => {
            // Format address
            const address = [
              tenant.Person_Street || "",
              tenant.Brgy_Name || "",
              tenant.City_Name || ""
            ].filter(Boolean).join(", ");
            
            // Format move-in date
            const moveInDate = tenant.actual_move_in_date !== '0000-00-00' 
              ? new Date(tenant.actual_move_in_date).toLocaleDateString() 
              : 'Not available';

            // Format move-out date
            const moveOutDate = tenant.actual_move_out_date !== '0000-00-00' 
            ? new Date(tenant.actual_move_out_date).toLocaleDateString() 
            : 'Not Yet Set';

            const birthDay = tenant.Person_DOB !== '0000-00-00' 
            ? new Date(tenant.actual_move_in_date).toLocaleDateString() 
            : 'Not available';
            
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${tenant.Person_ID || "N/A"}</td>
              <td>${tenant.FullName || "N/A"}</td>
              <td>${tenant.Person_Contact || "N/A"}</td>
              <td>${birthDay || "N/A"}</td>
              <td>${tenant.Person_sex || "N/A"}</td>
              <td>${tenant.room_id || "N/A"}</td>
              <td>${address || "N/A"}</td>
              <td>${tenant.apt_location || "N/A"}</td>
              <td>${moveInDate}</td>
              <td>${moveOutDate}</td>
              <td>
                <button class="action-btn view-tenant" data-id="${tenant.Person_ID}" title="View Details">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="action-btn edit-tenant" data-id="${tenant.Person_ID}" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
              </td>
            `;
            resultsBody.appendChild(row);
          });
          
          // Add event listeners to the action buttons
          setupActionButtons();
          
        } catch (error) {
          console.error("Error searching tenant:", error);
          resultsBody.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error searching for tenant. Please try again.</td></tr>';
        }
      });
    }
    
    // Function to set up action buttons
    function setupActionButtons() {
      // View tenant details
      document.querySelectorAll('.view-tenant').forEach(button => {
        button.addEventListener('click', function() {
          const tenantId = this.getAttribute('data-id');
          // Implementation for viewing tenant details
          console.log(`View tenant ${tenantId}`);
          // You can implement logic to show tenant details in a modal or redirect to details page
        });
      });
    }
});
// End of Search Function


// Check Rooms
async function fetchRooms() {
    try {
        const response = await fetch('/rooms'); // Fetch all rooms
        const rooms = await response.json();
        console.log("Fetched rooms:", rooms);
        return rooms; // Return the fetched rooms
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return []; // Return an empty array if there's an error
    }
}



// Payment Function
document.addEventListener('DOMContentLoaded', function () {
    const paymentTenantBtn = document.getElementById("paymentBtn");
    const mainContentArea = document.getElementById("mainContentArea");
    const paymentTenantFormContainer = document.getElementById("paymentTenantFormContainer");
    const resultsContainerId = "paymentResultsContainer";
    const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
    const formRentPayment = document.getElementById("formRentPayment");
    const formMiscPayment = document.getElementById("formMiscPayment");
    const totalRentField = document.getElementById("total_rent");
    const rentPaymentTotal = document.getElementById("rentPaymentTotal");
    const miscPaymentTotal = document.getElementById("miscPaymentTotal");
    let rentPrice = 0; //global variable for rent
    let otherChargesPrice = 0  //global variable for other charges
    let changeAmount = 0; //global variable for change

    // Ensure the payment results container and table exist
    function ensureResultsContainer() {
        let resultsContainer = document.getElementById(resultsContainerId);

        if (!resultsContainer) {
            resultsContainer = document.createElement("div");
            resultsContainer.id = resultsContainerId;
            resultsContainer.className = "mt-4";
            resultsContainer.innerHTML = `
                <h2>Payment</h2>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Room ID</th>
                                <th>Name</th>
                                <th>Rent Status</th>
                            </tr>
                        </thead>
                        <tbody id="tenantResultsBody">
                            <!-- Initially empty -->
                        </tbody>
                    </table>
                </div>
            `;

            paymentTenantFormContainer.style.display = "block";
            paymentTenantFormContainer.insertBefore(resultsContainer, paymentTenantFormContainer.firstChild);
        }
    }

    // Function to populate the table
    function populateTable() {
        ensureResultsContainer(); // Ensure table exists before accessing it
        const resultsBody = document.getElementById("tenantResultsBody");

        if (resultsBody) {
            resultsBody.innerHTML = ''; // Clear previous content

            sampleTenants.forEach(tenant => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tenant.id}</td>
                    <td>${tenant.name}</td>
                    <td>${tenant.rent}</td>
                `;
                resultsBody.appendChild(row);
            });
        }
    }

    // Payment Tenant Button Click
    if (paymentTenantBtn && mainContentArea && paymentTenantFormContainer) {
        paymentTenantBtn.addEventListener("click", function () {
            // Clear main content area
            mainContentArea.innerHTML = "";
            
            // Hide payment form container initially
            paymentTenantFormContainer.style.display = "none";
            
            // Add to main content area
            mainContentArea.appendChild(paymentTenantFormContainer);
            
            // Now show it and populate the table
            paymentTenantFormContainer.style.display = "block";
            populateTable();
        });
    }

    // Confirm Button click before Payment Process
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener("click", async function () {
            // Call getRentPrice to update total rent before submission
            const totalRent = await getRentPrice(); // Wait for rent price to be retrieved
            const totalUpdatedRent = await getMiscellaneousPrice();
            
            if (totalRent !== null && totalUpdatedRent !== null) {
                rentPrice = totalRent;  // Store base rent price globally
                otherChargesPrice = totalUpdatedRent; // Store updated rent with misc charges globally

                // Update values in HTML
                totalRentField.value = `₱${totalRent.toFixed(2)}`;
                rentPaymentTotal.value = `₱${totalRent.toFixed(2)}`;
                miscPaymentTotal.value = `₱${totalUpdatedRent.toFixed(2)}`;
            } 
        });
    }

    // Form submission rent payment
    if (formRentPayment) {
        formRentPayment.addEventListener("submit", function (e) {
            e.preventDefault();

            //Calls payment process
            paymentProcess();

            //Update change
            const changeRentAmount = document.getElementById("changeRentAmount");
            changeRentAmount.value = changeAmount

            // Get reference to results body again (might have been recreated)
            const resultsBody = document.getElementById("tenantResultsBody");
            
            // Refresh table
            populateTable();
        });
    }

    // Retrieve Rent Price
    async function getRentPrice() {
        try {
            let personId = Number(document.getElementById("personId").value);
            let roomId = Number(document.getElementById("roomId").value);
            console.log("IS THIS ROOM ID?", roomId);
            // Check if valid numbers
            if (!roomId || isNaN(roomId) || roomId <= 0) {
                alert("Invalid Room ID.");
                return null;
            }
            if (!personId || isNaN(personId) || personId <= 0) {
                alert("Invalid Person ID.");
                return null;
            }

            // Fetch Rent Price
            const response = await fetch(`/get-room-price/${roomId}`);
            if (!response.ok) throw new Error("Failed to fetch room price");

            const data = await response.json();
            let rentPrice = Number(data.rent_price); // Store rent price
            console.log(rentPrice + "properly stored!")

            // Fetch Electric Bill
            try {
                const meterStart = Number(document.getElementById("start_meter").value);
                const meterEnd = Number(document.getElementById("end_meter").value);
                let numRenters = 0; 
                const waterBill = Number(document.getElementById("water_bill").value);

                if (isNaN(meterStart) || isNaN(meterEnd)) {
                    throw new Error("Invalid meter readings.");
                }

                // Fetch Number of Tenants
                try {
                    const rentersResponse = await fetch(`/get-number-of-renters?roomId=${roomId}`);
                    if (!rentersResponse.ok) throw new Error("Failed to fetch max renters");

                    const rentersData = await rentersResponse.json();
                    numRenters = rentersData.numRenters;
                    console.log("IS THE NUM RENTERS BLUE?", numRenters);
                    console.log(rentersData);

                } catch (error) {
                    console.error("Error fetching number of renters:", error);
                    Swal.fire("Error!", "Could not retrieve number of renters.", "error");
                }

                // Fetch Electric Bill
                const electricResponse = await fetch(`/calculate-electric-bill?prev_meter=${meterStart}&current_meter=${meterEnd}&num_renters=${numRenters}`);
                if (!electricResponse.ok) throw new Error("Failed to fetch electric bill.");

                const electricData = await electricResponse.json();
                const electricBill = Number(electricData.total_bill); // with the function of calculateElectricity, this is the utility

                console.log("THEM RENT PRICE:", rentPrice);
                console.log("THEM electric PRICE:", electricBill);
                console.log("THEM numRenters:", numRenters);
        
                // Calculate Total Rent
                if (waterBill !== 150) {
                    rentPrice = (rentPrice + electricBill - (150 * numRenters)) + (waterBill * numRenters);
                } else {
  
                    rentPrice += electricBill;
                }

                const contractDetails_IDRes = await fetch(`/getCDID/${personId}`);
                if (!contractDetails_IDRes.ok) throw new Error("Failed to get contract_Details_ID.");
                const contractDetails_ID = await contractDetails_IDRes.json(); // Direct access, as the API returns the ID directly
                const meterTotal = meterEnd - meterStart;
                const utility = electricBill;
                const totalBill = await calculateMonthlyBill();

                console.log("Total bill: ", totalBill);


                const contractBillBody = {
                    Contract_Details_ID: contractDetails_ID,
                    total_bill: totalBill,
                    Balance: totalBill,
                    Bill_meterEndMonth: meterEnd,
                    Bill_meterStartMonth: meterStart,
                    meter_total: meterTotal,
                    Utility_Computation: utility
                }
                try{
                    const insertBills = await fetch(`/createBillWithDetails`,{
                        method: "POST",
                        headers: {"Content-Type": "application/json" },
                        body: JSON.stringify(contractBillBody)
                    });

                    if(insertBills.ok){
                        mySwalala.fire({
                            title: "Success!",
                            text: "Bill Added!",
                            icon: "success",
                            iconColor: "#006400"
                        });
                    } else{
                        mySwalala.fire({
                            title: "Failed!",
                            text: "Failed to add Bill!.",
                            icon: "error",
                            iconColor: "#8B0000",
                            confirmButtonColor: "#dc3545"
                        });
                    }

                } catch (error) {
                    console.error("Error adding bill:", error);
                    mySwalala.fire({
                        title: "Error!",
                        text: "Something went wrong. Please try again.",
                        icon: "error",
                        iconColor: "#8B0000",
                        confirmButtonColor: "#dc3545"
                    });
                }
                
            } catch (error) {
                console.error("Error fetching electric bill:", error);
            }

            return rentPrice;

        } catch (error) {
            console.error("Error fetching rent price:", error);
            return null;
        }
    }

    // Payment Process
    async function paymentProcess(event) {
        try {
            const payment = parseFloat(document.getElementById("inputRentPaymentAmount").value);
            const remarks = document.getElementById("inputRentPaymentRemarks").value;

            // Checks if valid inputs
            if (!payment || payment < rentPrice) {
                Swal.fire("Error!", "Enter a valid amount greater than or equal to the rent price.", "error");
                return;
            }

            // Payment change calculation
            changeAmount = payment - rentPrice;

            // Send payment data to the server
            const response = await fetch("/process-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    personId: document.getElementById("personId").value,
                    roomId: document.getElementById("roomId").value,
                    amountPaid: payment,
                    date: new Date().toISOString().split("T")[0],
                    remarks: remarks,
                }),
            });

            if (!response.ok) throw new Error("Failed to process payment");

            // Show success message
            Swal.fire("Success!", "Payment processed successfully.", "success");

        } catch (error) {
            console.error(error);
            Swal.fire("Error!", "Error processing payment.", "error");
        }
    }
    
    document.addEventListener("DOMContentLoaded", function () {
        const paymentForm = document.getElementById("paymentTenantForm");
        if (paymentForm) {
            paymentForm.addEventListener("submit", paymentProcess);
            console.log(sucess)
        }
    });
    
     // Ensure the payment results container and table exist
    function ensureResultsContainer() {
        let resultsContainer = document.getElementById('paymentResultsContainer');

        if (!resultsContainer) {
            resultsContainer = document.createElement("div");
            resultsContainer.id = "paymentResultsContainer";
            resultsContainer.className = "mt-4";
            resultsContainer.innerHTML = `
                <h2>Payment Details</h2>
                <div class="table-responsive">
                    <table class="table table-dark table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Person ID</th>
                                <th>Name</th>
                                <th>Room ID</th>
                                <th>Rent Status</th>
                            </tr>
                        </thead>
                        <tbody id="tenantResultsBody">
                            <!-- Table data will be inserted dynamically -->
                        </tbody>
                    </table>
                </div>
            `;

            // Append the table inside the payment form container
            const paymentTenantFormContainer = document.getElementById("paymentTenantFormContainer");
            if (paymentTenantFormContainer) {
                paymentTenantFormContainer.insertBefore(resultsContainer, paymentTenantFormContainer.firstChild);
            }
        }
    }

    // Clears previous table data before adding new rows
    function clearTableBody() {
        const resultsBody = document.getElementById("tenantResultsBody");
        if (resultsBody) {
            resultsBody.innerHTML = ""; // Clear all existing rows
        }
    }

    // Populates the payment table with tenant payment details
    async function populateTable() {
        ensureResultsContainer();
        clearTableBody(); // Clear existing table content

        const resultsBody = document.getElementById("tenantResultsBody");

        try {
            const response = await fetch("/get-tenants-payments"); // Fetch payments from server
            if (!response.ok) throw new Error("Failed to fetch tenant payment data");

            const tenants = await response.json();

            if (tenants.length === 0) {
                resultsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No payment records found.</td></tr>`;
                return;
            }

            tenants.forEach(tenant => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tenant.person_id}</td>
                    <td>${tenant.name}</td>
                    <td>${tenant.room_id}</td>
                    <td>${tenant.rent_status}</td>
                `;
                resultsBody.appendChild(row);
            });

        } catch (error) {
            console.error("Error fetching tenant payment data:", error);
            resultsBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Error loading payment data.</td></tr>`;
        }
    }

    // Fetch payments from the server when the modal opens
    document.getElementById("modalRentPayment").addEventListener("show.bs.modal", populateTable);
    });
// End of Payment Function

    /**     REPORTS SECTION          */
    // Report For Tenant Summary Report
    async function viewTenantReport(contracts) {
        const tbody = document.getElementById('tenantReportTable').querySelector('tbody');
        tbody.innerHTML = '';  // Clear existing table data

        contracts.forEach(contract => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${contract["Contract Status"]}</td>
                <td>${contract["First Name"]}</td>
                <td>${contract["Last Name"]}</td>
                <td>${contract["Contact Number"]}</td>
                <td>${contract["Date of Birth"]}</td>
                <td>${contract["Sex"]}</td>
                <td>${contract["Apartment Location"]}</td>
                <td>₱${contract["Room Price"].toLocaleString()}</td>
                <td>₱${contract["Utilities Total"].toLocaleString()}</td>
                <td>₱${contract["Other Charges"].toLocaleString()}</td>
                <td>₱${contract["Total Bill"].toLocaleString()}</td>
                <td>₱${contract["Balance"].toLocaleString()}</td>
                <td>${contract["Contract Date"]}</td>
                <td>₱${contract["Payment Amount"].toLocaleString()}</td>
                <td>${contract["Payment Date"]}</td>
            `;
            tbody.appendChild(row);
        });

        // **Destroy existing DataTable instance if it exists (important!)**
        if ($.fn.DataTable.isDataTable('#tenantReportTable')) {
            $('#tenantReportTable').DataTable().destroy();
        }

        // **Reinitialize DataTables**
        $('#tenantReportTable').DataTable({
            scrollX: true,  
            autoWidth: false, 
            responsive: true, 
            "pageLength": 10,
            "lengthMenu": [10, 20, 30, 50, 100],
        });
}

// Report For Room Summary Report
async function viewRoomReport(contracts) {
    const tbody = document.getElementById('roomReportTable').querySelector('tbody');
    tbody.innerHTML = '';  // Clear existing table data

    contracts.forEach(contract => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contract["Room Number"]}</td>
            <td>${contract["Floor"]}</td>
            <td>${contract["Current Tenant"]}</td>
            <td>${contract["Max Capacity"]}</td>
            <td>${contract["Occupancy Rate"].toLocaleString()}</td>
            <td>₱${contract["Monthly Rent"].toLocaleString()}</td>
            <td>${contract["Location"]}</td>
            <td>${contract["Status"]}</td>
        `;
        tbody.appendChild(row);
    });

    // **Destroy existing DataTable instance if it exists (important!)**
    if ($.fn.DataTable.isDataTable('#roomReportTable')) {
        $('#roomReportTable').DataTable().destroy();
    }

    // **Reinitialize DataTables**
    $('#roomReportTable').DataTable({
        scrollX: true,  
        autoWidth: false, 
        responsive: true, 
        "pageLength": 10,
        "lengthMenu": [10, 20, 30, 50, 100],
    });
}


// Create the chart
async function createRoomOccupancyChart() {
    fetchRooms();
    const response = await fetch('/getRoomsReport');
    const roomData = await response.json();
    
    // Process data for Chart.js
    const locations = [...new Set(roomData.map(room => room.Location))];
    const datasets = locations.map(location => {
        const locationRooms = roomData.filter(room => room.Location === location);
        return {
            label: location,
            data: locationRooms.map(room => room['Occupancy Rate'].replace('%', '')),
            backgroundColor: getRandomColor()
        };
    });
    
    // Create chart
    const ctx = document.getElementById('roomOccupancyChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: roomData.map(room => `Room ${room['Room Number']}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Room Occupancy by Location'
                },
                legend: {
                    position: 'top',
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Occupancy Rate (%)'
                    }
                }
            }
        }
    });
}

function getRandomColor() {
    const hue = Math.floor(Math.random() * 360);  // Random hue (0-360 for full spectrum)
    const saturation = 80; // High saturation for vivid colors
    const lightness = 50;  // Medium lightness for strong contrast

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Returns an HSL color string
}

// Get the year
async function fetchRevenueData(year) {
    const response = await fetch(`/monthly-revenue/${year}`);
    const data = await response.json();
    return data;
}

// Revenue chart
async function createRevenueChart() {
    const year = new Date().getFullYear();
    const revenueData = await fetchRevenueData(year);

    const labels = revenueData.map(item => item.month);
    const revenueValues = revenueData.map(item => parseFloat(item.revenue)); 


    const ctx = document.getElementById('revenueChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Revenue',
                data: revenueValues,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Monthly Revenue (${year})`
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue (₱)'
                    }
                }
            }
        }
    });
}


// Get the age distri
async function fetchAgeDistributionData() {
    const response = await fetch('/age-distribution');
    const data = await response.json();
    
    return data;
}

// Age distribution chart
async function createAgeDistributionChart() {
    const ageData = await fetchAgeDistributionData();

    const labels = ageData.map(item => item.age_group);
    const values = ageData.map(item => item.tenant_count);

    const ctx = document.getElementById('ageDistributionChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Tenant Age Distribution',
                data: values,
                backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#ff9f40'],
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tenant Age Distribution'
                }
            }
        }
    });
}

// Just call this para dili isa2
async function initializeReports() {
    // Initialize revenue chart with current year
    createRevenueChart();
    
    // Initialize occupancy chart
    createRoomOccupancyChart();
    
    // Initialize age distribution chart
    createAgeDistributionChart();
}


// Automated Monthly Billing Function
async function calculateMonthlyBill() {
    try {
        // Get current date to check if it's the 15th
        const today = new Date();
        const day = today.getDate();
        const formattedDate = today.toISOString().split("T")[0]; 
        
        // Only run on the 15th of each month
        if (day !== 15) {
            console.log("Not the 15th of the month. Skipping billing calculation.");
            return;
        }
        
        console.log("Starting monthly billing calculation...");
        
        // Get all active rooms
        const roomsResponse = await fetch('/get-active-rooms');
        const roomsData = await roomsResponse.json();
        
        if (!roomsResponse.ok) {
            throw new Error('Failed to fetch active rooms');
        }

        let totalRentFinal = 0;
        
        // Process each room
        for (const room of roomsData) {
            const roomId = room.room_id;
            
            // Get room price
            const priceResponse = await fetch(`/get-room-price/${roomId}`);
            const priceData = await priceResponse.json();
            
            if (!priceResponse.ok) {
                console.error(`Failed to get price for room ${roomId}`);
                continue;
            }
            
            const rentPrice = Number(priceData.rent_price);
            
            // Get meter readings
            const meterStart = Number(document.getElementById("start_meter").value);
            const meterEnd = Number(document.getElementById("end_meter").value);
            
            let numRenters = 0; 
            const waterBill = Number(document.getElementById("water_bill").value);
            const rentersResponse = await fetch(`/get-number-of-renters?roomId=${roomId}`);
            const rentersData = await rentersResponse.json();
            numRenters = rentersData.numRenters;
            
            // Calculate total rent
            const totalFinalRent = rentPrice + ((meterEnd - meterStart) * 12) + (waterBill * numRenters);
            
            console.log(`Room ${roomId}: Rent = ${rentPrice}, Electricity = ${(meterEnd - meterStart) * 12}, Water = ${waterBill * numRenters}`);
            console.log(`Total bill for room ${roomId}: ${totalFinalRent}`);
            
            // DAPAT MAG E STORE NIYA ANG RESULTS KAY CONTRACT BILL
            const storeBillResponse = await fetch("/store-monthly-bill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    roomId: roomId,
                    totalBill: totalFinalRent,
                    dateCovered: formattedDate,
                    balance: totalFinalRent // Assuming initial balance is full bill amount
                }),
            });

            if (!storeBillResponse.ok) {
                console.error(`Failed to store billing data for room ${roomId}`);
                continue;
            }
        }
        
        console.log("Monthly billing calculation completed successfully");
        
        // Show success notification
        mySwalala.fire({
            title: "Success!",
            text: "Monthly bills have been calculated and updated successfully!",
            icon: "success",
            iconColor: "#006400"
        });

        console.log(`Total bill for room ${roomId}: ${totalRentFinal}`);
        // DAPAT MAG E STORE NIYA ANG RESULTS KAY CONTRACT BILL
        return totalRentFinal;  // Return the total rent final
        
    } catch (error) {
        console.error("Error in monthly billing calculation:", error);
        
        // Show error notification
        mySwalala.fire({
            title: "Failed!",
            text: "Failed to calculate monthly bills: " + error.message,
            icon: "error",
            iconColor: "#8B0000",
            confirmButtonColor: "#dc3545"
        });
    }
}

// Function to set up the scheduled task
function setupMonthlyBilling() {
    // Check if we should run the billing calculation on page load
    const today = new Date();
    const day = today.getDate();
    
    if (day === 15) {
        calculateMonthlyBill();
    }
    
    // Schedule the function to check daily
    // (in a real system, this would be handled by a server-side cron job)
    setInterval(() => {
        calculateMonthlyBill();
    }, 24 * 60 * 60 * 1000); // Check once every 24 hours
}

// Initialize the monthly billing system when the page loads
//document.addEventListener('DOMContentLoaded', setupMonthlyBilling);