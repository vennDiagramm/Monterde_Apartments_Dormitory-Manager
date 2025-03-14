require('dotenv').config(); // Ensure dotenv is loaded first
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Database connection
const { error } = require('console');

const app = express();
const port = process.env.PORT || 3000; // Default to port 3000 if not set in .env

app.use(cors()); // Allows frontend to talk to backend
app.use(express.json()); // Enables JSON parsing
app.use(express.static('public')); // Serve static files from the public folder

// Serve home.html directly from the root (one level up from the 'server' folder)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'landing_page.html')); // Go up one level from 'server'
});

/**     -------     ROOMS API SECTION      -------     **/
// Get Room List
app.get('/rooms', async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM room");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

// Get all rooms with status description
app.get('/viewAll', async (req, res) => {
    try {
        const [rows] = await db.query('CALL GetAllRoomsWithStatus()');
        res.json(rows[0]); // Note: Results are in the first element of the returned array
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get all rooms with status description

// Get rooms by aptLocId
app.get("/getRooms/:aptLocId", async (req, res) => {
    const aptLocId = req.params.aptLocId;
    try {
        const [results] = await db.query('CALL GetRoomsByAptLocId(?)', [aptLocId]);
        res.json(results[0]); // Note: Results are in the first element of the returned array
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get rooms by aptLocId

// Para sa dropdown sa rooms regardless of status
app.get('/getAllRooms/:aptLocId', async (req, res) => {
    const aptLocId = req.params.aptLocId;
    try {
        const [results] = await db.query('CALL GetRoomIdsByAptLocId(?)', [aptLocId]);
        res.json(results[0]); // Note: Results are in the first element of the returned array
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Get Full View of Room via aptLocId
app.get("/getFullRoomView/:aptLocId", async (req, res) => {
    const aptLocId = req.params.aptLocId;
    try {
        const [results] = await db.query('CALL GetFullRoomViewByAptLocId(?)', [aptLocId]);
        res.json(results[0]); // Note: Results are in the first element of the returned array
    } catch (err) {
        console.error("Error fetching rooms:", err);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get Full View of Room via aptLocId

// Update room
app.post("/updateRoom", async (req, res) => {
    const { room_id, floor, tenants, max_renters, price, status } = req.body;
    try {
        const [result] = await db.query(
            'CALL UpdateRoom(?, ?, ?, ?, ?, ?)', 
            [room_id, floor, tenants, max_renters, price, status]
        );
        const affectedRows = result[0][0].affected_rows;
        if (affectedRows > 0) {
            res.json({ message: "Room updated successfully!" });
        } else {
            res.status(404).json({ message: "Room not found or no changes made" });
        }
    } catch (err) {
        console.error("Error updating room:", err);
        res.status(500).json({ error: "Database update failed" });
    }
});
// End of Update room

// Add room
app.post("/addRoom", async (req, res) => {
    const { floor, tenants, max_renters, status, price, apt_loc } = req.body;
    try {
        const [result] = await db.query(
            'CALL AddRoom(?, ?, ?, ?, ?, ?)',
            [floor, tenants, max_renters, status, price, apt_loc]
        );
        const newRoomId = result[0][0].new_room_id;
        res.json({ 
            message: "Room added successfully!", 
            roomId: newRoomId 
        });
    } catch (err) {
        res.status(500).json({ error: err.message || "Database error" });
    }
});
// End of Add room

// Delete Room
app.delete("/deleteRoom/:id", async (req, res) => {
    const roomId = req.params.id;
    try {
        // Set success and message variables
        await db.query("SET @success = FALSE;");
        await db.query("SET @message = '';");

        // Call the stored procedure
        await db.query("CALL DeleteRoom(?, @success, @message);", [roomId]);

        // Retrieve output values
        const [result] = await db.query("SELECT @success AS success, @message AS message;");
        const { success, message } = result[0];

        if (success) {
            res.json({ message });
        } else {
            res.status(404).json({ error: message });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred while deleting the room" });
    }
});
// End of Delete Room

// Update Room Status
app.get("/updateRoomStatus", async (req, res) => {
    try {
        const [result] = await db.query('CALL UpdateRoomOccupancyStatus()');
        const roomsUpdated = result[0][0]['Rooms Updated'];
        
        res.json({
            success: true,
            message: `${roomsUpdated} rooms had their status updated`,
            roomsUpdated: roomsUpdated
        });
    } catch (err) {
        console.error("Error updating room statuses:", err);
        res.status(500).json({ 
            success: false,
            error: "Failed to update room statuses",
            details: err.message 
        });
    }
});

/**     -------     END OF ROOMS API SECTION      -------     **/


/**     -------     TENANTS API SECTION      -------     **/
// Add Tenant Route
app.post('/add-person', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { 
            firstName, 
            middleName, 
            lastName, 
            contact, 
            dob, 
            sex,
            street,
            barangay,
            city,
            region,
            roomId,
            aptLocID // Apartment Location from the active slide
        } = req.body;

        // Check if person already exists
        const [existingPerson] = await connection.query(
            'SELECT Person_ID FROM person_information WHERE Person_FName = ? AND Person_LName = ? AND Person_Contact = ?',
            [firstName, lastName, contact]
        );

        if (existingPerson.length > 0) {
            await connection.rollback();
            return res.status(409).json({ 
                error: "Person already exists", 
                personId: existingPerson[0].Person_ID 
            });
        }

        // Insert person information
        const [personResult] = await connection.query(
            'INSERT INTO person_information (Person_FName, Person_MName, Person_LName, Person_Contact, Person_DOB, Person_sex) VALUES (?, ?, ?, ?, ?, ?)',
            [firstName, middleName || null, lastName, contact, dob, sex]
        );
        const personId = personResult.insertId;

        // Insert City
        const [cityResult] = await connection.query(
            'INSERT INTO city (City_Name, Region_Name) VALUES (?, ?)',
            [city, region]
        );
        const cityId = cityResult.insertId;

        // Insert Barangay
        const [barangayResult] = await connection.query(
            'INSERT INTO barangay (Brgy_Name, City_ID) VALUES (?, ?)',
            [barangay, cityId]
        );
        const barangayId = barangayResult.insertId;

        // Insert Address
        const [addressResult] = await connection.query(
            'INSERT INTO address (Person_Street, Brgy_ID) VALUES (?, ?)',
            [street, barangayId]
        );
        const addressId = addressResult.insertId;

        // Link Person to Address
        await connection.query(
            'INSERT INTO person_address (Person_ID, Address_ID) VALUES (?, ?)',
            [personId, addressId]
        );

        // Insert Occupant
        const [occupantResult] = await connection.query(
            'INSERT INTO occupants (Person_ID) VALUES (?)',
            [personId]
        );
        const occupantId = occupantResult.insertId;

        // Check room capacity
        const [roomCheck] = await connection.query(
            'SELECT Number_of_Renters, Room_maxRenters FROM room WHERE Room_ID = ?',
            [roomId]
        );

        if (roomCheck[0].Number_of_Renters >= roomCheck[0].Room_maxRenters) {
            await connection.rollback();
            return res.status(400).json({ error: "Room is at maximum capacity" });
        }

        // Update room occupancy
        await connection.query(
            'UPDATE room SET Number_of_Renters = Number_of_Renters + 1 WHERE Room_ID = ?',
            [roomId]
        );
        
        
        // Insert Contract into `contract` table
        const [contractResult] = await connection.query(
            `INSERT INTO contract (Person_ID, Apt_Loc_ID, Date) VALUES (?, ?, CURDATE())`,
            [personId, aptLocID]
        );
        const contractId = contractResult.insertId;

        // Insert Contract Details
        await connection.query(
            `INSERT INTO contract_details 
            (Contract_Details_ID, Room_ID, Occupants_ID, MoveIn_date, MoveOut_date, Actual_Move_In_Date, Room_Price, Down_Payment) 
            VALUES (?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), CURDATE(), 
            (SELECT Room_Price FROM room WHERE Room_ID = ?), 0)`,
            [contractId, roomId, occupantId, roomId]
        );

        await connection.commit();
        res.json({ personId, message: "Tenant and contract added successfully!" });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Failed to add person and contract details" });
    } finally {
        connection.release();
    }
});

// Remove Tenant Route
app.delete('/remove-tenant/:personId', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const personId = req.params.personId;

        // Remove person information directly
        const [result] = await connection.query(
            'DELETE FROM person_information WHERE Person_ID = ?',
            [personId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Tenant not found or cannot be deleted" });
        }

        await connection.commit();
        res.json({ message: "Tenant removed successfully" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Failed to remove tenant" });
    } finally {
        connection.release();
    }
});

// Edit Tenant Route
app.put('/edit-tenant/:personId', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const personIdEdit = req.params.personId;
        let {
            firstNameId,
            middleNameId,
            lastNameId,
            birthdayP,
            street,
            barangay,
            city,
            contact,
            moveIn,
            moveOut
        } = req.body; // Extracts data sent in the request body
        
        if (moveIn !== undefined) {
            moveIn = moveIn.split("T")[0];
        }
        
        if (moveOut !== undefined) {
            moveOut = moveOut.split("T")[0];
        }
    
        // Track if any updates were made
        let updatesPerformed = false;
        
        // Update Person_Information contact if provided
        if (contact !== undefined) {
            const [result] = await connection.execute(
                'UPDATE person_information SET person_Contact = ? WHERE person_ID = ?',
                [contact, personIdEdit]
            );

            if (result.affectedRows === 0) {
                throw new Error('Update failed: No rows were affected. Check if the person_ID exists.');
            }
        
            updatesPerformed = true;
        }
        

        // Update Person_Information First Name if provided
        if (firstNameId !== undefined) {
            const [result] = await connection.query(
            'UPDATE person_information SET person_FName = ? WHERE person_ID = ?',
            [firstNameId, personIdEdit]
            );
            
            if (result.affectedRows === 0) {
            throw new Error('No rows were updated when changing first name');
            }
            
            updatesPerformed = true;
        }
  
        // Update Person_Information Middle Name if provided
        if (middleNameId !== undefined) {
            const [result] = await connection.query(
            'UPDATE person_information SET person_MName = ? WHERE person_ID = ?',
            [middleNameId, personIdEdit]
            );
            
            if (result.affectedRows === 0) {
            throw new Error('No rows were updated when changing middle name');
            }
            
            updatesPerformed = true;
        }
        
        // Update Person_Information Last Name if provided
        if (lastNameId !== undefined) {
            const [result] = await connection.query(
            'UPDATE person_information SET person_LName = ? WHERE person_ID = ?',
            [lastNameId, personIdEdit]
            );
            
            if (result.affectedRows === 0) {
            throw new Error('No rows were updated when changing last name');
            }
            
            updatesPerformed = true;
        }

        // Update Person_Information Birthday if provided
        if (birthdayP !== undefined) {
            const [birthdayResult] = await connection.query(
                'UPDATE person_information SET person_DOB = ? WHERE person_ID = ?',
                [birthdayP, personIdEdit]
            );
            if (birthdayResult.affectedRows === 0) {
                throw new Error('No rows were updated when changing birthday');
            }
            updatesPerformed = true;
        }

        // Address updates - only proceed if any address field is provided
        if (street !== undefined || barangay !== undefined || city !== undefined) {
            // Get Address_ID associated with the Person
            const [addressResult] = await connection.execute(
                `SELECT address_ID FROM person_address WHERE person_ID = ?`, 
                [personIdEdit]
            );
            console.log("This IS THE address result:", addressResult[0]);
            if (addressResult.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: "Address not found for this person." });
            }

            const addressId = addressResult[0].address_ID;
            console.log("This IS THE ADDRESS:", addressId);
            console.log("THIS IS THE STREET:", street);
            
            // Update Street if provided
            if (street !== undefined) {
                const [streetResult] = await connection.execute(
                    `UPDATE address SET Person_Street = ? WHERE address_ID = ?`, 
                    [street, addressId]
                );
                if (streetResult.affectedRows === 0) {
                    throw new Error('No rows were updated when changing street');
                }
                updatesPerformed = true;
            }
            
            // Only proceed with barangay update if provided
            if (barangay !== undefined) {
                const [brgyResult] = await connection.execute(
                    `SELECT brgy_ID FROM address WHERE address_id = ?`, 
                    [addressId]
                );

                if (brgyResult.length === 0) {
                    await connection.rollback();
                    return res.status(404).json({ message: "Barangay not found for this address." });
                }

                const barangayId = brgyResult[0].brgy_ID;
                
                // Update Barangay Name
                const [brgyUpdateResult] = await connection.execute(
                    `UPDATE barangay SET brgy_Name = ? WHERE brgy_ID = ?`,
                    [barangay, barangayId]
                );
                if (brgyUpdateResult.affectedRows === 0) {
                    throw new Error('No rows were updated when changing barangay');
                }
                updatesPerformed = true;
            }

            // Only proceed with city update if provided
            if (city !== undefined) {
                // First get the barangay ID if we haven't already
                let barangayId;
                console.log("THIS IS THE ADDRESS ID BARANGAY STUFF", addressId);
                if (barangay !== undefined) {
                    const [brgyResult] = await connection.execute(
                        `SELECT brgy_ID FROM address WHERE address_id = ?`, 
                        [addressId]
                    );
                    
                    if (brgyResult.length === 0) {
                        await connection.rollback();
                        return res.status(404).json({ message: "Barangay not found for this address." });
                    }
                    console.log("THIS IS THE BARANGAY RESULT", brgyResult[0]);
                    barangayId = brgyResult[0].brgy_ID;
                }
                
                console.log("THIS IS THE BARANGAY", barangayId);
                const [cityResult] = await connection.execute(
                    `SELECT city_ID FROM barangay WHERE brgy_ID = ?`, 
                    [barangayId]
                );

                if (cityResult.length === 0) {
                    await connection.rollback();
                    return res.status(404).json({ message: "City not found for this barangay." });
                }

                const cityId = cityResult[0].city_ID;

                // Update City Name
                const [cityUpdateResult] = await connection.execute(
                    `UPDATE city SET city_Name = ? WHERE city_ID = ?`,
                    [city, cityId]
                );
                if (cityUpdateResult.affectedRows === 0) {
                    throw new Error('No rows were updated when changing city');
                }
                updatesPerformed = true;
            }
        }

        // Contract details updates - only proceed if moveIn or moveOut is provided
        if (moveIn !== undefined || moveOut !== undefined) {
            // Retrieve the correct Contract_ID for this Person_ID
            const [contractResult] = await connection.query(
                'SELECT cd.Contract_Details_ID FROM contract_details cd join contract c on cd.contract_details_id = c.contract_id join person_information p on c.person_id = p.person_id WHERE p.person_id = ?',
                [personIdEdit]
            );

            if (contractResult.length === 0) {
                await connection.rollback();
                return res.status(404).json({ error: "Contract not found for this tenant." });
            }

            const contractId = contractResult[0].Contract_Details_ID;
            
            // Build the update query dynamically based on provided values
            let updateFields = [];
            let updateValues = [];
            
            if (moveIn !== undefined) {
                updateFields.push('Actual_Move_In_date = ?');
                updateValues.push(moveIn);
            }
            
            if (moveOut !== undefined) {
                updateFields.push('MoveOut_date = ?');
                updateValues.push(moveOut);
            }
            
            if (updateFields.length > 0) {
                // Add contractId to the values array
                updateValues.push(contractId);
                
                // Construct and execute the update query
                const updateQuery = `UPDATE contract_details SET ${updateFields.join(', ')} WHERE Contract_Details_ID = ?`;
                const [contractUpdateResult] = await connection.query(updateQuery, updateValues);
                if (contractUpdateResult.affectedRows === 0) {
                    throw new Error('No rows were updated when changing contract details');
                }
                updatesPerformed = true;
            }
        }

        // Check if any updates were performed
        if (!updatesPerformed) {
            await connection.rollback();
            return res.status(200).json({ message: "No changes were made - all fields were undefined." });
        }

        await connection.commit();
        res.json({ message: "Tenant updated successfully." });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Failed to update tenant: " + error.message });
    } finally {
        connection.release();
    }
});

// Show Edit Tenant Name
app.get('/get-person-name/:personId', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const personId = req.params.personId;
        console.log(`SERVER PERSON ID: ${personId}`);
        const [result] = await connection.query(
            "SELECT CONCAT(Person_FName, ' ', Person_MName, ' ', Person_LName) AS name FROM person_information WHERE Person_ID = ?",
            [personId]
        );

        if (result.length > 0) {
            res.json({ name: result[0].name });
        } else {
            res.status(404).json({ error: "Person not found" });
        }

    } catch (error) {
        console.error("Error fetching tenant name:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        connection.release();
    }
});
// End of Show Edit Tenant Name

//Payment route
// Fetch Rent Price for Payment Process
app.get('/get-room-price/:roomId', async (req, res) => {
    const roomId = req.params.roomId; // Corrected parameter

    if (isNaN(roomId)) {
        return res.status(400).json({ error: "Please enter a valid Room Number" });
    }    

    try {
        const query = `
            SELECT Room_Price 
            FROM room
            WHERE Room_ID = ?;
        `;

        const [rows] = await db.execute(query, [roomId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'No room found with this Room ID' });
        }

        const rentPrice = rows[0]?.Room_Price || 0;
        res.json({ rent_price: rentPrice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Payment Process
app.post("/process-payment", async (req, res) => {
    
    const { personId, roomId, amountPaid, remarks } = req.body;
    
    if (!personId || !roomId || !amountPaid) {
        return res.status(400).json({ error: "Missing required fields: personId, roomId, or amountPaid" });
    }

    // If remarks is empty or undefined, set it to NULL
    const remarksValue = remarks && remarks.trim() !== "" ? remarks : null;

    try {
        // Step 1: Get the latest Contract_Bill_ID
        const [results] = await db.query(
            `SELECT contract_Bill_ID, contract_date FROM contract_bill ORDER BY contract_date DESC LIMIT 1`
        );

        if (results.length === 0) {
            return res.status(404).json({ error: "No Contract_Bill_ID found" });
        }

        const contractBillId = results[0].contract_Bill_ID;
        const contractDate = results[0].contract_date;

        console.log("THE LATEST CONTRACT BILL", contractBillId);
        console.log("THE LATEST CONTRACT DATE", contractDate);
        // Step 2: Insert the Payment
        await db.query(
            `INSERT INTO payment (Contract_Bill_ID, Date, Amount, Remarks)
            VALUES (?, CURDATE(), ?, ?)`,
            [contractBillId, amountPaid, remarksValue]
        );

        console.log("WILL THIS WORK");
        res.json({ success: true, message: "Payment recorded successfully" });

    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
    }
});
//End of payment

//Calculate Electricbill
app.get('/calculate-electric-bill', async (req, res) => {
    const { prev_meter, current_meter, num_renters } = req.query;

    if (!prev_meter || !current_meter || !num_renters) {
        return res.status(400).json({ error: "prev_meter, current_meter, and num_renters are required." });
    }

    try {
        const query = "SELECT calculateElectricBill(?, ?, ?) AS total_bill";
        const [rows] = await db.execute(query, [prev_meter, current_meter, num_renters]);

        if (!rows.length || !rows[0].total_bill) {
            return res.status(404).json({ error: "Failed to calculate electric bill." });
        }

        res.json({ total_bill: rows[0].total_bill });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Server error while calculating electric bill." });
    }
});

//Fetch other Charges 
app.get("/get-other-charges", async (req, res) => {
    const { roomId, personId } = req.query;

    if (!roomId || !personId) {
        return res.status(400).json({ error: "Missing roomId or occupantId" });
    }

    try {
        const query = `
            SELECT oc.OC_total 
            FROM other_charges oc
            JOIN contract_bill cb ON oc.Contract_Bill_ID = cb.Contract_Bill_ID
            JOIN contract_details cd ON cb.Contract_Details_ID = cd.Contract_Details_ID
            WHERE cd.Room_ID = ? AND cd.Occupants_ID = ?;
        `;

        const [rows] = await db.execute(query, [roomId, personId]);

        // If no record exists, return OC_total as 0 instead of an error
        const ocTotal = rows.length > 0 ? rows[0].OC_total : 0;

        res.json({ OC_total: ocTotal }); 
    } catch (error) {
        console.error("Error fetching miscellaneous charges:", error);
        res.status(500).json({ error: "Server error while retrieving miscellaneous charges." });
    }
});

// get contract_details_ID using person_ID
app.get('/getCDID/:pId', async (req, res) => {
    const pId = req.params.pId;
    try {
        const [result] = await db.query(
            'SELECT Contract_ID AS contract_details_ID FROM contract WHERE Person_ID = (?)', [pId]
        );
        if (result.length === 0) {
            return res.status(404).json({ error: "Contract details not found for the given person_ID" });
        }
        res.json(result[0].contract_details_ID);
    } catch (err) {
        console.error("Fail to get contract_details_ID: ", err); // Detailed error log
        res.status(500).json({ error: "Database error", details: err.message });
    }
});

// ga create ug bill + details
app.post("/createBillWithDetails", async (req, res) => {
    const { 
        Contract_Details_ID,
        total_bill,
        Balance,
        // These are for contract_bill_details
        Bill_meterEndMonth,
        Bill_meterStartMonth,
        meter_total,
        Utility_Computation
    } = req.body;
    
    try {
        // First, create the contract bill
        const [billResult] = await db.query(
            'CALL CreateContractBill(?, NULL, NULL, ?, ?, @new_id)',
            [Contract_Details_ID, Balance, total_bill]
        );

        const newBillId = billResult[0][0].new_bill_id;
        
        // Now create the contract bill details using the new bill ID
        await db.query(
            'INSERT INTO contract_bill_details (Contract_Bill_ID, Bill_meterEndMonth, Bill_meterStartMonth, meter_total, Utility_Computation) VALUES (?, ?, ?, ?, ?)',
            [newBillId, Bill_meterEndMonth, Bill_meterStartMonth, meter_total, Utility_Computation]
        );
        
        res.status(200).json({ 
            message: "Contract Bill Created Successfully with Details!", 
            Contract_Bill_ID: newBillId 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            message: "Error creating contract bill with details", 
            error: error.message 
        });
    }
});



// Fetch Room Max Renters
app.get('/get-number-of-renters', async (req, res) => {
    const { roomId } = req.query;
    console.log("IS THIS ACTUALLY EVEN ENTERING?", roomId);
    if (isNaN(roomId)) {
        return res.status(400).json({ error: "Invalid Room ID" });
    }

    try {
        const query = `SELECT Number_of_Renters FROM room WHERE Room_ID = ?`;
        const [rows] = await db.execute(query, [roomId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "No max renters found for this room ID" });
        }

        console.log("ROOM ROWS", rows[0])
        res.json({ numRenters: rows[0].Number_of_Renters });
    } catch (error) {
        console.error("Error fetching max renters:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Dismiss tenant table
app.get('/getTenantInfo/:aptLocId', async (req, res) => {
    try {
        const aptLocId = req.params.aptLocId || null;
        const [rows] = await db.query('CALL GetTenantInformation(?)', [aptLocId]);
        res.json(rows[0]); // Note: Results are in the first element of the returned array
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});
// End of Get tenant information

/**     -------     END OF TENANTS API SECTION      -------     **/

let currentApartment = ""; // Store globally

app.post("/set-current-apartment", (req, res) => {
    currentApartment = req.body.apartment;
    console.log("Updated Current Apartment:", currentApartment);
    res.json({ message: "Current apartment stored." });
});

// Function to get the stored apartment
function getCurrentApartmentFromServer() {
    switch (currentApartment) {
        case "MATINA":
            return "Matina Crossing";
        case "SESAME":
            return "Sesame Street";
        case "NABUA":
            return "Nabua Street";
        default:
            return "Sesame Street";
    }
}

// Search Function
app.get('/search-tenant/:userInput', async (req, res) => {
    const connection = await db.getConnection();

    try {
        let userInput = req.params.userInput;
        let searchInput = userInput.trim(); // Remove extra spaces
        let nameParts = searchInput.split(/\s+/); // Split input by spaces
        let apartment = getCurrentApartmentFromServer() // Extract first word
        
        console.log(apartment);
        console.log("Apartment (First Word):", apartment);
        console.log("User Input:", userInput);
        console.log("Name Parts:", nameParts);
    
        // Remove period if middle initial is detected
        for (let i = 0; i < nameParts.length; i++) {
            nameParts[i] = nameParts[i].replace(/\.$/, ''); // Remove period at the end
        }
        
        let query = "";
        let params = [];
    
        if (searchInput.toLowerCase() === "all") {
            query = `
                SELECT 
                    pi.Person_ID, 
                    CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                    pi.Person_Contact,
                    pi.Person_DOB, 
                    ps.sex_title AS Person_sex,
                    COALESCE(MIN(a.Person_Street), 'Unknown') AS Person_Street,  
                    COALESCE(MIN(b.Brgy_Name), 'Unknown') AS Brgy_Name, 
                    COALESCE(MIN(c.City_Name), 'Unknown') AS City_Name, 
                    COALESCE(MIN(c.Region_Name), 'Unknown') AS Region_Name, 
                    COALESCE(MIN(r.room_id), 'No Room') AS room_id,  
                    al.apt_location,
                    COALESCE(MIN(DATE(cd.actual_move_in_date)), '0000-00-00') AS actual_move_in_date,
                    COALESCE(MIN(DATE(cd.moveout_date)), '0000-00-00') AS actual_move_out_date 
                FROM person_information pi
                LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                LEFT JOIN city c ON b.City_ID = c.City_ID
                LEFT JOIN contract ct ON pi.Person_ID = ct.Person_ID
                LEFT JOIN apartment_location al ON ct.apt_loc_id = al.apt_loc_id
                LEFT JOIN room r ON al.apt_loc_id = r.apt_loc_id
                LEFT JOIN contract_details cd ON ct.contract_id = cd.contract_details_id
                WHERE al.apt_location = ?
                GROUP BY pi.Person_ID
            `;
                params = [apartment];
        } else if (!isNaN(searchInput)) {
            // If input is a number, search by Person_ID
            query = `
                SELECT 
                    pi.Person_ID, 
                    CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                    pi.Person_Contact,
                    pi.Person_DOB,
                    ps.sex_title AS Person_sex,
                    COALESCE(MIN(a.Person_Street), 'Unknown') AS Person_Street,  
                    COALESCE(MIN(b.Brgy_Name), 'Unknown') AS Brgy_Name, 
                    COALESCE(MIN(c.City_Name), 'Unknown') AS City_Name, 
                    COALESCE(MIN(c.Region_Name), 'Unknown') AS Region_Name, 
                    COALESCE(MIN(r.room_id), 'No Room') AS room_id,  
                    MIN(al.apt_location) AS apt_location,  
                    COALESCE(MIN(DATE(cd.actual_move_in_date)), '0000-00-00') AS actual_move_in_date,
                    COALESCE(MIN(DATE(cd.moveout_date)), '0000-00-00') AS actual_move_out_date
                FROM person_information pi
                LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                LEFT JOIN city c ON b.City_ID = c.City_ID
                LEFT JOIN contract ct ON pi.Person_ID = ct.Person_ID
                LEFT JOIN apartment_location al ON ct.apt_loc_id = al.apt_loc_id
                LEFT JOIN room r ON al.apt_loc_id = r.apt_loc_id
                LEFT JOIN contract_details cd ON ct.contract_id = cd.contract_details_id
                WHERE pi.Person_ID = ? AND al.apt_location = ?
                GROUP BY pi.Person_ID, al.apt_location
            `;
            params = [parseInt(searchInput), apartment];
        } else {
            if (nameParts.length === 1) {
                // Search by First Name OR Last Name (Handles single-name searches)
                query = `
                    SELECT 
                        pi.Person_ID, 
                        CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                        pi.Person_Contact,
                        pi.Person_DOB, 
                        ps.sex_title AS Person_sex,
                        COALESCE(MIN(a.Person_Street), 'Unknown') AS Person_Street,  
                        COALESCE(MIN(b.Brgy_Name), 'Unknown') AS Brgy_Name, 
                        COALESCE(MIN(c.City_Name), 'Unknown') AS City_Name, 
                        COALESCE(MIN(c.Region_Name), 'Unknown') AS Region_Name, 
                        COALESCE(MIN(r.room_id), 'No Room') AS room_id,  
                        MIN(al.apt_location) AS apt_location,  
                        COALESCE(MIN(DATE(cd.actual_move_in_date)), '0000-00-00') AS actual_move_in_date,
                        COALESCE(MIN(DATE(cd.moveout_date)), '0000-00-00') AS actual_move_out_date
                    FROM person_information pi
                    LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                    LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                    LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                    LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                    LEFT JOIN city c ON b.City_ID = c.City_ID
                    LEFT JOIN contract ct ON pi.Person_ID = ct.Person_ID
                    LEFT JOIN apartment_location al ON ct.apt_loc_id = al.apt_loc_id
                    LEFT JOIN room r ON al.apt_loc_id = r.apt_loc_id
                    LEFT JOIN contract_details cd ON ct.contract_id = cd.contract_details_id
                    WHERE pi.Person_FName LIKE ? OR pi.Person_LName LIKE ?
                    AND al.apt_location = ?
                    GROUP BY pi.Person_ID, al.apt_location
                `;
                params = [`%${nameParts[0]}%`, `%${nameParts[0]}%`, apartment];
            } else if (nameParts.length === 2) {
                // Check if input format is First Last or Last First
                query = `
                    SELECT 
                        pi.Person_ID, 
                        CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                        pi.Person_Contact,
                        pi.Person_DOB,
                        ps.sex_title AS Person_sex,
                        COALESCE(MIN(a.Person_Street), 'Unknown') AS Person_Street,  
                        COALESCE(MIN(b.Brgy_Name), 'Unknown') AS Brgy_Name, 
                        COALESCE(MIN(c.City_Name), 'Unknown') AS City_Name, 
                        COALESCE(MIN(c.Region_Name), 'Unknown') AS Region_Name, 
                        COALESCE(MIN(r.room_id), 'No Room') AS room_id,  
                        MIN(al.apt_location) AS apt_location,  
                        COALESCE(MIN(DATE(cd.actual_move_in_date)), '0000-00-00') AS actual_move_in_date,
                        COALESCE(MIN(DATE(cd.moveout_date)), '0000-00-00') AS actual_move_out_date
                    FROM person_information pi
                    LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                    LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                    LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                    LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                    LEFT JOIN city c ON b.City_ID = c.City_ID
                    LEFT JOIN contract ct ON pi.Person_ID = ct.Person_ID
                    LEFT JOIN apartment_location al ON ct.apt_loc_id = al.apt_loc_id
                    LEFT JOIN room r ON al.apt_loc_id = r.apt_loc_id
                    LEFT JOIN contract_details cd ON ct.contract_id = cd.contract_details_id
                    WHERE (pi.Person_FName LIKE ? AND pi.Person_LName LIKE ?)
                       OR (pi.Person_LName LIKE ? AND pi.Person_FName LIKE ?)
                       AND al.apt_location = ?
                    GROUP BY pi.Person_ID, al.apt_location
                    `;
                params = [`%${nameParts[0]}%`, `%${nameParts[1]}%`, `%${nameParts[0]}%`, `%${nameParts[1]}%`, apartment];
            } else if (nameParts.length === 3) {
                const isMiddleInitial = nameParts[1].length === 1;
    
                if (isMiddleInitial) {
                    query = `
                        SELECT 
                            pi.Person_ID, 
                            CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                            pi.Person_Contact,
                            pi.Person_DOB,
                            ps.sex_title AS Person_sex,
                            COALESCE(MIN(a.Person_Street), 'Unknown') AS Person_Street,  
                            COALESCE(MIN(b.Brgy_Name), 'Unknown') AS Brgy_Name, 
                            COALESCE(MIN(c.City_Name), 'Unknown') AS City_Name, 
                            COALESCE(MIN(c.Region_Name), 'Unknown') AS Region_Name, 
                            COALESCE(MIN(r.room_id), 'No Room') AS room_id,  
                            MIN(al.apt_location) AS apt_location, 
                            COALESCE(MIN(DATE(cd.actual_move_in_date)), '0000-00-00') AS actual_move_in_date,
                            COALESCE(MIN(DATE(cd.moveout_date)), '0000-00-00') AS actual_move_out_date
                        FROM person_information pi
                        LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                        LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                        LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                        LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                        LEFT JOIN city c ON b.City_ID = c.City_ID
                        LEFT JOIN contract ct ON pi.Person_ID = ct.Person_ID
                        LEFT JOIN apartment_location al ON ct.apt_loc_id = al.apt_loc_id
                        LEFT JOIN room r ON al.apt_loc_id = r.apt_loc_id
                        LEFT JOIN contract_details cd ON ct.contract_id = cd.contract_details_id
                        WHERE (pi.Person_FName LIKE ? AND pi.Person_MName LIKE ? AND pi.Person_LName LIKE ?)
                           OR (pi.Person_LName LIKE ? AND pi.Person_FName LIKE ? AND pi.Person_MName LIKE ?)
                           AND al.apt_location = ?
                        GROUP BY pi.Person_ID, al.apt_location
                        `;
                    params = [`%${nameParts[0]}%`, `%${nameParts[1]}%`, `%${nameParts[2]}%`, `%${nameParts[0]}%`, `%${nameParts[2]}%`, `%${nameParts[1]}%`, apartment];
                } else {
                    query = `
                        SELECT 
                            pi.Person_ID, 
                            CONCAT(pi.Person_FName, ' ', COALESCE(pi.Person_MName, ''), ' ', pi.Person_LName) AS FullName, 
                            pi.Person_Contact,
                            pi.Person_DOB,
                            ps.sex_title AS Person_sex,
                            COALESCE(MIN(a.Person_Street), 'Unknown') AS Person_Street,  
                            COALESCE(MIN(b.Brgy_Name), 'Unknown') AS Brgy_Name, 
                            COALESCE(MIN(c.City_Name), 'Unknown') AS City_Name, 
                            COALESCE(MIN(c.Region_Name), 'Unknown') AS Region_Name, 
                            COALESCE(MIN(r.room_id), 'No Room') AS room_id,  
                            MIN(al.apt_location) AS apt_location, 
                            COALESCE(MIN(DATE(cd.actual_move_in_date)), '0000-00-00') AS actual_move_in_date,
                            COALESCE(MIN(DATE(cd.moveout_date)), '0000-00-00') AS actual_move_out_date
                        FROM person_information pi
                        LEFT JOIN person_sex ps ON pi.Person_sex = ps.sex_id
                        LEFT JOIN person_address pa ON pi.Person_ID = pa.Person_ID
                        LEFT JOIN address a ON pa.Address_ID = a.Address_ID
                        LEFT JOIN barangay b ON a.Brgy_ID = b.Brgy_ID
                        LEFT JOIN city c ON b.City_ID = c.City_ID
                        LEFT JOIN contract ct ON pi.Person_ID = ct.Person_ID
                        LEFT JOIN apartment_location al ON ct.apt_loc_id = al.apt_loc_id
                        LEFT JOIN room r ON al.apt_loc_id = r.apt_loc_id
                        LEFT JOIN contract_details cd ON ct.contract_id = cd.contract_details_id
                        WHERE pi.Person_FName LIKE ? AND pi.Person_MName LIKE ? AND pi.Person_LName LIKE ?
                        AND al.apt_location = ?
                        GROUP BY pi.Person_ID, al.apt_location
                        `;
                    params = [`%${nameParts[0]}%`, `%${nameParts[1]}%`, `%${nameParts[2]}%`, apartment];
                }
            }
        }
        userInput = "";
        searchInput = ""; // Remove extra spaces
        nameParts = ""; // Split input by spaces
        apartment = "" // Extract first word

        const [rows] = await connection.query(query, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No matching person found" });
        }
        console.log("ARE THERE TENANTS FOUND")
        res.json(rows);
    } catch (error) {
        console.error(`Error searching tenant for input:`, error);
        res.status(500).json({ error: "Failed to search tenant" });
    } finally {
        connection.release();
    }    
});

// Reports
// Tenant Report
app.get('/getAllContracts', async (req, res) => {
    try {
        const [results] = await db.query('CALL GetAllContracts(NULL)');
        res.json(results[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

// Room Report
app.get('/getRoomsReport', async (req, res) => {
    try {
        const [results] = await db.query('CALL GetRoomsWithOccupancyStatus()');
        res.json(results[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});

// Chart for revenue
app.get('/monthly-revenue/:year', async (req, res) => {
    try {
        const year = req.query.year || new Date().getFullYear();
        const [results] = await db.query('CALL GetMonthlyRoomRevenue(?)', [year]);
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        res.status(500).json({ error: 'Failed to fetch monthly revenue data' });
    }
});

// chart for tenant age distribution
app.get('/age-distribution', async (req, res) => {
    try {
        const [results] = await db.query('CALL GetTenantAgeDistribution()');
        res.json(results[0]);
    } catch (error) {
        console.error('Error fetching age distribution:', error);
        res.status(500).json({ error: 'Failed to fetch age distribution data' });
    }
});

// 🔹 Start the Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


// Add these routes to your server.js file

// Get all active rooms
app.get('/get-active-rooms', async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const [rows] = await connection.execute(
            'SELECT room_id FROM room WHERE room_status_id = 2'
        );
        
        res.json(rows);
    } catch (error) {
        console.error('Error fetching active rooms:', error);
        res.status(500).json({ error: "Failed to fetch active rooms" });
    } finally {
        connection.release();
    }
});

// // Get meter readings for a specific room
// app.get('/get-meter-readings/:roomId', async (req, res) => {
//     const connection = await db.getConnection();
//     const roomId = req.params.roomId;
    
//     try {
//         // Get the previous month's end reading as this month's start reading
//         const [previousReading] = await connection.execute(
//             'SELECT end_meter FROM utility_readings WHERE room_id = ? ORDER BY reading_date DESC LIMIT 1',
//             [roomId]
//         );
        
//         let startMeter = 0;
//         if (previousReading.length > 0) {
//             startMeter = previousReading[0].end_meter;
//         }
        
//         // Get current meter reading
//         const [currentReading] = await connection.execute(
//             'SELECT meter_reading AS end_meter FROM room WHERE room_id = ?',
//             [roomId]
//         );
        
//         let endMeter = 0;
//         if (currentReading.length > 0) {
//             endMeter = currentReading[0].end_meter;
//         }
        
//         res.json({
//             start_meter: startMeter,
//             end_meter: endMeter
//         });
        
//         // Store this reading for next month's calculation
//         const today = new Date().toISOString().split('T')[0];
//         await connection.execute(
//             'INSERT INTO utility_readings (room_id, start_meter, end_meter, reading_date) VALUES (?, ?, ?, ?)',
//             [roomId, startMeter, endMeter, today]
//         );
        
//     } catch (error) {
//         console.error(`Error fetching meter readings for room ${roomId}:`, error);
//         res.status(500).json({ error: "Failed to fetch meter readings" });
//     } finally {
//         connection.release();
//     }
// });

// // Get water bill rate
// app.get('/get-water-bill', async (req, res) => {
//     const connection = await db.getConnection();
    
//     try {
//         const [rows] = await connection.execute(
//             'SELECT rate AS water_bill FROM utility_rates WHERE utility_type = "water" ORDER BY effective_date DESC LIMIT 1'
//         );
        
//         if (rows.length === 0) {
//             return res.status(404).json({ error: "Water bill rate not found" });
//         }
        
//         res.json({ water_bill: rows[0].water_bill });
//     } catch (error) {
//         console.error('Error fetching water bill rate:', error);
//         res.status(500).json({ error: "Failed to fetch water bill rate" });
//     } finally {
//         connection.release();
//     }
// });

// // Get tenants by room ID
// app.get('/get-tenants-by-room/:roomId', async (req, res) => {
//     const connection = await db.getConnection();
//     const roomId = req.params.roomId;
    
//     try {
//         const [rows] = await connection.execute(
//             `SELECT p.person_id, p.person_FName, p.person_LName 
//              FROM person_information p
//              JOIN contract c ON p.person_id = c.person_id
//              JOIN contract_details cd ON c.contract_id = cd.contract_details_id
//              WHERE cd.room_id = ?`,
//             [roomId]
//         );
        
//         res.json(rows);
//     } catch (error) {
//         console.error(`Error fetching tenants for room ${roomId}:`, error);
//         res.status(500).json({ error: "Failed to fetch tenants" });
//     } finally {
//         connection.release();
//     }
// });

// Get contract details ID for a tenant
app.post('/get-contract-details/:personId', async (req, res) => {
    const connection = await db.getConnection();
    const personId = req.params.personId;
    
    try {
        const [rows] = await connection.execute(
            `SELECT cd.Contract_Details_ID 
             FROM contract_details cd 
             JOIN contract c ON cd.contract_details_id = c.contract_id 
             JOIN person_information p ON c.person_id = p.person_id 
             WHERE p.person_id = ?`,
            [personId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: "Contract details not found" });
        }
        
        res.json({ contractDetailsId: rows[0].Contract_Details_ID });
    } catch (error) {
        console.error(`Error fetching contract details for person ${personId}:`, error);
        res.status(500).json({ error: "Failed to fetch contract details" });
    } finally {
        connection.release();
    }
});

// Get contract bill ID for a contract
app.post('/get-contract-bill/:contractDetailsId', async (req, res) => {
    const connection = await db.getConnection();
    const contractDetailsId = req.params.contractDetailsId;
    
    try {
        const [rows] = await connection.execute(
            `SELECT contract_bill_id 
             FROM contract_bill 
             WHERE contract_details_id = ?`,
            [contractDetailsId]
        );
        
        if (rows.length === 0) {
            // If no bill exists yet, create one
            const [insertResult] = await connection.execute(
                `INSERT INTO contract_bill (contract_details_id, balance, billing_date) 
                 VALUES (?, 0, CURDATE())`,
                [contractDetailsId]
            );
            
            return res.json({ contractBillId: insertResult.insertId });
        }
        
        res.json({ contractBillId: rows[0].contract_bill_id });
    } catch (error) {
        console.error(`Error fetching contract bill for contract ${contractDetailsId}:`, error);
        res.status(500).json({ error: "Failed to fetch contract bill" });
    } finally {
        connection.release();
    }
});

// Update contract bill
app.put('/update-contract-bill/:contractBillId', async (req, res) => {
    const connection = await db.getConnection();
    const contractBillId = req.params.contractBillId;
    const { balance, billingDate } = req.body;
    
    try {
        await connection.execute(
            `UPDATE contract_bill 
             SET balance = ?, billing_date = ? 
             WHERE contract_bill_id = ?`,
            [balance, billingDate, contractBillId]
        );
        
        res.json({ message: "Contract bill updated successfully" });
    } catch (error) {
        console.error(`Error updating contract bill ${contractBillId}:`, error);
        res.status(500).json({ error: "Failed to update contract bill" });
    } finally {
        connection.release();
    }
});