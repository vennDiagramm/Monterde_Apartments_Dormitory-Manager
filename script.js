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


    const addRoomForm = document.getElementById('addRoomForm');
    addRoomForm.addEventListener('submit', addRoom);
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
          <h4 class="text-white mb-3">Tenant Information</h4>
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
        searchTenantFormContainer.appendChild(resultsContainer);
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