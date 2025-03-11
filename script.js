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
        });
    }

    // Edit Tenant
    const editTenantBtn = document.getElementById("editTenantBtn");

    // Dismiss Tenant Form
    const dismissTenentBtn = document.getElementById("dismissTenentBtn");
    const dismissTenantFormContainer = document.getElementById("dismissTenantFormContainer");

    if (dismissTenentBtn && mainContentArea && dismissTenantFormContainer) {
        dismissTenentBtn.addEventListener("click", function () {
            mainContentArea.innerHTML = "";
            dismissTenantFormContainer.style.display = "block";
            mainContentArea.appendChild(dismissTenantFormContainer);
        });
    }

    //Room Management
    const roomsBtn = document.getElementById("roomsBtn");
    const roomsFormContainer = document.getElementById("roomsFormContainer");

    if (roomsBtn && mainContentArea && roomsFormContainer){
        roomsBtn.addEventListener("click",function(){
            mainContentArea.innerHTML ="";
            roomsFormContainer.style.display = "block";
            mainContentArea.appendChild(roomsFormContainer);
        })
    }


    // Payment
    const paymentBtn = document.getElementById("paymentBtn");

    //Reports
    const reportBtn = document.getElementById("reportBtn");


    /* ---- OTHER FUNCTIONALITIES ---- */
    // Form Submissions
    const addRoomForm = document.getElementById('addRoomForm');
    addRoomForm.addEventListener('submit', addRoom);

    const updateRoomForm = document.getElementById('updateRoomForm');
    updateRoomForm.addEventListener('submit', updateRoom);

    const deleteRoomForm = document.getElementById('deleteRoomForm');
    deleteRoomForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const roomId = document.getElementById("roomIdDelete").value;
        const success = await deleteRoom(roomId);
        
        if (success) {
            // Only reset if deletion was successful
            this.reset();
        }
    });
});


// Add Room
async function addRoom(event) {
    event.preventDefault();
    // const roomsModal = document.getElementById('addRoomModal');
    const floor = parseInt(document.getElementById("roomFloorAdd").value, 10);
    const maxRenters = parseInt(document.getElementById("maxRentersAdd").value, 10);
    const price = parseFloat(document.getElementById("roomPriceAdd").value);
    const status = parseInt(document.getElementById("roomStatusAdd").value, 10);
    let number_of_Renters = 0;
    
    // Get the apartment name
    const apartmentName = getCurrentApartment();
    
    // Map apartments to their Apt_Loc_ID
    const apartmentMap = {
        "Matina Apartment": 1,
        "Sesame Apartment": 2,
        "Nabua Apartment": 3
    };
    
    // Get the ID from the map
    const apt_loc = apartmentMap[apartmentName];
    
    // Validate apartment ID
    if (!apt_loc) {
        alert("Invalid apartment location.");
        return;
    }
    
    // Validate input fields
    if (isNaN(floor) || floor < 0) {
        alert("Floor must be a non-negative number.");
        return;
    }
    if (isNaN(maxRenters) || maxRenters < 1) {
        alert("Max renters must be at least 1.");
        return;
    }
    if (isNaN(price) || price < 0) {
        alert("Price must be a non-negative number.");
        return;
    }
    if (isNaN(status)) {
        alert("Status is required.");
        return;
    }
    
    // Prepare request payload with correct parameter names
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
            alert("Room added successfully!");
            closeModal('addRoomModal');
            event.target.reset();
        } else {
            alert("Failed to add room.");
        }
        
        fetchRooms(); // Refresh rooms to update the display
    } catch (error) {
        console.error("Error adding room:", error);
    }
}
// End of Add Room Function

// Update Room Details
async function updateRoom(event) {
    event.preventDefault();
    // IF IN the rooms modal
    const roomsModal = document.getElementById('roomsModal');
    const selectedRoomId = roomsModal.querySelector('.roomId').value;
    const floor = parseInt(document.getElementById("roomFloor").value, 10);
    const tenants = parseInt(document.getElementById("numTenants").value, 10);
    const maxRenters = parseInt(document.getElementById("maxRenters").value, 10);
    const price = parseFloat(document.getElementById("roomPrice") ? document.getElementById("roomPrice").value : "0.00");
    const status = parseInt(document.getElementById("roomStatus").value, 10);

    console.log("Selected status:", status); // Debugging log

    // If any field is invalid, show a single error message
    if (!selectedRoomId) {
        alert("Room ID is required.");
        return;
    }
    if (isNaN(floor) || floor < 0) {
        alert("Floor must be a non-negative number.");
        return;
    }
    if (isNaN(tenants) || tenants < 0) {
        alert("Tenants must be a non-negative number.");
        return;
    }
    if (isNaN(maxRenters) || maxRenters < 1) {
        alert("Max renters must be at least 1.");
        return;
    }
    if (isNaN(price) || price < 0) {
        alert("Price must be a non-negative number.");
        return;
    }
    if (isNaN(status)) {
        alert("Status is required.");
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
            alert("Room updated successfully!");
            closeModal('roomsModal');
            event.target.reset();
        } else {
            alert("Failed to update room.");
        }

        // Refresh rooms to update the display
        fetchRooms();
    } catch (error) {
        console.error("Error updating room:", error);
    }
}
// End of Update Room Details Function

// Delete Room
async function deleteRoom(roomId) {
    if (!roomId) {
        alert("Please enter a valid Room ID!");
        return;
    }

    // Confirm deletion
    const confirmDeletion = confirm("Are you sure you want to delete this room?");
    if (!confirmDeletion) {
        return;
    }

    try {
        const response = await fetch(`/deleteRoom/${roomId}`, { method: "DELETE" });

        if (!response.ok) {
            const errorData = await response.json(); // Parse JSON error response
            alert(errorData.error); // Show user-friendly message
            return false; // Prevent further execution
        }

        alert(`Room ${roomId} deleted successfully!`);

        // Close modal and refresh room list
        document.getElementById("deleteRoomModal").style.display = "none";
        fetchRooms();

        return true;
    } catch (error) {
        console.error("Error deleting room:", error);
        alert("An unexpected error occurred while deleting the room.");
        return false;
    }
}
// End of Delete Room Function