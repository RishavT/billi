var USER_DETAILS = {};

// Bill Cache
var ALL_BILLS_CACHE = {}

function saveToLocalStorage() {
    localStorage.setItem("ALL_BILLS_CACHE", JSON.stringify(ALL_BILLS_CACHE));
    localStorage.setItem("USER_DETAILS", JSON.stringify(USER_DETAILS));
}

function loadFromLocalStorage() {
    USER_DETAILS = JSON.parse(localStorage.getItem("USER_DETAILS"));
    ALL_BILLS_CACHE = JSON.parse(localStorage.getItem("ALL_BILLS_CACHE"));
    if (!USER_DETAILS) USER_DETAILS = {};
    if (!ALL_BILLS_CACHE) ALL_BILLS_CACHE = {};
}

function getBillFromCache(key) {
    // Returns a bill from ALL_BILLS_CACHE by Key
    return ALL_BILLS_CACHE[key];
}

function addOrUpdateBillInBillCache(key, value) {
    // Adds or updates a bill in the global Bills object

    value.key = key;
    value.date = moment(JSON.parse(value.date));
	if (value.date) {
	    value.dateVisible = value.date.format("YYYY/MM/DD");
	} else value.dateVisible = "";
    ALL_BILLS_CACHE[key] = value;
    saveToLocalStorage();
}

function deleteBillFromCache(key) {
    // deletes a bill from the cache

    ALL_BILLS_CACHE[key] = undefined;
    saveToLocalStorage();
}

function resetBillCache() {
    // Resets the ALL_BILLS_CACHE object
    Object.keys(ALL_BILLS_CACHE).forEach(key => {
        delete ALL_BILLS_CACHE[key];
    });
    saveToLocalStorage();
}


// End of Bill Cache

function init() {
    // Initialize Firebase
    // TODO: Replace with your project's customized code snippet
    var config = {
        apiKey: "AIzaSyDWjGMpAlX-AeilN49kzM0FVbHC-zXCvmY",
        authDomain: "billytheproject.firebaseapp.com",
        databaseURL: "https://billytheproject.firebaseio.com",
        projectId: "billytheproject",
        storageBucket: "billytheproject.appspot.com",
    };
    firebase.initializeApp(config);
}

function signIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider);
}

function signInIfRequired(callback) {
    loadFromLocalStorage();
    if (USER_DETAILS && USER_DETAILS.email) return callback();
    firebase.auth().getRedirectResult().then(function(result) {
        if (result.user) {
            USER_DETAILS = {
                email: result.user.email,
                result: result
            };
            saveToLocalStorage();
        } else signIn();
        if (callback) {
            callback();
        }
    }).catch(function(error) {
        signIn();
    });
}

function getBills(callback = null, error_callback = null) {
    // Fetches all the bills from the database and stores it in the global variable.
    // Also runs callback with the same.
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }
    firebase.database().ref('/bills').once('value').then(function(snapshot) {
        resetBillCache();
        if (!snapshot) { callback(); return; }
        snapshot.forEach(obj => {
            addOrUpdateBillInBillCache(obj.key, obj.val());
        })
        callback(snapshot);
    }).catch(error_callback);
}

function uploadImage(filename, file, callback = null, error_callback = null) {
    // Uploads an image with the name filename and runs the callback with the downloadable URL
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }
    var newRef = firebase.storage().ref().child(filename);
    newRef.put(file).then(snapshot => {
        snapshot.ref.getDownloadURL().then(callback);
    }).catch(error_callback);
}

function deleteImage(filename, callback=null, error_callback=null) {
    // Deletes an image
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }
	if (filename) {
		firebase.storage().ref(filename).delete().then(callback).catch(error_callback)
	}
}

function addBill(name, amount, imageUrl, callback = null, error_callback = null) {
    // Adds a bill to the database and calls either callback or error_callback accordingly
    // Callback will have the new key as parameter
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }
    var date = JSON.stringify(moment());
    var newKey = firebase.database().ref().child('bills').push().key;
    var updates = {};
    var postData = {
        name: name,
        amount: amount,
        date: date,
        imageUrl: imageUrl
    };

    updates['/bills/' + newKey] = postData;

    firebase.database().ref().update(updates, errors => {
        if (errors) {
            error_callback(errors);
        } else {
            addOrUpdateBillInBillCache(newKey, postData);
			postData.key = newKey;
            callback(postData);
        }
    });

}

function updateBill(key, name, amount, date, imageUrl, callback = null, error_callback = null) {
    // Updates a bill to the database and calls either callback or error_callback accordingly
    // Will pass 'key' to the successful callback
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }
    var updates = {};
    var postData = {
        name: name,
        amount: amount,
        date: JSON.stringify(moment(date)),
        imageUrl: imageUrl
    };

    updates['/bills/' + key] = postData;

    firebase.database().ref().update(updates, errors => {
        if (errors) {
            error_callback(errors);
        } else {
            addOrUpdateBillInBillCache(key, postData);
            callback(key);
        }
    });

}

function deleteBill(key, callback = null, error_callback = null) {
    // Deletes a bill
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }
    firebase.database().ref("bills/" + key).remove(errors => {
        if (errors) {
            error_callback(errors);
        }
        else {
            deleteBillFromCache(key);
            callback();
        }
    });

}

function deleteImageAndBill(key, callback=null, error_callback=null) {
    // First deletes the image then deletes the bill
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }

    deleteBill(key, function() {
        deleteImage(key, callback, error_callback);
    }, error_callback);
}

function uploadImageAndAddBill(key, name, amount, date, imageFile, callback = null, error_callback = null) {
    // Takes a bill name, amount, date, imagefile. Uploads the image and then
    // adds the bill to the database.
    // If the key is given, it will update instead.
    if (!callback) {
        callback = console.log;
    }
    if (!error_callback) {
        error_callback = console.log;
    }

    if (key) {
		if (imageFile) {
			uploadImage(key, imageFile, url => {
				updateBill(key, name, amount, date, url, callback, error_callback);
			}, error_callback);
		} else {
			var oldObj = getBillFromCache(key);
			if (oldObj) {
				updateBill(key, name, amount, date, oldObj.imageUrl, callback, error_callback);
			}
		}
    } else {
        addBill(name, amount, null, obj => {
            uploadImage(obj.key, imageFile, url => {
                updateBill(obj.key, name, amount, obj.date, url, callback, error_callback);
            }, error_callback);

        }, error_callback);
    }
}

init();
