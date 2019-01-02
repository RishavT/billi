var ALL_PAGES_ID = "pages";
var CURRENT_BILL = null;
var existingBill = false;
var PAGE_IDS = {
    billPageID: 'bill-page',
    allBillsPageID: 'all-bills-page',
	loadingPageID: 'loading-overlay'
};
var DATA = {}

function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function element(id) {
    // Returns document.getElementByID(id)
    return document.getElementById(id);
}

function hideElement(id) {
    // Hides an element
    element(id).style.display = "none";
}

function showElement(id) {
    // Shows an element
    element(id).style.display = "";
}

function hideAllPages() {
    // hides all views for the user
    Object.values(PAGE_IDS).forEach(pageId => {
        hideElement(pageId);
    });
}

function showAllBillsPage() {
    // Switches the user view to the list of bills
    hideAllPages();
    if (isEmpty(ALL_BILLS_CACHE)) {
        getBillsAndRefresh();
    }
    showElement(PAGE_IDS.allBillsPageID);

	// Set values
	headingRowHTML = element("heading-row").outerHTML;
	element("all-bills-table").innerHTML = headingRowHTML;
	Object.values(ALL_BILLS_CACHE).forEach(obj => {
		if (obj) {
			element("all-bills-table").innerHTML += "<tr id='" + obj.key + "'>" + 
				"<td onclick='showThisBillPageOnClick(this)'>" + obj.name + "</td>" + 
				"<td>" + obj.amount + "</td>" + 
				"<td>" + obj.dateVisible + "</td>" + 
				"</tr>";
		}
	});
}

function showBillPage(bill) {
    // Switches the user view to a specific bill
    hideAllPages();
	DATA.existingBill = true;
	DATA.currentBill = bill;

	// Set values
	element("key-input-div").style.dysplay = "";
	element("image-div").style.dysplay = "";
	element("delete-button").style.dysplay = "";

	element("input-el-key").value = bill.key;
	element("input-el-name").value = bill.name;
	element("input-el-amount").value = bill.amount;
	element("dateVisible").value = bill.dateVisible;
	element("image").src = bill.imageUrl;

    showElement(PAGE_IDS.billPageID);
}

function showUploadBillPage() {
    // Switches the user view to the upload form
    hideAllPages();
	DATA.existingBill = false;
    showElement(PAGE_IDS.billPageID);

	// Set values
	element("key-input-div").style.dysplay = "";
	element("image-div").style.dysplay = "";
	element("delete-button").style.dysplay = "";
	
	element("input-el-key").value = '';
	element("input-el-name").value = '';
	element("input-el-amount").value = '';
	element("dateVisible").value = '';
	element("image").src = '';
}

function showThisBillPageOnClick(obj) {
	if (obj && obj.parentElement) {
		var key = obj.parentElement.id;
		if (key) {
			showBillPage(getBillFromCache(key));
		}
	}
}

function addBillOnClick() {
    // Called when the 'Add Bill' button is clicked from the frontend
	DATA.loading = true;
    var key = undefined;
    if (DATA.existingBill) {
        key = element("input-el-key").value;
    }
    var name = element("input-el-name").value;
    var amount = element("input-el-amount").value;
	if (CURRENT_BILL)
    var date = CURRENT_BILL.date;
	else var date = null;
    var imageFile = element("input-el-image-file").files[0];
    if (!name || !amount || (!key && !imageFile)) {
        alert("Please fill up all fields");
		DATA.loading = false;
        return;
    }
    uploadImageAndAddBill(key, name, amount, date, imageFile, key => {
        var bill = getBillFromCache(key);
        showBillPage(bill);
		DATA.loading = false;
    });
}

function deleteBillOnClick() {
	DATA.loading = true;
    var key = element("input-el-key").value;
    callback = function() {
        showAllBillsPage();
		DATA.loading = false;
    }
    deleteImageAndBill(key, callback, callback);
}

function getBillsAndRefresh() {
	DATA.loading = true;
    getBills(function(bills) {
		DATA.loading = false;
    });
}

function checkLoading() {
	if (DATA.loading) {
		element("loading-overlay").style.display = "";
	} else {
		element("loading-overlay").style.display = "none";
	}
}

function init() {
    signInIfRequired(function() {
    });

    navigator.serviceWorker && navigator.serviceWorker.register('./sw.js').then(function(registration) {
        console.log('Excellent, registered with scope: ', registration.scope);
    });
}

init();

window.setInterval(checkLoading, 500);
