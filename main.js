var ALL_PAGES_ID = "pages";
var PAGE_IDS = {
    billPageID: 'bill-page',
    allBillsPageID: 'all-bills-page'
};
var DATA = {};
DATA.loading = false;

function isEmpty(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function updateBindingData() {
    // Updates all global variables with the DATA object
    DATA.currentBill = {};
    DATA.allBills = Object.values(ALL_BILLS_CACHE);
    DATA.userDetails = USER_DETAILS;
	rivetBind({
		data: DATA,
	});
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

function rivetBind(obj) {
    rivets.bind(document.getElementsByTagName("body")[0], obj);
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
}

function showBillPage(bill) {
    // Switches the user view to a specific bill
    hideAllPages();
    DATA.uploadButtonText = "Update Bill";
    DATA.existingBill = true;
    DATA.currentBill = bill;
    showElement(PAGE_IDS.billPageID);
}

function showUploadBillPage() {
    // Switches the user view to the upload form
    hideAllPages();
    DATA.uploadButtonText = "Add Bill";
    DATA.existingBill = false;
    showElement(PAGE_IDS.billPageID);
}

function showThisBillPageOnClick(event, item) {
    showBillPage(item.bill);
}

function addBillOnClick(event, item) {
    // Called when the 'Add Bill' button is clicked from the frontend
    DATA.loading = true;
    var key = undefined;
    if (DATA.existingBill) {
        key = element("input-el-key").value;
    }
    var name = element("input-el-name").value;
    var amount = element("input-el-amount").value;
    var imageFile = element("input-el-image-file").files[0];
	if (!name || !amount || (!key && !imageFile)) {
		alert("Please fill up all fields");
		DATA.loading = false;
		return;
	}
    uploadImageAndAddBill(key, name, amount, imageFile, key => {
        var bill = getBillFromCache(key);
        updateBindingData();
        DATA.loading = false;
        showBillPage(bill);
    });
}

function deleteBillOnClick(event, item) {
    DATA.loading = true;
    var key = element("input-el-key").value;
	callback = function() {
        updateBindingData();
        DATA.loading = false;
        showAllBillsPage();
    }
    deleteImageAndBill(key, callback, callback);
}

function getBillsAndRefresh() {
    DATA.loading = true;
    getBills(function(bills) {
        updateBindingData();
        DATA.loading = false;
    });
}

function init() {
    rivets.binders.src = function(el, value) {
        el.src = value;
    };
    signInIfRequired(function() {
        rivetBind({
            data: DATA,
            showThisBillPage: showThisBillPageOnClick,
            addBill: addBillOnClick,
            deleteBill: deleteBillOnClick,
            showAllBillsPage: showAllBillsPage,
            showUploadBillPage: showUploadBillPage
        });
        updateBindingData();
    });

    navigator.serviceWorker && navigator.serviceWorker.register('./sw.js').then(function(registration) {
        console.log('Excellent, registered with scope: ', registration.scope);
    });
}

init();
