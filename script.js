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

    // get room view via apartment || see what rooms are available
    roomsBtn.addEventListener("click", async function () {
        const aptLocId = await getCurrentApartment();
        
        const response = await fetch(`/getFullRoomView/${aptLocId}`);
        const rooms = await response.json();
        populateRoomTable(rooms);
    });


    // Payment
    const paymentBtn = document.getElementById("paymentBtn");

    //Reports
    const reportBtn = document.getElementById("reportBtn");


    /* ---- OTHER FUNCTIONALITIES ---- */
    // Form Submissions
    const removeTenantForm = document.getElementById("removeTenantForm");
    removeTenantForm.addEventListener('submit', removeTenant);

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

    // For the view all rooms button in the room management
    const viewAllRooms = document.getElementById("viewRooms");
    viewAllRooms.addEventListener("click", async function() {
        fetchRooms();
        const response = await fetch(`/viewAll`);
        const rooms = await response.json();
        viewAllRooms(rooms);
    })  
});


// Remove a Tenant
async function removeTenant(event) {
    event.preventDefault();
    try {
        const personId = document.getElementById('personId').value;
        
        if (!personId) {
            alert("Please enter a valid Person ID!");
            return;
        }
  
        // Confirm removal
        const confirmRemoval = confirm("Are you sure you want to remove this tenant?");
        if (!confirmRemoval) {
            return;
        }
  
        // Send remove request to backend
        const response = await fetch(`/remove-tenant/${personId}`, {
            method: 'DELETE'
        });
  
        if (!response.ok) {
            throw new Error('Failed to remove tenant');
        }
  
        alert('Tenant removed successfully!');
        
        // Close modal and reset form
        closeModal('removeTenantModal');
        event.target.reset();
        
        // Refresh rooms to update the display
        fetchRooms();
    } catch (error) {
        console.error("Error removing tenant:", error);
        alert("Failed to remove tenant. " + error.message);
    }
  }
// End of Remove a Tenant Function

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
    const apartmentName = await getCurrentApartment();
    
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
}
// End of View All Rooms Function

// Update room dropdown based on selected apartment
async function updateRoomDropdown() {
    const roomDropdowns = document.querySelectorAll(".roomId"); // Select multiple elements
    if (roomDropdowns.length === 0) return;

    const aptLocId = await getCurrentApartment(); // Get the current apartment number
    if (!aptLocId) return; // Exit if no valid apartment ID

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


// Search Function
document.addEventListener('DOMContentLoaded', function() {
    const searchTenantBtn = document.getElementById("searchTenantBtn");
    const mainContentArea = document.getElementById("mainContentArea");
    const searchTenantFormContainer = document.getElementById("searchTenantFormContainer");
    const searchForm = document.getElementById("searchTenantForm");
    const resultsBody = document.getElementById("tenantResultsBody");
    
    // Search Tenant Button Click
    if (searchTenantBtn && mainContentArea && searchTenantFormContainer) {
      searchTenantBtn.addEventListener("click", function() {
        // Clear main content area
        mainContentArea.innerHTML = "";
        
        // Create the search results container if it doesn't exist yet
        if (!document.getElementById("searchResultsContainer")) {
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
                    <th>Room</th>
                    <th>Contact</th>
                    <th>Move-in Date</th>
                    <th>Contract End</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="tenantResultsBody">
                  <!-- Initially empty -->
                </tbody>
              </table>
            </div>
          `;
          
          // Append both form and results container
          searchTenantFormContainer.style.display = "block";
          searchTenantFormContainer.insertBefore(resultsContainer, searchTenantFormContainer.firstChild);
        }
        
        // Add to main content area
        mainContentArea.appendChild(searchTenantFormContainer);
      });
    }
    
    // Form submission
    if (searchForm) {
      searchForm.addEventListener("submit", function(e) {
        e.preventDefault();
        
        // Sample data - would come from your backend in a real app
        const sampleTenants = [
          {
            id: 'T001',
            name: 'John Doe',
            room: '101',
            contact: '555-1234',
            moveInDate: '2024-01-15',
            contractEnd: '2025-01-14',
            status: 'Active'
          },
          {
            id: 'T002',
            name: 'Jane Smith',
            room: '202',
            contact: '555-5678',
            moveInDate: '2023-11-01',
            contractEnd: '2024-10-31',
            status: 'Active'
          }
        ];
        
        // Get reference to results body again (might have been recreated)
        const resultsBody = document.getElementById("tenantResultsBody");
        if (resultsBody) {
          // Clear previous results
          resultsBody.innerHTML = '';
          
          // Populate table with results
          sampleTenants.forEach(tenant => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${tenant.id}</td>
              <td>${tenant.name}</td>
              <td>${tenant.room}</td>
              <td>${tenant.contact}</td>
              <td>${tenant.moveInDate}</td>
              <td>${tenant.contractEnd}</td>
              <td><span class="badge bg-success">${tenant.status}</span></td>
              <td>
                <button class="action-btn" title="View Details"><i class="bi bi-eye"></i></button>
                <button class="action-btn" title="Edit"><i class="bi bi-pencil"></i></button>
              </td>
            `;
            resultsBody.appendChild(row);
          });
        }
      });
    }
  });
// End of Search Function


// Check Rooms
async function fetchRooms() {
    try {
        const response = await fetch('/rooms');
        const rooms = await response.json();
  
        // Make sure at least one room exists
        if (rooms.length > 0) {
            document.getElementsByClassName('requests-bar')[0].value = 
                `Room ${rooms[0].Room_ID} - ₱${rooms[0].Room_Price.toLocaleString()}`;
        }
    } catch (error) {
        console.error("Error fetching rooms:", error);
    }
  }
