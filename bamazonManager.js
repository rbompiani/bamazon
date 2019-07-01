var inquirer = require("inquirer");
var mysql = require("mysql");

// -------- DATABASE CONNECTION CREDENTIALS------------
var connection = mysql.createConnection({
    host: "localhost",
  
    // Your port; if not 3306
    port: 3306,
  
    // Your username
    user: "root",
  
    // Your password
    password: "password",
    database: "bamazon"
});

// -------- CONNECT TO DATABASE ------------
// create initial database connection -> relay to nav menu

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    menu();
});


// -------- MANAGER MENU ------------
// Ask manager what to do -> route to appropriate function

function menu(){
    inquirer
    .prompt([
        // Ask the manager what to do
        {
        type: "list",
        message: "What would you like to do?",
        choices: ["View Products For Sale","View Low Inventory","Add to Inventory","Add New Product","Exit"],
        name: "toDo"
        }
    ])
    .then(function(inquirerResponse) {
        switch(inquirerResponse.toDo){
            case "View Products For Sale":
                selectAll();
                break;
            case "View Low Inventory":
                selectLow();
                break;
            case "Add to Inventory": 
                stockWarehouse();
                break;
            case "Add New Product":
                addProduct();
                break;
            case "Exit":
                connection.end();
        }
    });
}

// -------- SELECT ALL PRODUCTS ------------
// select all products from the database and console log them

function selectAll() {
    connection.query("SELECT * FROM products", function(err, res) {
        if (err) throw err;
        var products = res;       
        products.forEach(element => {
            console.log("#"+element.item_id+" "+element.product_name+" $"+element.price+ ", quantity: "+element.stock_quantity);
        });
        menu();
    });
}

// -------- SELECT LOW PRODUCTS ------------
// select all products from the database and console log them

function selectLow() {
    connection.query("SELECT * FROM products WHERE stock_quantity < 5", function(err, res) {
        if (err) throw err;
        var products = res;       
        products.forEach(element => {
            console.log("#"+element.item_id+" "+element.product_name+" $"+element.price+ ", quantity: "+element.stock_quantity);
        });
        menu();
    });
}


// -------- SELECT PRODUCT BY ID ------------
// select single item from database by manager chosen id-> route to update database quantities

function selectProduct(id, units) {

    // construct query string with variables
    var sql = "SELECT * FROM ?? WHERE ?? = ?";
    var inserts = ['products', 'item_id', id];
    sql = mysql.format(sql, inserts);

    // query the database for specific product
    connection.query(sql, function(err, res) {
        if (err) throw err;

        //store the product as a variable
        var product = res[0]; 
        var newStock = parseInt(product.stock_quantity)+units;
        updateStock(id, newStock);
        menu();
    });
}


// -------- UPDATE TO INVENTORY ------------
// after purchase, update the database to reflect new quantity available

function updateStock(id, newStock){
    // construct query string with variables
    var stock = "UPDATE products SET stock_quantity = ? WHERE ?? = ?";
    var inserts = [newStock, 'item_id', id];
    stock = mysql.format(stock, inserts); 
    
    connection.query(stock, function(err, res){
        if (err) throw err;
        console.log("Success! You now have "+newStock+" units")
        menu();
    })
}


// -------- MANAGER INVENTORY INPUT ------------
// Ask manager which product to add to, and how many -> route to select identified product

function stockWarehouse(){
    inquirer
    .prompt([
        // Ask manager which product to add stock to
        {
        type: "input",
        message: "Please enter the id # of the product you wish to stock:",
        name: "id"
        },
        // ask manager how many
        {
        type: "input",
        message: "Number of units to add:",
        name: "units"
        }
    ])
    .then(function(inquirerResponse) {
        // select the item from the database
        selectProduct(parseInt(inquirerResponse.id), parseInt(inquirerResponse.units));
    });
}

// -------- NEW PRODUCT ------------
function addProduct(){
    inquirer
    .prompt([
        {
        type: "input",
        message: "Product Name:",
        name: "name"
        },
        {
        type: "input",
        message: "Department:",
        name: "department"
        },
        {
        type: "input",
        message: "Price: $",
        name: "price"
        },
        {
        type: "input",
        message: "Stock Quantity:",
        name: "stock"
        }
    ])
    .then(function(inquirerResponse) {
        //construct query
        var price = parseFloat(inquirerResponse.price);
        price = price.toFixed(2);
        console.log(price);
        var prod = "INSERT INTO products (product_name, department_name, price, stock_quantity) VALUES (?, ?, ?, ?)";
        var inserts = [inquirerResponse.name, inquirerResponse.department, price, parseInt(inquirerResponse.stock)];
        prod = mysql.format(prod, inserts); 

        connection.query(prod, function(err, res){
            if (err) throw err;
            console.log("Success! You now have added "+inquirerResponse.name);
            menu();
        })        

    });
}
  